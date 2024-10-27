import { game } from "../../main";
import Page from "../page";

const exampleWord = {
  word: "", // jan 
  uses: [{
    type: "noun", // noun, verb, adjective, particle, special
    //state: "", // archaic, slang, informal, formal, custom
    meaning: "", // person, living humanoid being
    example: "", // Mi lukin e jan ni.
    exampleLiteralTranslation: "", // I look (on) human that.
    exampleTranslation: "" // I'm looking on that man.
  }] 
};

function distance(a, b) { // used for searching
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++)
    matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++)
    matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + a[i - 1] === b[j - 1] ? 0 : 1
      );

  return matrix[a.length][b.length];
}

export default class LanguageCreation extends Page {
  currentLanguage = null;
  sorting = false;
  constructor() {
    super('gm-language');
    const word = document.getElementById("word");
    word.addEventListener('keypress', (evt) => {
      if (evt.key.length === 1) // is a keyboard key thing
        for (const validLetter of game.languages[this.currentLanguage].alphabet)
          if (word.value.substring(word.value.length - validLetter.length + 1) + evt.key === validLetter)
            return;
      evt.preventDefault();
    })
    document.getElementById("add-word").addEventListener('click', () => {
      if (this.currentLanguage == null)
        return;
      game.languages[this.currentLanguage].words.push(exampleWord);
      this.loadWordFromIdx(game.languages[this.currentLanguage].words.length - 1);
      document.getElementById("scrollable-list").appendChild(this.generateWordListElement(game.languages[this.currentLanguage].words[game.languages[this.currentLanguage].words.length - 1]));
      if (sorting)
        sortWords();
    });
  }
  generateLanguages() {
    
  }
  generateWordListElement(word) {
    const node = document.createElement("div");
    node.classList.add("btn-toolbar");
    const wordContainer = document.createElement("div");
    node.appendChild(wordContainer);
    const wordButton = document.createElement("button");
    wordButton.textContent = word.word || "Undefined";
    wordButton.addEventListener('click', () => this.loadWord(word));
    wordContainer.appendChild(wordButton);
    const xContainer = document.createElement("div");
    node.appendChild(xContainer);
    const xButton = document.createElement("button");
    xButton.classList.add("x");
    xButton.textContent = 'x';
    xButton.addEventListener('click', () => this.deleteWord(word));
    xContainer.appendChild(xButton);
    return node;
  }
  loadLanguage(language) {
    document.getElementById("language-name").value = game.languages[language].name;
    const scrollableList = document.getElementById("scrollable-list");
    scrollableList.textContent = ``;
    for (const word of game.languages[language].words)
      scrollableList.appendChild(this.generateWordListElement(word));
    this.currentLanguage = language;
    this.loadWordFromIdx(0);
  }
  loadWord(word) {
    this.loadWordFromIdx(game.languages[this.currentLanguage].words.indexOf(word));
  }
  loadWordFromIdx(idx) {
    document.getElementById("word").value = game.languages[this.currentLanguage].words[idx].word;
  }
  deleteWord(word) {
    const idx = game.languages[this.currentLanguage].words.indexOf(word);
    document.getElementById("scrollable-list").children.item(idx).remove();
    delete game.languages[this.currentLanguage].words[idx];
  }
};