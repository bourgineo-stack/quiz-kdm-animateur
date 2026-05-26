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

    if (QUESTIONS.length === 0 || cycleLength === 0) {
        return { questionIndex: 0, phase: 'vote', timeRemaining: 0,
            totalElapsed: 0, currentQuestion: null, finished: false, explainProgress: 0 };
    }

    // Calculer la durée totale en tenant compte des pauses
    let totalDuration = 0;
    for (let i = 0; i < QUESTIONS.length; i++) {
        totalDuration += cycleLength;
        // Pause APRÈS la question (i+1) si multiple de interDisc, sauf après la dernière
        if (disc > 0 && interDisc > 0 && (i + 1) % interDisc === 0 && i < QUESTIONS.length - 1) {
            totalDuration += disc;
        }
    }

    // Fin de quiz
    if (SETTINGS.mode === 'session' && adjustedElapsed >= totalDuration && adjustedElapsed > 0) {
        return { questionIndex: QUESTIONS.length - 1, phase: 'finished', timeRemaining: 0,
            totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[QUESTIONS.length - 1] || null,
            finished: true, explainProgress: 1 };
    }

    // Mode loop : boucle sur totalDuration
    const positionInTotal = SETTINGS.mode === 'session'
        ? Math.max(0, adjustedElapsed)
        : ((adjustedElapsed % totalDuration) + totalDuration) % totalDuration;

    // Itérer question par question pour trouver la position
    let cursor = 0;
    for (let i = 0; i < QUESTIONS.length; i++) {
        const voteEnd = cursor + SETTINGS.voteDuration;
        const explainEnd = voteEnd + SETTINGS.explainDuration;
        const hasDiscussion = disc > 0 && interDisc > 0 && (i + 1) % interDisc === 0 && i < QUESTIONS.length - 1;
        const discEnd = hasDiscussion ? explainEnd + disc : explainEnd;

        if (positionInTotal < voteEnd) {
            return { questionIndex: i, phase: 'vote',
                timeRemaining: Math.ceil(voteEnd - positionInTotal),
                totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[i], finished: false, explainProgress: 0 };
        }
        if (positionInTotal < explainEnd) {
            const timeInExplain = positionInTotal - voteEnd;
            return { questionIndex: i, phase: 'explain',
                timeRemaining: Math.ceil(explainEnd - positionInTotal),
                totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[i], finished: false,
                explainProgress: timeInExplain / SETTINGS.explainDuration };
        }
        if (hasDiscussion && positionInTotal < discEnd) {
            return { questionIndex: i, phase: 'discussion',
                timeRemaining: Math.ceil(discEnd - positionInTotal),
                totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[i], finished: false, explainProgress: 1 };
        }
        cursor = discEnd;
    }

    // Fallback
    return { questionIndex: QUESTIONS.length - 1, phase: 'finished', timeRemaining: 0,
        totalElapsed: Math.floor(elapsed), currentQuestion: QUESTIONS[QUESTIONS.length - 1], finished: true, explainProgress: 1 };
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
    const totalCycleLength = cycleLength * QUESTIONS.length;

    return Math.floor(elapsed / totalCycleLength) + 1;
}

/**
 * Formate un temps en secondes en MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
