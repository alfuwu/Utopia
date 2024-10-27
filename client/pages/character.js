import { applyModifier, characterData, game } from "../main";
import Page from "./page";

export default class Character extends Page {
  constructor() {
    super('character');

    document.querySelectorAll('.increment button').forEach(button => {
      button.addEventListener('click', () => {
        const valueElement = button.parentElement.nextElementSibling;
        const val = parseInt(valueElement.textContent) + 1;
        valueElement.textContent = val;
        const modifierElement = valueElement.nextElementSibling;
        modifierElement.textContent = val - 4;
        this.calculateTraits();
      });
    });
    
    document.querySelectorAll('.decrement button').forEach(button => {
      button.addEventListener('click', () => {
        const valueElement = button.parentElement.previousElementSibling.previousElementSibling;
        const val = parseInt(valueElement.textContent) - 1;
        if (val > 0) {
          valueElement.textContent = val;
          const modifierElement = valueElement.nextElementSibling;
          modifierElement.textContent = val - 4;
          this.calculateTraits();
        }
      });
    });
  }
  generateSpeciesOptions() {
    const speciesSelect = document.getElementById("species");
  
    speciesSelect.innerHTML = '<option value="" disabled selected hidden>Human...</option>';
    
    for (const species in game.species) {
      const option = document.createElement('option');
      option.value = species;
      option.textContent = game.species[species].name;
      speciesSelect.appendChild(option);
    }
  }
  updateAvailableLanguages() {
    
  }
  calculateTraits() {
    const agi = parseInt(document.getElementById("speed-value").textContent) + parseInt(document.getElementById("dexterity-value").textContent);
    const str = parseInt(document.getElementById("power-value").textContent) + parseInt(document.getElementById("fortitude-value").textContent);
    const int = parseInt(document.getElementById("memory-value").textContent) + parseInt(document.getElementById("engineering-value").textContent);
    const wil = parseInt(document.getElementById("resolve-value").textContent) + parseInt(document.getElementById("awareness-value").textContent);
    const dis = parseInt(document.getElementById("portrayal-value").textContent) + parseInt(document.getElementById("stunt-value").textContent);
    const cha = parseInt(document.getElementById("appeal-value").textContent) + parseInt(document.getElementById("language-value").textContent);
    document.getElementById("agility-value").textContent = agi;
    document.getElementById("agility-modifier").textContent = agi - 4;
    document.getElementById("strength-value").textContent = str;
    document.getElementById("strength-modifier").textContent = str - 4;
    document.getElementById("intellect-value").textContent = int;
    document.getElementById("intellect-modifier").textContent = int - 4;
    document.getElementById("will-value").textContent = wil;
    document.getElementById("will-modifier").textContent = wil - 4;
    document.getElementById("display-value").textContent = dis;
    document.getElementById("display-modifier").textContent = dis - 4;
    document.getElementById("charm-value").textContent = cha;
    document.getElementById("charm-modifier").textContent = cha - 4;
  }
  calculateSpeciesStats() {
    document.getElementById("block").textContent = characterData.blockRating[0][0] + 'd' + characterData.blockRating[0][1];
    document.getElementById("dodge").textContent = characterData.dodgeRating[0][0] + 'd' + characterData.dodgeRating[0][1];
    document.getElementById("dhp").textContent = characterData.level + characterData.cEff() * characterData.cSoul();
    document.getElementById("shp").textContent = characterData.level + characterData.cCon() * characterData.cBody();
  }
};