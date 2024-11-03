import { game } from "../main.js";
import { distance } from "../util/general.js";
import Page from "./page.js";

export default class Language extends Page {
  currentLanguage;
  constructor() {
    super('languages', 'language');
    const search = document.getElementById("lang-search");
    search.addEventListener('input', () => {
      this.generateWordsList(search.value);
    });
  }
  validWord(word) {
    return word.word !== undefined && word.uses !== undefined && word.uses.length > 0;
  }
  generateWordListElement(word) {
    const div = document.createElement("div"); // container
    const header = document.createElement("h2");
    header.textContent = word.word;
    div.appendChild(header);
    const uses = document.createElement("div");
    for (const use of word.uses) { // needs css styling
      const div2 = document.createElement("div");
      div2.appendChild(document.createElement("br"));
      const h = document.createElement("h5");
      if (use.state !== undefined) {
        const state = document.createElement("span");
        const samp = document.createElement("samp");
        samp.textContent = use.state;
        h.appendChild(state);
      }
      const type = document.createElement("span");
      const i = document.createElement("i");
      i.textContent = use.type;
      type.appendChild(i);
      h.appendChild(type);
      h.appendChild(document.createTextNode(use.meaning));
      div2.appendChild(h);
      const strong = document.createElement("strong");
      strong.textContent = use.example;
      div2.append(strong);
      const samp2 = document.createElement("samp");
      samp2.textContent = use.literalTranslation;
      div2.appendChild(samp2);
      const i2 = document.createElement("i");
      i2.textContent = use.translation;
      div2.appendChild(i2);
      uses.appendChild(div2);
    }
    div.appendChild(uses);
    return div;
  }
  updateAvailableLanguages() {
    
  }
  generateWordsList(searchTerm=undefined) {
    const dict = document.getElementById("dict");
    dict.innerHTML = ``;
    for (const word of game.languages[this.currentLanguage].words)
      if (this.validWord(word) && (searchTerm === undefined || distance(word.word, searchTerm) <= 2))
        dict.appendChild(this.generateWordListElement(word));
  }
  show() {
    super.show();
    if (this.currentLanguage === undefined && Object.keys(game.languages).length > 0)
      this.currentLanguage = Object.keys(game.languages)[0];
    this.generateWordsList(document.getElementById("lang-search").value);
  }
};