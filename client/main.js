import setupPage from "./lazy";
import setupDiscordSdk from "./util/discord";

import CharacterCreation from './pages/charactercreation.js';
import InGame from './pages/ingame.js';
import Loading from './pages/loading.js';
import Creature from './pages/gm/creature.js';
import Fight from './pages/gm/fight.js';
import GMInGame from './pages/gm/ingame.js';
import Language from './pages/gm/language.js';
import Species from './pages/gm/species.js';
import Talent from './pages/gm/talent.js';

export const characterData = {
  level: 10
};
export const game = {
  speciesStats: {
    "": { name: "", constitution: 1, endurance: 1, effervescence: 1, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { }, languages: { } },
  },
  talents: { }
};

setupDiscordSdk().then(() => {
  console.log("done");
});

// Initialize pages
const pages = {
  characterCreation: new CharacterCreation(),
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
pages.characterCreation.show();