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
    startTime: null
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

    // GESTION PREMIÈRE QUESTION (mode session uniquement)
    if (window.state && window.state.isFirstQuestion && SETTINGS.mode === 'session') {
        const FIRST_VOTE_DURATION = 20;  // 20 secondes pour la première question
        
        if (elapsed < FIRST_VOTE_DURATION) {
            // Phase de vote de la Q1
            return {
                questionIndex: 0,
                phase: 'vote',
                timeRemaining: Math.ceil(FIRST_VOTE_DURATION - elapsed),
                totalElapsed: Math.floor(elapsed),
                currentQuestion: QUESTIONS[0] || null,
                finished: false,
                explainProgress: 0
            };
        } else if (elapsed < FIRST_VOTE_DURATION + SETTINGS.explainDuration) {
            // Phase d'explication de la Q1
            const timeInExplain = elapsed - FIRST_VOTE_DURATION;
            return {
                questionIndex: 0,
                phase: 'explain',
                timeRemaining: Math.ceil(SETTINGS.explainDuration - timeInExplain),
                totalElapsed: Math.floor(elapsed),
                currentQuestion: QUESTIONS[0] || null,
                finished: false,
                explainProgress: timeInExplain / SETTINGS.explainDuration
            };
        } else {
            // Fin de la première question, désactiver le flag
            if (window.state) window.state.isFirstQuestion = false;
            
            // Ajuster le referenceTime pour les questions suivantes
            const firstQuestionDuration = FIRST_VOTE_DURATION + SETTINGS.explainDuration;
            const adjustedElapsed = elapsed - firstQuestionDuration;
            const normalCycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
            
            // Continuer normalement à partir de Q2
            const questionIndex = 1 + Math.floor(adjustedElapsed / normalCycleLength);
            const positionInQuestion = adjustedElapsed % normalCycleLength;
            
            let phase, timeRemaining, explainProgress = 0;
            
            if (positionInQuestion < SETTINGS.voteDuration) {
                phase = 'vote';
                timeRemaining = SETTINGS.voteDuration - positionInQuestion;
            } else {
                phase = 'explain';
                const timeInExplain = positionInQuestion - SETTINGS.voteDuration;
                timeRemaining = normalCycleLength - positionInQuestion;
                explainProgress = timeInExplain / SETTINGS.explainDuration;
            }
            
            return {
                questionIndex,
                phase,
                timeRemaining: Math.ceil(timeRemaining),
                totalElapsed: Math.floor(elapsed),
                currentQuestion: QUESTIONS[questionIndex] || null,
                finished: questionIndex >= QUESTIONS.length,
                explainProgress
            };
        }
    }

    // SUITE DU CODE NORMAL (mode loop ou après Q1)
    const cycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
    const totalCycleLength = cycleLength * QUESTIONS.length;

    if (QUESTIONS.length === 0 || totalCycleLength === 0) {
        return {
            questionIndex: 0, phase: 'vote', timeRemaining: 0,
            totalElapsed: 0, currentQuestion: null, finished: false, explainProgress: 0
        };
    }

    if (SETTINGS.mode === 'session' && elapsed > 0 && elapsed >= totalCycleLength) {
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

    const positionInTotal = ((elapsed % totalCycleLength) + totalCycleLength) % totalCycleLength;
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
