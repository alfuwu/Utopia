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
        }
      });
    });
  }
  generateSpeciesOptions() {

  }
  updateAvailableLanguages() {
    
  }
};