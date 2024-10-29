import { showPage } from "../main";

const navButtons = new Set();

export default class Page {
  /** @type {string} */
  id;
  /** @type {HTMLElement} */
  element;
  /** @type {HTMLElement|null} */
  navButton;

  constructor(id, navId=null) {
    this.id = id;
    this.element = document.getElementById(id);
    this.navButton = navId ? document.getElementById(navId) : null;
    if (this.navButton !== null) {
      navButtons.add(this.navButton);
      this.navButton.addEventListener('click', () => {
        showPage(this);
      });
    }
  }

  show() {
    this.element.style.display = 'block';
    for (const button of navButtons)
      button.disabled = false;
    if (this.navButton !== null)
      this.navButton.disabled = true;
  }

  hide() {
    this.element.style.display = 'none';
    if (this.navButton !== null)
      this.navButton.disabled = false;
  }
}