/**
 * Configuration du Quiz Éco KDM
 * Toutes les données sont dans le Google Sheet
 */

const CONFIG = {
    sheetUrl: 'https://script.google.com/macros/s/AKfycbzE4npctaZ7I7bZfyTCdxkZACe3jFfaqDlEUzPo2Z0hb71cGirnjiL1OH5nbdFpxYGm8w/exec'
};

// Ces variables seront remplies depuis le Sheet
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
        
        // Mettre à jour les settings
        SETTINGS.voteDuration = parseInt(data.settings.voteDuration) || 120;
        SETTINGS.explainDuration = parseInt(data.settings.explainDuration) || 60;
        SETTINGS.mode = data.settings.mode || 'session';
        SETTINGS.startTime = data.settings.startTime ? parseInt(data.settings.startTime) : null;
        
        // Mettre à jour les questions
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
    
    const cycleLength = SETTINGS.voteDuration + SETTINGS.explainDuration;
    const totalCycleLength = cycleLength * QUESTIONS.length;
    
    // Position dans le cycle (avec boucle)
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
    
    return {
        questionIndex,
        phase,
        timeRemaining: Math.ceil(timeRemaining),
        totalElapsed: Math.floor(elapsed),
        currentQuestion: QUESTIONS[questionIndex] || null
    };
}

/**
 * Formate un temps en secondes en MM:SS
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
