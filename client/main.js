import setupPage from "./lazy";
import setupDiscordSdk, { serverless } from "./util/discord";
import * as Constants from "./constants";

import InGame from "./pages/ingame";
import CharacterSheet from "./pages/character";
import Talents from "./pages/talents";
import Actions from "./pages/actions";
import Inventory from "./pages/inventory";
import Language from "./pages/language";
import Loading from "./pages/loading";
import Creature from "./pages/gm/creature";
import Fight from "./pages/gm/fight";
import GMInGame from "./pages/gm/ingame";
import LanguageCreation from "./pages/gm/language";
import SpeciesCreation from "./pages/gm/species";
import TalentCreation from "./pages/gm/talent";
import Page from "./pages/page";
import Handbook from "./pages/handbook";

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
  talents: {
    talent1: { tree: Constants.SPECIES, name: "Talent 1", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 0, soul: 1, description: "Each of your defenses increase by 1.", actions: [{ type: Constants.MODIFY_CORE, id: Constants.CHILL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.ENERGY_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.HEAT_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PHYSICAL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PSYCHE_DEF, amount: 1, op: Constants.ADD }] },
    talent2: { tree: Constants.SPECIES, name: "Talent 2", after: "talent1", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 1, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [{ type: Constants.MODIFY_DODGE_RATING, amount: [1, 12], op: Constants.ADD }] },
    talent3: { tree: Constants.SPECIES, name: "Talent 3", after: "talent2", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 0, soul: 1, description: "Your Block Rating increases by 1d4.", actions: [{ type: Constants.MODIFY_BLOCK_RATING, amount: [1, 4], op: Constants.ADD }] },
    talent4: { tree: Constants.SPECIES, name: "Talent 4", after: "talent3", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 1, soul: 0, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an additional 2d8 physical damage.", actions: [] },
    talent5: { tree: Constants.SPECIES, name: "Talent 5", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 0, description: "When crafting an item other than a component, you require 1 less material component of your choice, minimum of 1.", actions: [{ type: Constants.CRAFTING }] },
    talent6: { tree: Constants.SPECIES, name: "Talent 6", after: "talent5", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 1, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    talent7: { tree: Constants.SPECIES, name: "Talent 7", after: "talent6", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 1, description: "Choose a subtrait. You become gifted in it.", actions: [{ type: Constants.MODIFY_META, id: Constants.ANY_GIFTED, amount: 1, op: Constants.ADD }] },
    talent8: { tree: Constants.SPECIES, name: "Talent 8", after: "talent7", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 2, description: "Whenever you make a test using a subtrait that you are gifted in, you may spend 5 stamina to gain a point of favor. You may only gain a point of favor this way once per test.", actions: [] },

    talent9: { primaryBranch: true, tree: Constants.SPECIES, name: "Palent 1", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the first-tier talent of any subspecies talent tree. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.SUBSPECIES_TALENT, tree: null }] },
    talent10: { primaryBranch: true, tree: Constants.SPECIES, name: "Palent 2", after: "talent9", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the second-tier talent chosen with the <b>Flexible</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "flexible" }] },
    talent11: { primaryBranch: true, tree: Constants.SPECIES, name: "Palent 3", after: "talent10", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the third-tier talent correlated to the talent chosen with the <b>Versatile</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "versatile" }] },
  },
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
  inGame: new InGame(),
  characterSheet: new CharacterSheet(),
  talents: new Talents(),
  actions: new Actions(),
  inventory: new Inventory(),
  language: new Language(),
  handbook: new Handbook(),
  loading: new Loading(),
  gm: {
    creature: new Creature(),
    fight: new Fight(),
    inGame: new GMInGame(),
    language: new LanguageCreation(),
    species: new SpeciesCreation(),
    talent: new TalentCreation()
  }
};


function hidePages(p) {
  Object.values(p).forEach(v => {
    if (!(v instanceof Page) && typeof v === 'object')
      hidePages(v);
    else if (v instanceof Page)
      v.hide()
  });
}

export function showPage(page) {
  hidePages(pages);

  page.show();
}

// Initialize default page
//pages.loading.show();

// dev
//pages.gm.language.show();
//pages.gm.language.loadLanguage("utopian");
pages.talents.show();