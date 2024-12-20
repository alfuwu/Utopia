import { characterData, game } from "../main";
import Page from "./page";
import * as Constants from "../constants";
import * as Util from "../util";
import { parseMarkdownToHTML } from "../util/general";
import { emit, serverless } from "../util/discord";

export default class Talents extends Page {
  index;
  treeId;
  totalTalents;
  talent;
  talentKey;
  head; body; tail;
  constructor() {
    super('talents', 'talent');
    const talents = document.getElementById('talent-selection');
    const talentTree = document.getElementById('talents-container');
    document.getElementById('species-talents').addEventListener('click', () => this.quickTree(Constants.SPECIES, talents, talentTree));
    document.getElementById('warfare-talents').addEventListener('click', () => this.quickTree(Constants.WARFARE, talents, talentTree));
    document.getElementById('tactics-talents').addEventListener('click', () => this.quickTree(Constants.TACTICS, talents, talentTree));
    document.getElementById('innovation-talents').addEventListener('click', () => this.quickTree(Constants.INNOVATION, talents, talentTree));
    document.getElementById('magecraft-talents').addEventListener('click', () => this.quickTree(Constants.MAGECRAFT, talents, talentTree));
    document.getElementById('influence-talents').addEventListener('click', () => this.quickTree(Constants.INFLUENCE, talents, talentTree));
    document.getElementById('prowess-talents').addEventListener('click', () => this.quickTree(Constants.PROWESS, talents, talentTree));
    document.getElementById('specialist-talents').addEventListener('click', () => {
      talents.style.display = 'none';
      this.clearTree();
      
      talentTree.style = ``;
    });

    const tn = document.getElementById('talent-name');
    const td = document.getElementById('talent-desc');
    const tc = document.getElementById('talent-cost');
    const body = document.getElementById('body-cost');
    const mind = document.getElementById('mind-cost');
    const soul = document.getElementById('soul-cost');
    document.getElementById('tb').addEventListener('click', () => {
      talentTree.style.display = 'none';
      talents.style = ``;
      this.clearTree();
      if (this.talent !== undefined)
        this.clearData(tn, td, tc, body, mind, soul);
    });
    const learn = document.getElementById('tl');
    learn.addEventListener('click', () => {
      learn.disabled = true;
      const [meetsReq, bodyCost, mindCost, soulCost] = Util.meetsTPRequirement(game.talents[this.talentKey], characterData.level - characterData.body - characterData.mind - characterData.soul);
      if (this.talentKey === undefined || !meetsReq)
        return;
      if (game.talents[this.talentKey].after && !characterData.talents.includes(game.talents[this.talentKey].after))
        return;
      if (game.talents[this.talentKey].requirements && !Util.meetsAllRequirements(game.talents[this.talentKey].requirements))
        return;
      if (game.talents[this.talentKey].special) {
        if (characterData.level - characterData.specialistTalents * 10 < 10)
          return;
        characterData.specialistTalents++;
      }
      characterData.talents.push(this.talentKey);
      characterData.body += bodyCost;
      characterData.mind += mindCost;
      characterData.soul += soulCost;
      if (!serverless)
        emit('updateSelfData', {
          type: 't',
          t: this.talentKey,
        });
      const filter = this.getFilter(this.treeId, game.talents[this.talentKey], this.talentKey, this.index, this.totalTalents);
      this.head.style.filter = this.body.style.filter = this.tail.style.filter = filter;
      tc.classList.remove('div-red');
      tc.classList.remove('div-disabled');
      if (!meetsReq)
        tc.classList.add('div-red');
      else if (!characterData.talents.includes(talent) || game.talents[this.talentKey].after && !characterData.talents.includes(game.talents[this.talentKey].after))
        tc.classList.add('div-disabled');
      body.textContent = bodyCost;
      mind.textContent = mindCost;
      soul.textContent = soulCost;
      const col = game.treeColors[this.treeId];
      const sb = this.treeId === Constants.SPECIES ? 0.3 + 0.7 * (1 - this.index/this.totalTalents) : 1;
      this.talent.style.filter = `drop-shadow(0 0 2em rgb(${game.talents[this.talentKey].primaryBranch ? col[10].toString(sb) || col[9].toString(sb) || '255,255,255' : col[9].toString(sb) || '255,255,255'}))`;
    });
    document.addEventListener('mousedown', event => {
      if (event.target.tagName !== 'BUTTON' && event.target.id !== 'talent-desc' && event.target.id !== 'talent-name' && event.target.id !== 'tdc' && event.target.id !== 'talent-cost' && event.target.id !== 'td' && event.target.id !== 'body-cost' && event.target.id !== 'mind-cost' && event.target.id !== 'soul-cost' && event.target.name !== 'a' && this.talent !== undefined)
        this.clearData(tn, td, tc, body, mind, soul);
    });
  }
  clearData(tn, td, tc, b, m, s) {
    tn.textContent = 'Talent';
    td.innerHTML = 'Description...';
    tn.classList.add('div-disabled');
    td.classList.add('div-disabled');
    this.talent.style.filter = ``;
    document.getElementById('tl').disabled = true;
    this.index = this.treeId = this.totalTalents = this.talent = this.talentKey = this.head = this.body = this.tail = undefined;
    tc.classList.remove('div-red');
    tc.classList.add('div-disabled');
    b.textContent = m.textContent = s.textContent = '0';
  }
  quickTree(treeId, talents, talentTree) {
    talents.style.display = 'none';
    this.clearTree();
    this.renderTree(treeId);
    talentTree.style = ``;
  }
  lerp(num1, num2, amnt) {
    return (1 - amnt) * num1 + amnt * num2;
  }
  getFilter(treeId, t, talent, index, totalTalents) {
    let filter = '';
    const col = game.treeColors[treeId];
    if (!characterData.talents.includes(talent)) {
      if (col[6] !== undefined)
        filter = `brightness(${col[6]}%)`;
      if (col[7] !== undefined)
        filter += `contrast(${col[7]}%)`;
    }
    if (treeId === Constants.SPECIES)
      filter += `brightness(${30 + 70 * (1 - index/totalTalents)}%)contrast(${100 + (index/totalTalents * 5)}%)`;
    if (treeId !== Constants.SPECIES || t.primaryBranch) {
      if (col[0] !== undefined)
        filter += `brightness(${col[0]}%)`;
      if (col[1] !== undefined)
        filter += `sepia(${col[1]}%)`;
      if (col[2] !== undefined)
        filter += `saturate(${col[2]}%)`;
      if (col[3] !== undefined)
        filter += `hue-rotate(${col[3]}deg)`;
      if (col[4] !== undefined)
        filter += `brightness(${col[4]}%)`;
      if (col[5] !== undefined)
        filter += `contrast(${col[5]}%)`;
      if (col[8] !== undefined)
        filter += `saturate(${col[8]}%)`;
    }
    return filter;
  }
  renderTalent(talent, index, treeId, totalTalents) {
    const t = game.talents[talent];
    const defaultBranchSize = 5;
    const scaleFactor = Math.min(defaultBranchSize / totalTalents, 3);
    const sf2 = scaleFactor <= 1 ? scaleFactor : this.lerp(scaleFactor, 1, 0.5);
    const talentElement = document.createElement('div');
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

    head.draggable = body.draggable = tail.draggable = false;
    head.ondragstart = body.ondragstart = tail.ondragstart = () => false;

    const filter = this.getFilter(treeId, t, talent, index, totalTalents);
    head.style.filter = body.style.filter = tail.style.filter = filter;

    const name = document.createElement('div');
    name.className = 'talent-name';
    name.style.zIndex = 1;
    head.style.transform = tail.style.transform = name.style.transform = `scaleY(${1 / sf2})`;
    name.style.top = index === 0 ? `${1/scaleFactor*30}%` : `calc(${(1-scaleFactor)*50}% + ${scaleFactor <= 1 ? 180 : 130 + Math.pow(scaleFactor, 2) * 35}px)`;
    name.dataset.content = t.name.toUpperCase();

    const select = document.createElement('button');
    select.className = 'talent-select';
    const tn = document.getElementById('talent-name');
    const td = document.getElementById('talent-desc');
    select.addEventListener('focusin', () => {
      if (this.talent !== undefined)
        this.talent.style.filter = ``;
      tn.textContent = parseMarkdownToHTML(t.name);
      td.innerHTML = parseMarkdownToHTML(t.description);
      const col = game.treeColors[treeId];
      const h = characterData.talents.includes(talent);
      const sb = (treeId === Constants.SPECIES ? 0.3 + 0.7 * (1 - index/totalTalents) : 1) * (h ? 1 : 0.7);
      talentElement.style.filter = `drop-shadow(0 0 2em rgb(${t.primaryBranch ? col[10].modifyHsl(1, 1, h ? 1 : 0.5).toString(sb) || col[9].modifyHsl(1, 1, h ? 1 : 0.5).toString(sb) || '255,255,255' : col[9].modifyHsl(1, 1, h ? 1 : 0.5).toString(sb) || '255,255,255'}))`;
      tn.classList.remove('div-disabled');
      td.classList.remove('div-disabled');
      this.index = index;
      this.treeId = treeId;
      this.totalTalents = totalTalents;
      this.talent = talentElement;
      this.talentKey = talent;
      this.head = head;
      this.body = body;
      this.tail = tail;
      const [meetsReq, bodyCost, mindCost, soulCost] = Util.meetsTPRequirement(t, characterData.level - characterData.body - characterData.mind - characterData.soul);
      document.getElementById('tl').disabled = !meetsReq || h || t.after && !characterData.talents.includes(t.after) || t.requirements && !Util.meetsAllRequirements(t.requirements) || t.special && characterData.level - characterData.specialistTalents * 10 < 10;
      const tc = document.getElementById('talent-cost');
      tc.classList.remove('div-red');
      tc.classList.remove('div-disabled');
      let tb = bodyCost;
      let tm = mindCost;
      let ts = soulCost;
      for (let tal = game.talents[t.after]; tal !== undefined && !characterData.talents.includes(tal.after); tal = game.talents[tal.after]) {
        const [_, a, b, c] = Util.meetsTPRequirement(tal, 0);
        tb += a;
        tm += b;
        ts += c;
      }
      if (!characterData.talents.includes(talent) && characterData.level - characterData.body - characterData.mind - characterData.soul < tb + tm + ts)
        tc.classList.add('div-red');
      else if (characterData.talents.includes(talent) || t.after && !characterData.talents.includes(t.after))
        tc.classList.add('div-disabled');
      document.getElementById('body-cost').textContent = bodyCost;
      document.getElementById('mind-cost').textContent = mindCost;
      document.getElementById('soul-cost').textContent = soulCost;
    });

    talentElement.appendChild(head);
    bodyWrapper.append(body);
    bodyWrapper.append(name);
    bodyWrapper.append(select);
    talentElement.appendChild(bodyWrapper);
    talentElement.appendChild(tail);
    return talentElement;
  }
  renderBranch(treeId, ...branch) {
    const container = document.createElement('div');
    container.className = 'talent-branch';

    let i = 0;
    for (const key of branch)
      container.appendChild(this.renderTalent(key, i++, treeId, branch.length));
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
      if (game.talents[t].after === null && (treeId !== Constants.SPECIES || game.talents[t].requirements[0].species === characterData.species))
        branches.add(new Set().add(t));
    for (const t of talents)
      for (const b of branches)
        if (Array.from(b)[b.size - 1] === game.talents[t].after)
          b.add(t);
    const tree = document.getElementById('talent-tree');
    for (const branch of branches)
      tree.appendChild(this.renderBranch(treeId, ...branch));
  }
}