import { game } from "../main";
import Page from "./page";

export default class Talents extends Page {
  constructor() {
    super('talents', 'talent');
    this.renderBranch("talent-branch", "talent1", "talent2", "talent3", "talent4", "talent5");
    this.renderBranch("talent-branch2", "talent1", "talent2", "talent3", "talent4", "talent5", "talent6");
    this.renderBranch("talent-branch3", "talent1", "talent2", "talent3", "talent4", "talent5", "talent6", "talent7");
    this.renderBranch("talent-branch4", "talent1", "talent2", "talent3", "talent4", "talent5", "talent6", "talent7", "talent8", "talent9", "talent10", "talent11");
  }
  renderTalent(talent, index, totalTalents) {
    const defaultBranchSize = 5;
    const headHeight = 12.79;
    const scaleFactor = (defaultBranchSize / totalTalents);
    const talentElement = document.createElement('div');
    talentElement.className = 'talent';
    talentElement.style.transform = `scaleY(${scaleFactor})`;
    talentElement.style.zIndex = -index;
    if (index < totalTalents - 1)
      talentElement.style.marginBottom = `calc(-20% * ${1 + (1/scaleFactor)} - 20px)`;

    const head = document.createElement('img');
    head.className = 'talent-head';
    head.src = `./talent-head.svg`;
    head.style.transform = `scaleY(${1 / scaleFactor})`;
    head.style.filter = `brightness(calc(30% + 70% * ${1 - index/totalTalents})) contrast(calc(100% + ${index/totalTalents * 5}%))`;

    const body = document.createElement('img');
    body.className = 'talent-body';
    body.src = `./talent-body.svg`;
    body.style.filter = `brightness(calc(30% + 70% * ${1 - index/totalTalents})) contrast(calc(100% + ${index/totalTalents * 5}%))`;

    const tail = document.createElement('img');
    tail.className = 'talent-tail';
    tail.src = `./talent-tail.svg`;
    tail.style.transform = `scaleY(${1 / scaleFactor})`;
    tail.style.filter = `brightness(calc(30% + 70% * ${1 - index/totalTalents})) contrast(calc(100% + ${index/totalTalents * 5}%))`;

    const name = document.createElement('div');
    name.className = 'talent-name';
    name.style.transform = `scaleY(${1 / scaleFactor})`;
    name.dataset.content = game.talents[talent].name;

    talentElement.appendChild(head);
    talentElement.appendChild(body);
    name.style.top = `calc(20% * ${1 + (1/scaleFactor)} + ${headHeight*(1/scaleFactor)}px)`;
    talentElement.appendChild(tail);
    talentElement.append(name);
    return talentElement;
  }
  renderBranch(id, ...branch) {
    const container = document.getElementById(id);

    let i = 0;
    for (const key of branch)
      container.appendChild(this.renderTalent(key, i++, branch.length));
  }
}