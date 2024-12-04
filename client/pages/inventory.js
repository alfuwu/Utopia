import Page from "./page";
import { characterData } from "../main";
import * as Constants from "../constants";

export default class Inventory extends Page {
  constructor() {
    super('inventory', 'character-inventory'); // Register base behavior

    document.querySelector('.all-category').addEventListener('click', this.showAllItems.bind(this));
    document.querySelector('#forage').addEventListener('click', this.handleForage.bind(this));
    document.querySelector('#craft').addEventListener('click', this.handleCraft.bind(this));
    document.querySelector('#add-component').addEventListener('click', this.addComponent.bind(this));
  }

  showAllItems() {
    console.log('Displaying all items');
    // ..
  }

  handleForage() {
    document.getElementById("fm").style = ``;
  }

  handleCraft() {
    const name = document.querySelector('#craft-name').value;
    const description = document.querySelector('#craft-desc').value;
    const type = document.querySelector('#type').value;

    if (!name || !description) {
      // dont use alerts (they look bad)
      alert('Please provide a name and description for the item.');
      return;
    }

    const newItem = {
      n: name,
      a: 1,
      w: 1,
      e: true,
      t: parseInt(type, 10),
      c: []
    };

    characterData.inventory.items.push(newItem);
    this.updateInventoryDisplay();
    alert(`${name} crafted successfully!`);
  }

  addComponent() {
    console.log('Adding a component');
  }

  selectItem(index) {
    const item = characterData.inventory.items[index];

    document.querySelector('#item-name').textContent = item.n || "Unknown Item";
    document.querySelector('#item-desc').textContent = `Type: ${item.t}, Weight: ${item.w}, Amount: ${item.a}`;

    const equipButton = document.querySelector('#equip');
    const augmentButton = document.querySelector('#augment');

    equipButton.disabled = item.t !== Constants.EQUIPMENT;
    augmentButton.disabled = item.t !== Constants.EQUIPMENT; // check for augmentable component
  }

  updateInventoryDisplay() {
    const itemsContainer = document.querySelector('.item-list');
    itemsContainer.innerHTML = '';

    characterData.inventory.items.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.classList.add('inv-item');

      itemElement.innerHTML = `
        <label class="inv-name">${item.n}</label>
        <label class="inv-amount">x${item.a}</label>
        <div class="inv-slots">${item.w}</div>
      `;

      itemElement.addEventListener('click', () => this.selectItem(index));
      itemsContainer.appendChild(itemElement);
    });

    const slots = document.querySelector('#slots');
    slots.textContent = `${characterData.inventory.items.length}/${characterData.inventory.maxSlots || 20}`;
  }


  updateCurrencyDisplay() {
    const currencyContainer = document.querySelector('.purse');
    currencyContainer.querySelectorAll('.currency').forEach(el => el.remove());

    characterData.inventory.cur.forEach((cur, index) => {
      const currencyElement = document.createElement('div');
      currencyElement.classList.add('currency');
      currencyElement.innerHTML = `
        <label id="${index}-cur-t">${cur.t}</label>
        <span id="${index}-cur">${cur.a}</span>
      `;
      currencyContainer.appendChild(currencyElement);
    });
  }

  updateMaterialsDisplay() {
    const materialContainer = document.querySelector('.materials');

    const materialKeys = {
      cr: 'Crude',
      c: 'Common',
      ex: 'Extraordinary',
      r: 'Rare',
      e: 'Epic',
      l: 'Legendary',
      m: 'Mythical'
    };

    materialContainer.querySelectorAll('.material').forEach((el, index) => {
      const key = Object.keys(materialKeys)[index];
      const materialData = characterData.inventory.mats[key];
      
      if (materialData) {
        el.querySelector('.rarity-name').textContent = materialKeys[key];
        el.querySelectorAll('.c').forEach((cEl, i) => {
          cEl.textContent = materialData[i] || 0;
        });
      }
    });
  }

  show() {
    super.show();
    this.updateInventoryDisplay();
    this.updateCurrencyDisplay();
    this.updateMaterialsDisplay();
  }
}
