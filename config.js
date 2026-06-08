/**
 * Configuration du Quiz Éco KDM
 * v5 - Ajout getCurrentTour(), gestion fin de quiz, trigger calcul scores
 */
const CONFIG = {
    sheetUrl: 'https://script.google.com/macros/s/AKfycbzE4npctaZ7I7bZfyTCdxkZACe3jFfaqDlEUzPo2Z0hb71cGirnjiL1OH5nbdFpxYGm8w/exec'
};

let QUESTIONS = [];
let SETTINGS = {
    voteDuration: 120,
    explainDuration: 60,
    mode: 'session',
    startTime: null,
    firstQuestionDelay: 120,  // ← NOUVEAU : 2 minutes pour les consignes
discussionTimeSup: 0,
interDiscussionTime: 0
};

/**
 * Charge toute la config depuis le Google Sheet
 */
async function loadConfigFromSheet() {
    try {
        const response = await fetch(CONFIG.sheetUrl + '?action=getFullConfig');
        const data = await response.json();

        if (data.error) {
            console.error('Erreur chargement config:', data.error);
            return false;
        }

        SETTINGS.voteDuration = parseInt(data.settings.voteDuration) || 120;
        SETTINGS.explainDuration = parseInt(data.settings.explainDuration) || 60;
        SETTINGS.mode = data.settings.mode || 'session';
        SETTINGS.startTime = data.settings.startTime ? parseInt(data.settings.startTime) : null;
        SETTINGS.firstQuestionDelay = parseInt(data.settings.firstQuestionDelay) || 0;  // ← NOUVEAU
        SETTINGS.discussionTimeSup = parseInt(data.settings.DiscussionTimeSup) || 0;
        SETTINGS.interDiscussionTime = parseInt(data.settings.InterDiscussionTime) || 0;

        QUESTIONS = data.questions || [];

        console.log('Config chargée depuis Sheet:', {
            settings: SETTINGS,
            questionsCount: QUESTIONS.length
        });

        return true;
    } catch (error) {
        console.error('Erreur fetch config:', error);
        return false;
    }
}

/**
 * Calcule l'état actuel du quiz basé sur l'heure de référence
 */
function getQuizState(referenceTime) {
    const now = Date.now();
    const elapsed = (now - referenceTime) / 1000;

    let adjustedElapsed = elapsed;
    if (SETTINGS.mode === 'session' && SETTINGS.firstQuestionDelay > 0) {
        adjustedElapsed = Math.max(0, elapsed - SETTINGS.firstQuestionDelay);
    }

    const cycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
    const disc = SETTINGS.discussionTimeSup || 0;
    const interDisc = SETTINGS.interDiscussionTime || 0;
    const nQ = QUESTIONS.length;

    if (nQ === 0 || cycleLength === 0) {
        return { questionIndex: 0, phase: 'vote', timeRemaining: 0,
            totalElapsed: 0, currentQuestion: null, finished: false,
            explainProgress: 0, absoluteQuestionIndex: 0 };
    }

    // Durée d'un bloc : interDisc questions + 1 pause
    // Si pas de discussion, un bloc = toutes les questions sans pause
    const blockSize = (interDisc > 0 && disc > 0) ? interDisc : 0;
    const blockDuration = blockSize > 0 ? blockSize * cycleLength + disc : nQ * cycleLength;

    // Mode session : totalDuration = nQ questions avec pauses aux bons endroits
    // Mode loop : période = blockDuration (on boucle sur un bloc)
    let totalDuration;
    if (blockSize > 0) {
        const fullBlocks = Math.floor(nQ / blockSize);
        const remainder = nQ % blockSize;
        totalDuration = fullBlocks * blockDuration + remainder * cycleLength;
    } else {
        totalDuration = nQ * cycleLength;
    }

    // Fin de quiz (mode session uniquement)
    if (SETTINGS.mode === 'session' && adjustedElapsed >= totalDuration && adjustedElapsed > 0) {
        return { questionIndex: nQ - 1, phase: 'finished', timeRemaining: 0,
            totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[nQ - 1] || null,
            finished: true, explainProgress: 1, absoluteQuestionIndex: nQ - 1 };
    }

    // En mode loop : position dans le bloc courant + compteur absolu de questions
    // La période est blockDuration, le compteur absolu ne reboucle PAS sur nQ mais sur blockSize
    let position, absQOffset;
    if (blockSize > 0) {
        // Combien de blocs complets écoulés ?
        const totalBlocs = Math.floor(Math.max(0, adjustedElapsed) / blockDuration);
        absQOffset = totalBlocs * blockSize; // questions absolues avant ce bloc
        position = Math.max(0, adjustedElapsed) - totalBlocs * blockDuration;
    } else {
        absQOffset = 0;
        position = SETTINGS.mode === 'session'
            ? Math.max(0, adjustedElapsed)
            : ((adjustedElapsed % totalDuration) + totalDuration) % totalDuration;
    }

    // Itérer les questions du bloc courant
    let cursor = 0;
    for (let j = 0; j < (blockSize > 0 ? blockSize : nQ); j++) {
        const absQ = absQOffset + j;
        const qIndex = absQ % nQ;
        const voteEnd = cursor + SETTINGS.voteDuration;
        const explainEnd = cursor + cycleLength;

        if (position < voteEnd) {
            return { questionIndex: qIndex, phase: 'vote',
                timeRemaining: Math.ceil(voteEnd - position),
                totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[qIndex],
                finished: false, explainProgress: 0, absoluteQuestionIndex: absQ };
        }
        if (position < explainEnd) {
            return { questionIndex: qIndex, phase: 'explain',
                timeRemaining: Math.ceil(explainEnd - position),
                totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[qIndex],
                finished: false, explainProgress: (position - voteEnd) / SETTINGS.explainDuration,
                absoluteQuestionIndex: absQ };
        }
        cursor = explainEnd;
    }

    // Phase discussion (fin du bloc)
    if (blockSize > 0 && disc > 0) {
        const lastAbsQ = absQOffset + blockSize - 1;
        const lastQIndex = lastAbsQ % nQ;
        return { questionIndex: lastQIndex, phase: 'discussion',
            timeRemaining: Math.ceil(blockDuration - position),
            totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[lastQIndex],
            finished: false, explainProgress: 1, absoluteQuestionIndex: lastAbsQ };
    }

    // Fallback
    return { questionIndex: nQ - 1, phase: 'finished', timeRemaining: 0,
        totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[nQ - 1],
        finished: true, explainProgress: 1, absoluteQuestionIndex: nQ - 1 };
}

/**
 * Calcule le numéro de tour actuel
 * Un tour = un passage complet sur toutes les questions
 * Tour 1 = premier passage, Tour 2 = deuxième passage, etc.
 */
function getCurrentTour(referenceTime) {
    const now = Date.now();
    const elapsed = (now - referenceTime) / 1000;

    const cycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
    const disc = SETTINGS.discussionTimeSup || 0;
    const interDisc = SETTINGS.interDiscussionTime || 0;
    const nQ = QUESTIONS.length;
    if (nQ === 0) return 1;

    const blockSize = (interDisc > 0 && disc > 0) ? interDisc : 0;
    let totalDuration;
    if (blockSize > 0) {
        const fullBlocks = Math.floor(nQ / blockSize);
        const remainder = nQ % blockSize;
        totalDuration = fullBlocks * (blockSize * cycleLength + disc) + remainder * cycleLength;
    } else {
        totalDuration = nQ * cycleLength;
    }
    if (totalDuration === 0) return 1;

    return Math.floor(elapsed / totalDuration) + 1;
}

/**
 * Formate un temps en secondes en MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
