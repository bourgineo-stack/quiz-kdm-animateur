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
    firstQuestionDelay: 120  // ← NOUVEAU : 2 minutes pour les consignes
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

    // ✅ NOUVEAU : Ajouter le délai première question (mode session uniquement)
    let adjustedElapsed = elapsed;
    if (SETTINGS.mode === 'session' && SETTINGS.firstQuestionDelay > 0) {
        adjustedElapsed = Math.max(0, elapsed - SETTINGS.firstQuestionDelay);
    }

    const cycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
    const totalCycleLength = cycleLength * QUESTIONS.length;

    if (QUESTIONS.length === 0 || totalCycleLength === 0) {
        return {
            questionIndex: 0, phase: 'vote', timeRemaining: 0,
            totalElapsed: 0, currentQuestion: null, finished: false, explainProgress: 0
        };
    }

    // Détection fin de quiz
    if (SETTINGS.mode === 'session' && adjustedElapsed > 0 && adjustedElapsed >= totalCycleLength) {
        return {
            questionIndex: QUESTIONS.length - 1,
            phase: 'finished',
            timeRemaining: 0,
            totalElapsed: Math.floor(elapsed),
            currentQuestion: QUESTIONS[QUESTIONS.length - 1] || null,
            finished: true,
            explainProgress: 1
        };
    }

    // Position dans le cycle (avec boucle pour mode loop)
    const positionInTotal = ((adjustedElapsed % totalCycleLength) + totalCycleLength) % totalCycleLength;
    const questionIndex = Math.floor(positionInTotal / cycleLength);
    const positionInQuestion = positionInTotal % cycleLength;

    let phase, timeRemaining;

    if (positionInQuestion < SETTINGS.voteDuration) {
        phase = 'vote';
        timeRemaining = SETTINGS.voteDuration - positionInQuestion;
    } else {
        phase = 'explain';
        timeRemaining = cycleLength - positionInQuestion;
    }

    let explainProgress = 0;
    if (phase === 'explain') {
        const timeInExplain = positionInQuestion - SETTINGS.voteDuration;
        explainProgress = timeInExplain / SETTINGS.explainDuration;
    }

    return {
        questionIndex,
        phase,
        timeRemaining: Math.ceil(timeRemaining),
        totalElapsed: Math.floor(elapsed),
        currentQuestion: QUESTIONS[questionIndex] || null,
        finished: false,
        explainProgress
    };
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
