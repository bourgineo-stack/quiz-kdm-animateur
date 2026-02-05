/**
 * Configuration du Quiz Éco KDM
 * Ce fichier est partagé entre participant et animateur
 */

const CONFIG = {
    // Durées en secondes
    voteDuration: 120,        // 2 min pour voter
    explainDuration: 60,      // 1 min pour l'explication
    // Total par question = 3 min

    // Google Sheet
    sheetUrl: 'https://script.google.com/macros/s/AKfycbzE4npctaZ7I7bZfyTCdxkZACe3jFfaqDlEUzPo2Z0hb71cGirnjiL1OH5nbdFpxYGm8w/exec',
    
    // Mode : 'loop' (boucle infinie) ou 'session' (début fixe)
    mode: 'session',
    
    // Équipes
    teams: {
        blue: { name: 'Équipe Bleue', emoji: '🚌', color: '#1E88E5' },
        red: { name: 'Équipe Rouge', emoji: '🚋', color: '#E53935' }
    }
};

const QUESTIONS = [
    {
        id: 1,
        text: "Combien coûte réellement une voiture par mois en moyenne (achat, assurance, carburant, entretien) ?",
        options: ["200 €", "400 €", "600 €", "800 €"],
        correct: 2, // Index 0-based, donc "600 €"
        info: `<p>D'après l'Automobile Club, le coût réel d'une voiture est en moyenne de <span class="highlight">600€ par mois</span>, soit plus de <strong>7 000€ par an</strong> !</p>
<p>Ce montant inclut : achat/crédit (250€), carburant (150€), assurance (70€), entretien (80€), stationnement (30€), dépréciation (50€).</p>
<p>C'est souvent le <strong>2ème poste de dépense</strong> des ménages français, juste après le logement.</p>
<p>💡 <strong>Bon à savoir :</strong> Un abonnement Divia annuel coûte environ <span class="highlight">380€/an</span>, soit plus de <strong>6 000€ d'économies</strong> par rapport à la voiture !</p>`
    },
    {
        id: 2,
        text: "Quel pourcentage d'économie réalise-t-on en baissant son chauffage de 1°C ?",
        options: ["3%", "5%", "7%", "Ça dépend de l'isolation"],
        correct: 3,
        info: `<p>La règle des <span class="highlight">7% d'économie par degré</span> est souvent citée, mais la réalité est plus nuancée.</p>
<p><strong>Pour un logement bien isolé :</strong> les économies en pourcentage sont <em>encore plus importantes</em> (8-10%) car les apports gratuits (soleil, appareils) comptent plus.</p>
<p><strong>Pour un logement mal isolé :</strong> les économies absolues sont plus grandes mais le pourcentage peut être légèrement inférieur (5-6%).</p>
<p>💡 <strong>Conseil :</strong> Baisser de 19°C à 18°C la nuit permet d'économiser environ <span class="highlight">100€ par an</span>.</p>
<p><em>Source : Enertech / négaWatt</em></p>`
    },
    {
        id: 3,
        text: "Combien de litres d'eau faut-il pour produire 1 kg de bœuf ?",
        options: ["1 500 L", "5 000 L", "10 000 L", "15 000 L"],
        correct: 3,
        info: `<p>La production d'1 kg de bœuf nécessite environ <span class="highlight">15 000 litres d'eau</span> !</p>
<p>Ce chiffre inclut : l'eau pour faire pousser les céréales qui nourrissent l'animal, l'abreuvement, et la transformation.</p>
<p><strong>Comparaison :</strong></p>
<ul>
<li>1 kg de poulet : 4 000 L</li>
<li>1 kg de légumes : 300 L</li>
<li>1 kg de céréales : 1 500 L</li>
</ul>
<p>💡 Réduire sa consommation de viande rouge est l'un des gestes les plus efficaces pour l'environnement.</p>`
    },
    {
        id: 4,
        text: "Quelle est la durée de vie moyenne d'un smartphone en France ?",
        options: ["1 an", "2 ans", "3 ans", "5 ans"],
        correct: 1,
        info: `<p>En France, un smartphone est gardé en moyenne <span class="highlight">2 ans</span> alors que sa durée de vie technique peut dépasser 5 ans.</p>
<p><strong>Le problème :</strong> 80% de l'impact environnemental d'un smartphone vient de sa <em>fabrication</em>, pas de son utilisation.</p>
<p>💡 <strong>Astuces pour allonger la durée de vie :</strong></p>
<ul>
<li>Utiliser une coque et un verre trempé</li>
<li>Remplacer la batterie plutôt que le téléphone</li>
<li>Acheter reconditionné</li>
</ul>
<p>Garder son téléphone 4 ans au lieu de 2 réduit son impact de <span class="highlight">50%</span>.</p>`
    },
    {
        id: 5,
        text: "Quel est le montant maximum du Forfait Mobilités Durables (FMD) ?",
        options: ["400 €/an", "600 €/an", "800 €/an", "900 €/an"],
        correct: 3,
        info: `<p>Le FMD peut atteindre <span class="highlight">900€ par an</span> exonérés d'impôts et de charges sociales !</p>
<p><strong>Ce qu'il couvre :</strong></p>
<ul>
<li>Vélo personnel ou en location</li>
<li>Covoiturage (conducteur ou passager)</li>
<li>Transports en commun (hors abonnement classique)</li>
<li>Trottinettes et autres engins en free-floating</li>
</ul>
<p>💡 <strong>Cumul possible :</strong> Le FMD peut se cumuler avec le remboursement de 50% de l'abonnement transport, jusqu'à un plafond de 900€.</p>
<p><em>Renseignez-vous auprès de votre employeur !</em></p>`
    },
    {
        id: 6,
        text: "Quel mode de transport émet le moins de CO2 par km et par passager ?",
        options: ["Voiture électrique", "TER", "Bus urbain", "Tramway"],
        correct: 3,
        info: `<p>Le <span class="highlight">tramway</span> est le champion avec seulement <strong>3g CO2/km/passager</strong>.</p>
<p><strong>Comparatif des émissions :</strong></p>
<table>
<tr><th>Transport</th><th>g CO2/km/passager</th></tr>
<tr><td>Tramway</td><td>3g</td></tr>
<tr><td>TER</td><td>6g</td></tr>
<tr><td>Bus urbain</td><td>100g</td></tr>
<tr><td>Voiture électrique</td><td>20g</td></tr>
<tr><td>Voiture thermique</td><td>120g</td></tr>
</table>
<p>💡 Le tramway de Divia fonctionne à l'électricité et transporte jusqu'à 300 passagers !</p>`
    },
    {
        id: 7,
        text: "Combien économise-t-on par an en remplaçant 5 trajets voiture/semaine par le bus ?",
        options: ["500 €", "1 500 €", "3 000 €", "5 000 €"],
        correct: 2,
        info: `<p>Remplacer 5 trajets voiture par semaine par le bus permet d'économiser environ <span class="highlight">3 000€ par an</span>.</p>
<p><strong>Le calcul :</strong></p>
<ul>
<li>Coût voiture : ~0.50€/km (carburant + usure + assurance au prorata)</li>
<li>5 trajets x 10km x 2 (aller-retour) x 52 semaines = 5 200 km</li>
<li>Coût voiture : 2 600€</li>
<li>Abonnement Divia : 380€</li>
<li>Économie : ~2 200€ + frais de parking évités</li>
</ul>
<p>💡 Sans compter les économies sur le parking et le stress en moins !</p>`
    },
    {
        id: 8,
        text: "Quelle part de l'empreinte carbone d'un smartphone vient de sa fabrication ?",
        options: ["30%", "50%", "70%", "80%"],
        correct: 3,
        info: `<p><span class="highlight">80%</span> de l'empreinte carbone d'un smartphone vient de sa fabrication !</p>
<p><strong>Pourquoi ?</strong></p>
<ul>
<li>Extraction de terres rares (Chine, Congo...)</li>
<li>Fabrication des composants (Asie)</li>
<li>Assemblage et transport</li>
</ul>
<p>Les 20% restants correspondent à l'utilisation (recharge) sur toute sa durée de vie.</p>
<p>💡 <strong>Conclusion :</strong> Le geste le plus écolo est de garder son téléphone le plus longtemps possible, pas de le recharger moins souvent !</p>`
    },
    {
        id: 9,
        text: "Quel est le coût moyen d'un repas fait maison vs. livré ?",
        options: ["2x moins cher", "3x moins cher", "4x moins cher", "5x moins cher"],
        correct: 1,
        info: `<p>Un repas fait maison coûte en moyenne <span class="highlight">3 fois moins cher</span> qu'un repas livré.</p>
<p><strong>Exemple concret :</strong></p>
<ul>
<li>Repas livré (burger + frites) : 15-20€</li>
<li>Même repas fait maison : 5-7€</li>
</ul>
<p><strong>En plus du prix :</strong></p>
<ul>
<li>Moins d'emballages</li>
<li>Pas de trajet du livreur</li>
<li>Souvent meilleur pour la santé</li>
</ul>
<p>💡 Sur un an, cuisiner au lieu de commander 2x/semaine = <span class="highlight">1 500€ d'économies</span>.</p>`
    },
    {
        id: 10,
        text: "Combien de kg de CO2 évite-t-on par an en prenant les transports en commun au lieu de la voiture ?",
        options: ["500 kg", "1 000 kg", "1 500 kg", "2 000 kg"],
        correct: 2,
        info: `<p>Prendre les transports en commun au lieu de la voiture évite environ <span class="highlight">1 500 kg de CO2 par an</span>.</p>
<p><strong>Le calcul (pour 10 000 km/an) :</strong></p>
<ul>
<li>Voiture thermique : ~1 700 kg CO2</li>
<li>Bus/tram : ~200 kg CO2</li>
<li>Différence : 1 500 kg</li>
</ul>
<p>💡 <strong>Pour visualiser :</strong> 1 500 kg de CO2, c'est l'équivalent de :</p>
<ul>
<li>1 aller-retour Paris-New York en avion</li>
<li>750 kg de viande de bœuf</li>
<li>15 000 km en TGV</li>
</ul>
<p>Chaque trajet compte ! 🌱</p>`
    }
];

