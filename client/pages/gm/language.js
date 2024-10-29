import { game } from "../../main";
import Page from "../page";

const exampleWord = {
  word: "", // jan 
  uses: [{
    type: "noun", // noun, verb, adjective, particle, special
    //state: "", // archaic, new, slang, informal, formal, custom
    meaning: "", // person, living humanoid being
    example: "", // Mi lukin e jan ni.
    exampleLiteralTranslation: "", // I look (on) human that.
    exampleTranslation: "" // I'm looking on that man.
  }] 
};

export default class LanguageCreation extends Page {
  currentLanguage;
  sorting = false;
  currentIndex;
  constructor() {
    super('gm-language', 'language-editor');
    const word = document.getElementById("word");
    word.addEventListener('keypress', (evt) => {
      if (evt.key.length === 1) { // is a keyboard key thing
        let longestLength = 0;
        for (const c of game.languages[this.currentLanguage].alphabet)
          if (c.length > longestLength)
            longestLength = c.length;
        let nextCharacters = new Set();
        for (let i = 0; i < longestLength; i++) {
          const replaceSet = new Set();
          let fullMatch = false;
          for (const c of game.languages[this.currentLanguage].alphabet) {
            if (i === c.length && word.value.endsWith(c) && c.length > 0) {
              fullMatch = true;
              break;
            }
            if (c.length > i && (word.value.endsWith(c.substring(0, i)) || i === 0))
              replaceSet.add(c.charAt(i));
          }
          if (replaceSet.size > 0 && !fullMatch)
            nextCharacters = replaceSet;
        }
        for (const key of nextCharacters)
          if ((game.languages[this.currentLanguage].alphabetCaseInsensitive ? evt.key.toLowerCase() : evt.key) === (game.languages[this.currentLanguage].alphabetCaseInsensitive ? key.toLowerCase() : key))
            return;
        evt.preventDefault();
      }
    });
    word.addEventListener('input', () => {
      if (this.currentLanguage !== undefined && this.currentIndex !== undefined) {
        game.languages[this.currentLanguage].words[this.currentIndex].word = word.value;
        document.getElementById("scrollable-list").children.item(this.currentIndex).children.item(0).textContent = word.value || "Undefined";
      }
    });
    document.getElementById("add-word").addEventListener('click', () => {
      if (this.currentLanguage === undefined)
        return;
      game.languages[this.currentLanguage].words.push(exampleWord);
      this.loadWordFromIdx(game.languages[this.currentLanguage].words.length - 1);
      document.getElementById("scrollable-list").appendChild(this.generateWordListElement(game.languages[this.currentLanguage].words[game.languages[this.currentLanguage].words.length - 1]));
      if (this.sorting)
        this.sortWords();
    });
  }
  generateLanguages() {
    
  }
  generateWordListElement(word) {
    const node = document.createElement("div");
    node.classList.add("btn-toolbar");
    const wordButton = document.createElement("button");
    wordButton.textContent = word.word || "Undefined";
    wordButton.addEventListener('click', () => this.loadWord(node));
    node.appendChild(wordButton);
    const x = document.createElement("button");
    x.classList.add("x");
    x.textContent = 'x';
    x.addEventListener('click', () => this.deleteWord(node));
    node.appendChild(x);
    return node;
  }
  loadLanguage(language) {
    document.getElementById("language-name").value = game.languages[language].name;
    const scrollableList = document.getElementById("scrollable-list");
    scrollableList.innerHTML = ``;
    for (const word of game.languages[language].words)
      scrollableList.appendChild(this.generateWordListElement(word));
    this.currentLanguage = language;
    if (game.languages[language].words.length > 0)
      this.loadWordFromIdx(0);
  }
  loadWord(node) {
    this.loadWordFromIdx(this.getNodeIndex(node));
  }
  loadWordFromIdx(idx) {
    document.getElementById("word").value = idx !== null ? game.languages[this.currentLanguage].words[idx].word : '';
    this.currentIndex = idx !== null ? idx : undefined;
  }
  getNodeIndex(child) {
    let i = 0;
    while((child = child.previousSibling) != null) 
      i++;
    return i;
  }
  deleteWord(node) {
    const idx = this.getNodeIndex(node);
    node.remove();
    game.languages[this.currentLanguage].words.splice(idx, 1);
    if (idx === this.currentIndex && game.languages[this.currentLanguage].words.length > 0)
      this.loadWordFromIdx(this.currentIndex > 0 ? this.currentIndex - 1 : this.currentIndex);
    else // no more words left in dictionary, unload
      this.loadWordFromIdx(null);
  }
  sortWords() {

  }
  show() {
    super.show();
    if (this.currentLanguage === undefined && Object.keys(game.languages).length > 0)
      this.loadLanguage(Object.keys(game.languages)[0]);
  }
};