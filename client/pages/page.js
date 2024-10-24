export default class Page {
  /** @type {string} */
  id;
  /** @type {HTMLElement} */
  element;

  constructor(id) {
    this.id = id;
    this.element = document.getElementById(id);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }
}