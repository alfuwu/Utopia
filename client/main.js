import setupPage from "./lazy";
import setupDiscordSdk from "./util/discord";

import Character from './pages/character.js';
import InGame from './pages/ingame.js';
import Loading from './pages/loading.js';
import Creature from './pages/gm/creature.js';
import Fight from './pages/gm/fight.js';
import GMInGame from './pages/gm/ingame.js';
import Language from './pages/gm/language.js';
import Species from './pages/gm/species.js';
import Talent from './pages/gm/talent.js';

export const characterData = {
  species: "",
  xp: 500,
  body: 0,
  mind: 0,
  soul: 0,
  coreModifiers: [{flat: 0, mult: 1, abMult: 1 }, {flat: 0, mult: 1, abMult: 1}, {flat: 0, mult: 1, abMult: 1}],
  scoreModifiers: [{flat: 0, mult: 1, abMult: 1 }, {flat: 0, mult: 1, abMult: 1}, {flat: 0, mult: 1, abMult: 1}],
  blockRating: [[2, 6]],
  dodgeRating: [[2, 14]],
  level: 10,
  cBody() {
    return applyModifier(this.coreModifiers[0], this.body);
  },
  cMind() {
    return applyModifier(this.coreModifiers[1], this.mind);
  },
  cSoul() {
    return applyModifier(this.coreModifiers[2], this.soul);
  },
  cCon() {
    return applyModifier(this.scoreModifiers[0], game.species[this.species].constitution);
  },
  cEnd() {
    return applyModifier(this.scoreModifiers[1], game.species[this.species].endurance);
  },
  cEff() {
    return applyModifier(this.scoreModifiers[2], game.species[this.species].effervescence);
  }
};
export const game = {
  species: {
    "": { name: "", constitution: 1, endurance: 1, effervescence: 1, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { }, languages: { } },
  },
  talents: { },
  languages: {
    utopian: {
      name: "Utopian",
      description: "Utopian is a language spoken by all manner of people, utilized as a common tongue to communicate with other cultures and species.",
      alphabet: [
        'a', 'b', 'c', 'd', 'e', 'fa', 'fu', 'fe', 'fo', 'g', 'i', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'z', 'kpsop'
      ],
      alphabetCaseSensitive: false,
      words: [{
        word: "na",
        uses: [{
          type: "exclamation",
          state: "informal",
          meaning: "hello",
          example: "Na!",
          translation: "Hello!",
          literalTranslation: "Hello!"
        }]
      }]
    }
  }
};

export function applyModifier(modifier, stat) {
  return ((stat * modifier.mult) + modifier.flat) * modifier.abMult;
}

setupDiscordSdk().then(() => {
  console.log("done");
});

// Initialize pages
export const pages = {
  characterSheet: new Character(),
  inGame: new InGame(),
  loading: new Loading(),
  gm: {
    creature: new Creature(),
    fight: new Fight(),
    inGame: new GMInGame(),
    language: new Language(),
    species: new Species(),
    talent: new Talent()
  }
};

// Function to switch between pages
function showPage(page) {
  Object.keys(pages).forEach(key => {
    if (typeof pages[key] === 'object')
      Object.values(pages[key]).forEach(p => p.hide());
    else
      pages[key].hide();
  });

  page.show();
}

// Set up event listeners to navigate to pages
//document.getElementById('some-nav-button').addEventListener('click', () => showPage(pages.characterCreation));

// Initialize default page
//pages.loading.show();

// dev
//pages.gm.language.show();
//pages.gm.language.loadLanguage("utopian");
pages.characterSheet.show();
pages.characterSheet.calculateSpeciesStats();
pages.characterSheet.calculateXp();