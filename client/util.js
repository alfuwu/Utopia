// this file is the same for the server and the client, containing utility functions that have use on both sides

import { applyModifier, characterData, game } from "./main";
import * as Constants from "./constants";

export function applyOp(obj, operator) {
    switch (operator.op) {
      case Constants.ADD:
        if (typeof obj === Number)
          return obj + operator.amount;
        else
          obj.flat += operator.amount;
        return obj;
      case Constants.SUB:
        if (typeof obj === Number)
          return obj - operator.amount;
        else
          obj.flat -= operator.amount;
        return obj;
      case Constants.MUL:
        if (typeof obj === Number)
          return obj * operator.amount;
        else
          obj.mult += operator.amount;
        return obj;
      case Constants.DIV:
        if (typeof obj === Number)
          return obj / operator.amount;
        else
          obj.mult -= operator.amount;
        return obj;
      case Constants.ABMUL:
        if (typeof obj === Number)
          return obj * operator.amount;
        else
          obj.abMult += operator.amount;
        return obj;
      case Constants.ABDIV:
        if (typeof obj === Number)
          return obj / operator.amount;
        else
          obj.abMult -= operator.amount;
        return obj;
    }
  }
  export function getMaxCon(user) {
    let max = 10;
    for (const quirk of this.species[user.species].quirks)
      if (quirk.type === Constants.MODIFY_SCORE && quirk.id === Constants.MAX_CONSTITUTION)
        max = applyOp(max, quirk);
    for (const talent of user.talents)
      for (const act of this.talents[talent].actions)
        if (act.type === Constants.MODIFY_SCORE && act.id === Constants.MAX_CONSTITUTION)
          max = applyOp(max, act);
    return max;
  }
  export function getMaxEnd(user) {
    let max = 10;
    for (const quirk of this.species[user.species].quirks)
      if (quirk.type === Constants.MODIFY_SCORE && quirk.id === Constants.MAX_ENDURANCE)
        max = applyOp(max, quirk);
    for (const talent of user.talents)
      for (const act of this.talents[talent].actions)
        if (act.type === Constants.MODIFY_SCORE && act.id === Constants.MAX_ENDURANCE)
          max = applyOp(max, act);
    return max;
  }
  export function getMaxEff(user) {
    let max = 10;
    for (const quirk of this.species[user.species].quirks)
      if (quirk.type === Constants.MODIFY_SCORE && quirk.id === Constants.MAX_EFFERVESCENCE)
        max = applyOp(max, quirk);
    for (const talent of user.talents)
      for (const act of this.talents[talent].actions)
        if (act.type === Constants.MODIFY_SCORE && act.id === Constants.MAX_EFFERVESCENCE)
          max = applyOp(max, act);
    return max;
  }
  export function countTalentsFromTree(talents, tree) {
    if (tree == null)
      return talents.length;
    let i = 0;
    for (const talent of talents)
      if (talent.tree === tree)
        i++;
    return i;
  }
  export function getTraitScore(game, user, traitId) {
    return applyModifier(characterData.subtraitModifiers[traitId * 2], characterData.subtraits[traitId * 2]) + applyModifier(game.userData[user].subtraitModifiers[traitId * 2], game.userData[user].subtraits[traitId * 2 + 1]);
  }
  export function meetsRequirements(cond) {
    switch (cond.type) {
      case Constants.SPECIES:
        if (characterData.species != cond.species)
          return false;
        break;
      case Constants.TALENT:
        if (!characterData.talents.has(cond.talent))
          return false;
        break;
      case Constants.AT_LEAST_FROM_TREE:
        if (countTalentsFromTree(characterData.talents, cond.tree) < cond.amount || 1)
          return false;
        break;
      case Constants.ALL_FROM_TREE:
        if (countTalentsFromTree(characterData.talents, cond.tree) < countTalentsFromTree(Object.values(game.talents), cond.tree))
          return false;
        break;
      case Constants.AT_LEAST_ANY_OF:
        // TODO: IMPLEMENT
        break;
      case Constants.SUBTRAIT_SCORE:
        if (characterData.subtraitModifiers[cond.subtrait].apply(characterData.subtraits[cond.subtrait]) < cond.amount)
          return false;
        break;
      case Constants.TRAIT_SCORE:
        if (getTraitScore(cond.trait) < cond.amount)
          return false;
        break;
      case Constants.OR:
        let metReqs = false;
        for (const req of cond.requirements) {
          if (meetsRequirements(req)) {
            metReqs = true;
            break;
          }
        }
        if (!metReqs)
          return false;
        break;
      case Constants.EXCLUSIVE_OR:
        let metExReqs = false;
        for (const req of cond.requirements) {
          if (meetsRequirements(req)) {
            if (metExReqs)
              return false;
            metExReqs = true;
            break;
          }
        }
        if (!metExReqs)
          return false;
        break;
      case Constants.NOT:
        if (meetsAllRequirements(user, cond.requirements))
          return false;
        break;
    }
    return true;
  }
  
  export function meetsAllRequirements(requirements) {
    for (const cond of requirements)
      if (!meetsRequirements(cond))
        return false;
    return true;
  }
  
  export function meetsTPRequirement(talent, unspentTP) {
    let bodyCost = 0;
    let mindCost = 0;
    let soulCost = 0;
    if (talent.body.amount || typeof talent.body == 'number')
      bodyCost += talent.body.amount || talent.body;
    if (talent.mind.amount || typeof talent.mind == 'number')
      mindCost += talent.mind.amount || talent.mind;
    if (talent.soul.amount || typeof talent.soul == 'number')
      soulCost += talent.soul.amount || talent.soul;
    if (talent.body.type === Constants.DEPENDANT) {
      for (const act of talent.actions) {
        if (act.type === Constants.SUBSPECIES_TALENT) {
          const tree = act.tree || msg.data.tr;
          let subspeciesTalent = null;
          for (const tal of game.talents) {
            if (tal.primaryBranch && tal.tree === tree) {
              subspeciesTalent = tal;
              break;
            }
          }
          if (subspeciesTalent !== null) {
            if (subspeciesTalent.body.amount || typeof subspeciesTalent.body == 'number')
              bodyCost += subspeciesTalent.body.amount || subspeciesTalent.body;
            if (subspeciesTalent.mind.amount || typeof subspeciesTalent.mind == 'number')
              mindCost += subspeciesTalent.mind.amount || subspeciesTalent.mind;
            if (subspeciesTalent.soul.amount || typeof subspeciesTalent.soul == 'number')
              soulCost += subspeciesTalent.soul.amount || subspeciesTalent.soul;
          }
        } else if (act.type === Constants.CONTINUE_SUBSPECIES_TALENT) {
  
        }
      }
    }
    return [unspentTP >= bodyCost + mindCost + soulCost, bodyCost, mindCost, soulCost];
  }