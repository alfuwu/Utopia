import rocketLogo from '/rocket.png'
import { level, goToNextPage, goToPreviousPage } from './main.js'
import { speciesStats } from './constants';

export function setupPage() {
    document.querySelector('#app').innerHTML = `
    <div>
        <img src="${rocketLogo}" class="logo" alt="Discord" />
        <h1>Utopia TTRPG</h1>
        
        <div id="loading" style="display: none;">Loading PDF...</div>

        <div id="progress-container" style="display: none;">
            <progress id="progress-bar" value="0" max="100"></progress>
        </div>
        
        <div id="pdf-container"></div>

        <div id="character-creation">
            <h2>Character Creation</h2>
            
            <label for="species">Select Species:</label>
            <select id="species" name="species">
                <!-- Species options are dynamically generated -->
            </select>

            <h3>Base Stats</h3>
            <div>
                <label>Constitution:</label>
                <span id="constitution">0</span>
            </div>
            <div>
                <label>Endurance:</label>
                <span id="endurance">0</span>
            </div>
            <div>
                <label>Effervescence:</label>
                <span id="effervescence">0</span>
            </div>
            <div>
                <label>Block Rating:</label>
                <span id="blockRating">0</span>
            </div>
            <div>
                <label>Dodge Rating:</label>
                <span id="dodgeRating">0</span>
            </div>

            <h3>Talent Points</h3>
            <div>
                <label>Total Talent Points:</label>
                <span id="talentPoints">0</span>
            </div>
            <div>
                <label>Body:</label>
                <input type="number" id="body" value="0">
            </div>
            <div>
                <label>Mind:</label>
                <input type="number" id="mind" value="0">
            </div>
            <div>
                <label>Soul:</label>
                <input type="number" id="soul" value="0">
            </div>

            <h3>Derived Stats</h3>
            <div>
                <label>SHP:</label>
                <span id="shp">0</span>
            </div>
            <div>
                <label>Stamina:</label>
                <span id="stamina">0</span>
            </div>
            <div>
                <label>DHP:</label>
                <span id="dhp">0</span>
            </div>
        </div>
    </div>
    `;
    generateSpeciesList();
    updateBaseStats();

    document.getElementById("species").onchange = updateBaseStats;

    const body = document.getElementById("body");
    const mind = document.getElementById("mind");
    const soul = document.getElementById("soul");
    body.addEventListener('keydown', (event) => cancelInvalidNumberInputs(event));
    mind.addEventListener('keydown', cancelInvalidNumberInputs);
    soul.addEventListener('keydown', cancelInvalidNumberInputs);
    body.addEventListener('input', () => {
        let bodyStat = parseInt(body.value) || 0;
        const mindStat = parseInt(mind.value) || 0;
        const soulStat = parseInt(soul.value) || 0;
        if (bodyStat + mindStat + soulStat > level)
            bodyStat = level - (mindStat + soulStat);
        body.value = Math.max(bodyStat, 0).toFixed(0);
        calculateDerivedStats();
    });
    mind.addEventListener('input', () => {
        const bodyStat = parseInt(body.value) || 0;
        let mindStat = parseInt(mind.value) || 0;
        const soulStat = parseInt(soul.value) || 0;
        if (bodyStat + mindStat + soulStat > level)
            mindStat = level - (bodyStat + soulStat);
        mind.value = Math.max(mindStat, 0).toFixed(0);
        calculateDerivedStats();
    });
    soul.addEventListener('input', () => {
        const bodyStat = parseInt(body.value) || 0;
        const mindStat = parseInt(mind.value) || 0;
        let soulStat = parseInt(soul.value) || 0;
        if (bodyStat + mindStat + soulStat > level)
            soulStat = level - (bodyStat + mindStat);
        soul.value = Math.max(soulStat, 0).toFixed(0);
        calculateDerivedStats();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'w')
            goToNextPage(event);
        else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 's')
            goToPreviousPage(event);
    });

    document.getElementById('pdf-container').addEventListener('click', (event) => {
        const pdfContainer = document.getElementById('pdf-container');
        const clickX = event.clientX;
        const containerWidth = pdfContainer.offsetWidth;
        // if click is on the right side of the container, go to the next page
        if (clickX - pdfContainer.offsetLeft > containerWidth / 2)
            goToNextPage(event);
        else // if click is on the left side, go to the previous page
            goToPreviousPage(event);
    });
}

function cancelInvalidNumberInputs(event) {
    if (event.key === '.' || event.key === '-')
        event.preventDefault();
} 

export function generateSpeciesList() {
  const speciesSelect = document.getElementById("species");
  
  // Clear any existing options in case this function is called multiple times
  speciesSelect.innerHTML = '';
  
  // Loop through speciesStats and create an option for each species
  for (const species in speciesStats) {
    const option = document.createElement('option');
    option.value = species; // The key in speciesStats
    option.textContent = capitalizeFirstLetter(species).replace('_', '-').replace(/([A-Z])/g, ' $1').trim();
    speciesSelect.appendChild(option);
  }
}
  
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
  
// Update base stats when species is selected
export function updateBaseStats() {
  const selectedSpecies = document.getElementById("species").value;
  const stats = speciesStats[selectedSpecies];

  // Set the base stats in the UI
  document.getElementById("constitution").textContent = stats.constitution;
  document.getElementById("endurance").textContent = stats.endurance;
  document.getElementById("effervescence").textContent = stats.effervescence;
  document.getElementById("blockRating").textContent = stats.blockRating[0].toFixed(0) + 'd' + stats.blockRating[1].toFixed(0);
  document.getElementById("dodgeRating").textContent = stats.dodgeRating[0].toFixed(0) + 'd' + stats.dodgeRating[1].toFixed(0);

  // Recalculate derived stats
  calculateDerivedStats();
}

// Calculate SHP, Stamina, and DHP based on Talent distribution
export function calculateDerivedStats() {
  const bodyStat = parseInt(document.getElementById("body").value) || 0;
  const mindStat = parseInt(document.getElementById("mind").value) || 0;
  const soulStat = parseInt(document.getElementById("soul").value) || 0;
  document.getElementById("talentPoints").textContent = level - (bodyStat + mindStat + soulStat);
  
  const constitution = parseInt(document.getElementById("constitution").textContent) || 0;
  const endurance = parseInt(document.getElementById("endurance").textContent) || 0;
  const effervescence = parseInt(document.getElementById("effervescence").textContent) || 0;

  // Derived stats calculations
  const shp = (bodyStat * constitution) + level;
  const stamina = (mindStat * endurance) + level;
  const dhp = (soulStat * effervescence) + level;

  // Display the derived stats
  document.getElementById("shp").textContent = shp;
  document.getElementById("stamina").textContent = stamina;
  document.getElementById("dhp").textContent = dhp;
}