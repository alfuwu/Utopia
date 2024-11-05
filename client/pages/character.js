import { applyModifier, characterData, game } from "../main";
import Page from "./page";

export default class Character extends Page {
  constructor() {
    super('character', 'character-sheet');

    document.querySelectorAll('.increment button').forEach(button => {
      button.addEventListener('click', () => {
        button.blur();
        const valueElement = button.parentElement.nextElementSibling;
        const sid = parseInt(button.id.split('-')[0]);
        characterData.subtraits[sid]++;
        const v = Math.round(characterData.subtrait(sid));
        valueElement.textContent = v;
        const modifierElement = valueElement.nextElementSibling;
        modifierElement.textContent = this.formatModifier(characterData.gifted.includes(sid) ? Math.max(v - 4, 0) : v - 4);
        this.calculateTraits();
      });
    });
    
    document.querySelectorAll('.decrement button').forEach(button => {
      button.addEventListener('click', () => {
        button.blur();
        const sid = parseInt(button.id.split('-')[0]);
        if (characterData.subtraits[sid] > 1) {
          const modifierElement = button.parentElement.previousElementSibling;
          const valueElement = modifierElement.previousElementSibling;
          characterData.subtraits[sid]--;
          const v = Math.round(characterData.subtrait(sid));
          valueElement.textContent = v;
          modifierElement.textContent = this.formatModifier(characterData.gifted.includes(sid) ? Math.max(v - 4, 0) : v - 4);
          this.calculateTraits();
        }
      });
    });
  }
  generateSpeciesOptions() {
    const speciesSelect = document.getElementById('species');
  
    speciesSelect.innerHTML = `<option value="" disabled selected hidden>Human...</option>`;
    
    for (const species of Object.keys(game.species)) {
      if (species.length < 1)
        continue;
      const option = document.createElement('option');
      option.value = species;
      option.textContent = game.species[species].name;
      speciesSelect.appendChild(option);
    }
  }
  formatModifier(mod) {
    return mod < 0 ? mod : '+' + mod.toString();
  }
  calculateTraits() {
    for (let i = 0; i < characterData.subtraits.length; i+= 2) {
      const val = Math.round(characterData.subtrait(i) + characterData.subtrait(i + 1))
      document.getElementById(`${i/2}-trait-value`).textContent = val;
      document.getElementById(`${i/2}-trait-modifier`).textContent = this.formatModifier(val - 4);
    }
  }
  capGiftedSubtraitModifiers() {
    for (let i = 0; i < characterData.subtraits.length; i++)
      if (characterData.gifted.includes(i) && characterData.subtrait(i) - 4 < 0)
        document.getElementById(`${i}-subtrait-modifier`).textContent = '+0';
  }
  calculateSpeciesStats() {
    document.getElementById('block').textContent = characterData.blockRating[0][0] + 'd' + characterData.blockRating[0][1];
    document.getElementById('dodge').textContent = characterData.dodgeRating[0][0] + 'd' + characterData.dodgeRating[0][1];
    document.getElementById('dhp').textContent = characterData.level + characterData.cEff() * characterData.cSoul();
    document.getElementById('shp').textContent = characterData.level + characterData.cCon() * characterData.cBody();
    document.getElementById('stamina').textContent = characterData.level + characterData.cEnd() * characterData.cMind();
    document.getElementById('constitution').textContent = characterData.cCon();
    document.getElementById('endurance').textContent = characterData.cEnd();
    document.getElementById('effervescence').textContent = characterData.cEff();
    for (let i = 0; i < characterData.subtraits.length; i++)
      if (characterData.gifted.includes(i))
        document.getElementById(`${i}-checkmark`).textContent = '✔';
  }
  calculateXp() {
    document.getElementById('current-xp').textContent = characterData.xp;
    document.getElementById('target-xp').textContent = characterData.level * 100;
  }
  calculatePoints() {
    document.getElementById('talent-points').textContent = characterData.level - characterData.body - characterData.mind - characterData.soul;
    document.getElementById('body-points').textContent = characterData.body;
    document.getElementById('mind-points').textContent = characterData.mind;
    document.getElementById('soul-points').textContent = characterData.soul;
  }
  show() {
    super.show();
    this.generateSpeciesOptions();
    this.calculateTraits();
    this.capGiftedSubtraitModifiers();
    this.calculateSpeciesStats();
    this.calculateXp();
    this.calculatePoints();
  }
};