/**
 * Calcule l'état actuel du quiz basé sur l'heure de référence
 * @param {number} referenceTime - Timestamp de début (ms) depuis le Sheet
 * @returns {Object} { questionIndex, phase, timeRemaining, totalElapsed }
 */
function getQuizState(referenceTime) {
    const now = Date.now();
    const elapsed = (now - referenceTime) / 1000; // en secondes
    
    const cycleLength = CONFIG.voteDuration + CONFIG.explainDuration;
    const totalCycleLength = cycleLength * QUESTIONS.length;
    
    // Position dans le cycle (avec boucle)
    const positionInTotal = elapsed % totalCycleLength;
    const questionIndex = Math.floor(positionInTotal / cycleLength);
    const positionInQuestion = positionInTotal % cycleLength;
    
    let phase, timeRemaining;
    
    if (positionInQuestion < CONFIG.voteDuration) {
        phase = 'vote';
        timeRemaining = CONFIG.voteDuration - positionInQuestion;
    } else {
        phase = 'explain';
        timeRemaining = cycleLength - positionInQuestion;
    }
    
    return {
        questionIndex,
        phase,
        timeRemaining: Math.ceil(timeRemaining),
        totalElapsed: Math.floor(elapsed),
        currentQuestion: QUESTIONS[questionIndex]
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
