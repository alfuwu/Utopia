import { game } from "../main";
import Page from "./page";

export default class Talents extends Page {
  constructor() {
    super('talents', 'talent');
    this.clearTree();
    this.renderTree(0);
  }
  lerp(num1, num2, amnt) {
    return (1 - amnt) * num1 + amnt * num2;
  }
  renderTalent(talent, index, speciesTalent, totalTalents) {
    const defaultBranchSize = 5;
    const scaleFactor = Math.min(defaultBranchSize / totalTalents, 3);
    const sf2 = scaleFactor <= 1 ? scaleFactor : this.lerp(scaleFactor, 1, 0.5);
    const talentElement = document.createElement('button');
    talentElement.className = 'talent';
    talentElement.style.transform = `scaleY(${sf2})`;
    talentElement.style.zIndex = totalTalents - index;
    if (index < totalTalents - 1)
      talentElement.style.marginBottom = `calc(-60% * ${1/Math.pow(scaleFactor, scaleFactor/1.65)})`;

    const head = document.createElement('img');
    head.className = 'talent-head';
    head.src = `./talent-head.svg`;

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'talent-body-wrapper';
    const body = document.createElement('img');
    body.className = 'talent-body';
    body.src = `./talent-body.svg`;

    const tail = document.createElement('img');
    tail.className = 'talent-tail';
    tail.src = `./talent-tail.svg`;
    tail.style.top = `-${1/sf2*5 -1}px`;
    head.style.transform = tail.style.transform = `scaleY(${1 / sf2})`;

    head.draggable = body.draggable = tail.draggable = false;
    head.ondragstart = body.ondragstart = tail.ondragstart = () => false;

    if (speciesTalent)
      head.style.filter = body.style.filter = tail.style.filter = `brightness(calc(30% + 70% * ${1 - index/totalTalents})) contrast(calc(100% + ${index/totalTalents * 5}%))`;

    const name = document.createElement('div');
    name.className = 'talent-name';
    name.style.zIndex = 1;
    name.style.transform = `scaleY(${1 / sf2})`;
    name.style.top = index === 0 ? `${(1 - Math.min(scaleFactor, 1))*50}%` : `calc(${(1-scaleFactor)*50}% + ${scaleFactor <= 1 ? 190 : 130 + Math.pow(scaleFactor, 2) * 35}px)`;
    name.dataset.content = game.talents[talent].name.toUpperCase();

    talentElement.appendChild(head);
    bodyWrapper.append(body);
    bodyWrapper.append(name);
    talentElement.appendChild(bodyWrapper);
    talentElement.appendChild(tail);
    return talentElement;
  }
  renderBranch(speciesTalent, ...branch) {
    const container = document.createElement('div');
    container.className = 'talent-branch';

    let i = 0;
    for (const key of branch)
      container.appendChild(this.renderTalent(key, i++, speciesTalent, branch.length));
    return container;
  }
  clearTree() {
    document.getElementById('talent-tree').innerHTML = ``;
  }
  renderTree(treeId) {
    const talents = new Set();
    for (const key of Object.keys(game.talents))
      if (game.talents[key].tree === treeId)
        talents.add(key);
    const branches = new Set();
    for (const t of talents)
      if (game.talents[t].after === null)
        branches.add(new Set().add(t));
    for (const t of talents)
      for (const b of branches)
        if (Array.from(b)[b.size - 1] === game.talents[t].after)
          b.add(t);
    const tree = document.getElementById('talent-tree');
    for (const branch of branches)
      tree.appendChild(this.renderBranch(treeId === 0, ...branch));
  }
}