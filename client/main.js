import setupDiscordSdk, { serverless } from "./util/discord";
import * as Constants from "./constants";

import InGame from "./pages/ingame";
import CharacterSheet from "./pages/character";
import Talents from "./pages/talents";
import Actions from "./pages/actions";
import Inventory from "./pages/inventory";
import Language from "./pages/language";
import Handbook from "./pages/handbook";
import Notes from "./pages/notes";
import Loading from "./pages/loading";
import Creature from "./pages/gm/creature";
import Fight from "./pages/gm/fight";
import GMInGame from "./pages/gm/ingame";
import LanguageCreation from "./pages/gm/language";
import SpeciesCreation from "./pages/gm/species";
import TalentCreation from "./pages/gm/talent";
import Page from "./pages/page";

export const characterData = {
  species: "human",
  xp: 500,
  body: 0,
  mind: 0,
  soul: 0,
  coreModifiers: [{flat: 0, mult: 1, abMult: 1 }, {flat: 0, mult: 1, abMult: 1}, {flat: 0, mult: 1, abMult: 1}],
  scoreModifiers: [{flat: 0, mult: 1, abMult: 1 }, {flat: 0, mult: 1, abMult: 1}, {flat: 0, mult: 1, abMult: 1}],
  blockRating: [[2, 6]],
  dodgeRating: [[2, 14]],
  level: 10,
  cBody() {
    return applyModifier(this.coreModifiers[0], this.body);
  },
  cMind() {
    return applyModifier(this.coreModifiers[1], this.mind);
  },
  cSoul() {
    return applyModifier(this.coreModifiers[2], this.soul);
  },
  cCon() {
    return applyModifier(this.scoreModifiers[0], game.species[this.species].constitution);
  },
  cEnd() {
    return applyModifier(this.scoreModifiers[1], game.species[this.species].endurance);
  },
  cEff() {
    return applyModifier(this.scoreModifiers[2], game.species[this.species].effervescence);
  }
};
export const game = {
  species: {
    "": { name: "", constitution: 1, endurance: 1, effervescence: 1, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { }, languages: { } },
    human: { name: "Human", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: [0] }, languages: { simple: 2 }}
  },
  treeColors: {
    // brightness 1 -> sepia -> saturation -> hue shift -> brightness 2 -> contrast
    [Constants.SPECIES]: [undefined, 21, 100, 169, 90, 87],
    [Constants.WARFARE]: [50, 20, 400, 317, 123, 180],
    [Constants.TACTICS]: [50, 12, 600, 84, 130, 168],
    [Constants.INNOVATION]: [80, 17, 500, 339, 97, 171],
    [Constants.MAGECRAFT]: [75, 72, 120, 27, 102, 165],
    [Constants.INFLUENCE]: [45, 93, 150, 187, undefined, 180],
    [Constants.PROWESS]: [45, 72, 120, 205, undefined, 161],
  },
  talents: {
    // human tree
    adaptableDefenseHuman: { tree: Constants.SPECIES, name: "Adaptable Defense", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 0, soul: 1, description: "Each of your defenses increase by 1.", actions: [{ type: Constants.MODIFY_CORE, id: Constants.CHILL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.ENERGY_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.HEAT_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PHYSICAL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PSYCHE_DEF, amount: 1, op: Constants.ADD }] },
    quickFootingHuman: { tree: Constants.SPECIES, name: "Quick Footing", after: "adaptableDefenseHuman", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 1, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [{ type: Constants.MODIFY_DODGE_RATING, amount: [1, 12], op: Constants.ADD }] },
    strongDefenseHuman: { tree: Constants.SPECIES, name: "Strong Defense", after: "quickFootingHuman", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 0, soul: 1, description: "Your Block Rating increases by 1d4.", actions: [{ type: Constants.MODIFY_BLOCK_RATING, amount: [1, 4], op: Constants.ADD }] },
    physicalCombatHuman: { tree: Constants.SPECIES, name: "Physical Combat", after: "strongDefenseHuman", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 1, mind: 1, soul: 0, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an additional 2d8 physical damage.", actions: [] }, // combat is handled by GM (too complex, would be limiting to make it defined)
    inventiveHuman: { tree: Constants.SPECIES, name: "Inventive", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 0, description: "When crafting an item other than a component, you require 1 less material component of your choice, minimum of 1.", actions: [{ type: Constants.CRAFTING }] },
    creativeHuman: { tree: Constants.SPECIES, name: "Creative", after: "inventiveHuman", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 1, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    prodigy: { tree: Constants.SPECIES, name: "Prodigy", after: "creativeHuman", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 1, description: "Choose a subtrait. You become gifted in it.", actions: [{ type: Constants.MODIFY_META, id: Constants.ANY_GIFTED, amount: 1, op: Constants.ADD }] },
    expertise: { tree: Constants.SPECIES, name: "Expertise", after: "prodigy", requirements: [{ type: Constants.SPECIES, species: "human" }], body: 0, mind: 1, soul: 2, description: "Whenever you make a test using a subtrait that you are gifted in, you may spend 5 stamina to gain a point of favor. You may only gain a point of favor this way once per test.", actions: [] }, // add action to add a thingy that shows for players when making tests?
    // the only thing primaryBranch does is make the traits render differently (bc they're ✨special✨)
    flexible: { primaryBranch: true, tree: Constants.SPECIES, name: "Flexible", after: null, requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the first-tier talent of any subspecies talent tree. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.SUBSPECIES_TALENT, tree: null }] }, // specifying tree as null allows any tree to be used. otherwise, if a a string is supplied, it will use that species' talent tree, or, if an int is supplied, it will use that core tree
    versatile: { primaryBranch: true, tree: Constants.SPECIES, name: "Versatile", after: "flexible", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the second-tier talent chosen with the <b>Flexible</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "flexible" }] }, // continues the tree chosen in the talent defined as "prev"
    malleable: { primaryBranch: true, tree: Constants.SPECIES, name: "Malleable", after: "versatile", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the third-tier talent correlated to the talent chosen with the <b>Versatile</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "versatile" }] },

    // automaton tree
    weakAbsorption: { tree: Constants.SPECIES, name: "Weak Absorption", after: null, requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 0, description: "You may spend 1 turn action and consume a Common or rarer Power Component to regain 3 stamina.", actions: [] },
    activeAbsorption: { tree: Constants.SPECIES, name: "Active Absorption", after: "weakAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 1, description: "You may spend 1 turn action and consume an Extraordinary or rarer Power Component to regain 6 stamina.", actions: [] },
    strongAbsorption: { tree: Constants.SPECIES, name: "Strong Absorption", after: "activeAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 1, description: "You may spend 1 turn action and consume an Rare or rarer Power Component to regain 12 stamina.", actions: [] },
    absoluteAbsorption: { tree: Constants.SPECIES, name: "Absolute Absorption", after: "strongAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 2, description: "You may spend 1 turn action and consume a Legendary or rarer Power Component to regain 24 stamina.", actions: [] },
    thermalBarrierAutomaton: { tree: Constants.SPECIES, name: "Thermal Barrier", after: null, requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 2, mind: 0, soul: 0, description: "Your Heat and Chill defenses each increase by 2.", actions: [] },
    selfRepair: { tree: Constants.SPECIES, name: "Self Repair", after: "thermalBarrierAutomaton", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 2, soul: 0, description: "You may spend 6 turn actions to make an Engineering test. If the test succeeds the amount of DHP you're missing, you regain 2d4 DHP, otherwise you are dealt 3 damage. Dealt this way ignores defenses.", actions: [] },
    mechanicalMedic: { tree: Constants.SPECIES, name: "Mechanical Medic", after: "selfRepair", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 2, mind: 1, soul: 0, description: "When you use the <b>Self Repair</b> talent, you may consume a Common or rarer material component to gain a point of favor on the Engineering test.", actions: [] },
    thorough: { tree: Constants.SPECIES, name: "Thorough", after: "mechanicalMedic", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 1, soul: 1, description: "When you succeed on the Engineering test using the <b>Self Repair</b> talent, you regain 2d8 DHP instead.", actions: [] },
    kineticBufferAutomaton: { primaryBranch: true, tree: Constants.SPECIES, name: "Kinetic Buffer", after: null, requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 1, soul: 0, description: "Your Energy defense increases by 4.", actions: [] },
    conductiveAutomaton: { primaryBranch: true, tree: Constants.SPECIES, name: "Conductive", after: "kineticBuffer", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 1, description: "Whenever you take any amount of Energy damage, you regain that much stamina.", actions: [] },
    mechanized: { primaryBranch: true, tree: Constants.SPECIES, name: "Mechanized", after: "conductiveAutomaton", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 2, mind: 0, soul: 1, description: "When you are the target of an attack, you may spend 1 interrupt action and up to 7 stamina to increase one of your defenses by the amount of stamina spent for the rest of the action.", actions: [] },
    
    // dwarf tree
    thickSkinDwarf: { tree: Constants.SPECIES, name: "Thick Skin", after: null, requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 2, mind: 0, soul: 0, description: "Your Physical defense increases by 4.", actions: [] },
    strongDefenseDwarf: { tree: Constants.SPECIES, name: "Strong Defense", after: "thickSkinDwarf", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 2, mind: 0, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    physicalCombatDwarf: { tree: Constants.SPECIES, name: "Physical Combat", after: "strongDefenseDwarf", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 1, mind: 1, soul: 0, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an addition 2d8 Physical damage.", actions: [] },
    kineticBufferDwarf: { tree: Constants.SPECIES, name: "Kinetic Buffer", after: "physicalCombatDwarf", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 1, mind: 1, soul: 1, description: "Your Energy defense increases by 4.", actions: [] },
    oreScent: { tree: Constants.SPECIES, name: "Ore Scent", after: null, requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 0, mind: 1, soul: 0, description: "You gain a point of favor on tests made to forage and to find natural resources", actions: [] },
    stubbornDwarf: { tree: Constants.SPECIES, name: "Stubborn", after: "oreScent", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 0, mind: 0, soul: 1, description: "You gain a point of favor on tests made to resist being influenced or forced to commit an action.", actions: [] },
    ironWillDwarf: { tree: Constants.SPECIES, name: "Iron Will", after: "stubbornDwarf", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 0, mind: 1, soul: 1, description: "Your Psyche defense increases by 4.", actions: [] },
    proudDwarf: { tree: Constants.SPECIES, name: "Proud", after: "ironWillDwarf", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], body: 0, mind: 0, soul: 2, description: "When you spend 5 or more stamina on something other than casting a spell, you may make a Portrayal test. If the test succeeds the amount of stamina spent, you regain 2 stamina. You may only make 1 Portrayal test per stamina costing event.", actions: [] },
    
    // copper dwarf tree
    inventiveCopperDwarf: { primaryBranch: true, tree: Constants.SPECIES, name: "Inventive", after: null, requirements: [{ type: Constants.SPECIES, species: "copperDwarf" }], body: 0, mind: 1, soul: 0, description: "When crafting an item other than a component, you require 1 less material component of your choice, minimum cost of 1.", actions: [] },
    ingenious: { primaryBranch: true, tree: Constants.SPECIES, name: "Ingenious", after: "inventiveCopperDwarf", requirements: [{ type: Constants.SPECIES, species: "copperDwarf" }], body: 0, mind: 2, soul: 0, description: "When crafting an item other than a component, you require 1 less refinement component of your choice, minimum cost of 1.", actions: [] },
    brilliant: { primaryBranch: true, tree: Constants.SPECIES, name: "Brilliant", after: "ingenious", requirements: [{ type: Constants.SPECIES, species: "copperDwarf" }], body: 0, mind: 3, soul: 0, description: "When crafting an item other than a component, you require 1 less power component of your choice, minimum cost of 1.", actions: [] },
    
    // iron dwarf tree
    creativeIronDwarf: { primaryBranch: true, tree: Constants.SPECIES, name: "Creative", after: null, requirements: [{ type: Constants.SPECIES, species: "ironDwarf" }], body: 0, mind: 0, soul: 2, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    mageMentalityIronDwarf: { primaryBranch: true, tree: Constants.SPECIES, name: "Mage Mentality", after: "creativeIronDwarf", requirements: [{ type: Constants.SPECIES, species: "ironDwarf" }], body: 0, mind: 0, soul: 2, description: "You gain a point of favor on tests made to remain focused and keep concentration.", actions: [] },
    runicBufferIronDwarf: { primaryBranch: true, tree: Constants.SPECIES, name: "Runic Buffer", after: "mageMentalityIronDwarf", requirements: [{ type: Constants.SPECIES, species: "ironDwarf" }], body: 0, mind: 0, soul: 2, description: "You gain a point of favor on tests made to resist spell effects.", actions: [] },
    
    // cyborg tree
    quickenedAugment: { tree: Constants.SPECIES, name: "Quickened Augment", after: null, requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 0, mind: 1, soul: 0, description: "You may spend 2 turn actions to augment or de-augment an item from yourself.", actions: [] },
    internalSlots: { tree: Constants.SPECIES, name: "Internal Slots", after: "quickenedAugment", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 1, mind: 1, soul: 0, description: "De-augmenting an item does not deal damage to you.", actions: [] },
    augmentPrep: { tree: Constants.SPECIES, name: "Augment Prep", after: "internalSlots", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 0, mind: 2, soul: 0, description: "You may use the <b>Quickened Augment</b> talent with 1 turn action rather than 2.", actions: [] },
    steelStrikes: { tree: Constants.SPECIES, name: "Steel Strike", after: "augmentPrep", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 1, mind: 1, soul: 0, description: "Weaponless attacks you make deal an amount of additional Physical damage equal to four times the number of items you have augmented.", actions: [] },
    thermalBarrierCyborg: { tree: Constants.SPECIES, name: "Thermal Barrier", after: null, requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 1, mind: 1, soul: 0, description: "Your Heat and Chill defenses increase by 2.", actions: [] },
    strongDefenseCyborg: { tree: Constants.SPECIES, name: "Strong Defense", after: "thermalBarrierCyborg", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 2, mind: 0, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    kineticBufferCyborg: { tree: Constants.SPECIES, name: "Kinetic Buffer", after: "strongDefenseCyborg", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 2, mind: 0, soul: 0, description: "Your Energy defense increases by 4.", actions: [] },
    activatedCombat: { tree: Constants.SPECIES, name: "Activated Combat", after: "kineticBufferCyborg", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 1, mind: 0, soul: 1, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an additional 2d6 Energy damage.", actions: [] },
    
    // biotech cyborg tree
    conductiveBiotechCyborg: { primaryBranch: true, tree: Constants.SPECIES, name: "Conductive", after: null, requirements: [{ type: Constants.SPECIES, species: "biotechCyborg" }], body: 1, mind: 1, soul: 0, description: "Whenever you take any amount of Energy damage, you regain that much stamina.", actions: [] },
    restorativeCycle: { primaryBranch: true, tree: Constants.SPECIES, name: "Restorative Cycle", after: "conductiveBiotechCyborg", requirements: [{ type: Constants.SPECIES, species: "biotechCyborg" }], body: 1, mind: 0, soul: 2, description: "You may spend 1 turn action and up to 4 SHP to regain an amount of stamina equal to double the amount of SHP spent.", actions: [] },
    practicalUsage: { primaryBranch: true, tree: Constants.SPECIES, name: "Practical Usage", after: "restorativeCycle", requirements: [{ type: Constants.SPECIES, species: "biotechCyborg" }], body: 2, mind: 1, soul: 0, description: "When you regain stamina, SHP, or DHP from an item, you regain twice as much instead.", actions: [] },
    
    // cybernetic cyborg tree
    thickShell: { primaryBranch: true, tree: Constants.SPECIES, name: "Thick Shell", after: null, requirements: [{ type: Constants.SPECIES, species: "cyberneticCyborg" }], body: 2, mind: 0, soul: 0, description: "Your Physical defense increases by 4.", actions: [] },
    activatedClash: { primaryBranch: true, tree: Constants.SPECIES, name: "Activated Clash", after: "thickShell", requirements: [{ type: Constants.SPECIES, species: "cyberneticCyborg" }], body: 2, mind: 0, soul: 0, description: "When you make an attack, you may spend an additional turn action and 4 stamina up to 5 times to deal an additional 2d10 Energy damage.", actions: [] },
    quickFootingCyberneticCyborg: { primaryBranch: true, tree: Constants.SPECIES, name: "Quick Footing", after: "activatedClash", requirements: [{ type: Constants.SPECIES, species: "cyberneticCyborg" }], body: 2, mind: 0, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [{ type: Constants.MODIFY_DODGE_RATING, amount: [1, 12], op: Constants.ADD }] },
    
    // oxtus tree
    socialSpores: { tree: Constants.SPECIES, name: "Social Spores", after: null, requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 0, mind: 0, soul: 1, description: "The range at which you may communicate with creatures telepathically increases by 20 meters.", actions: [] },
    hyperphotosynthesis: { tree: Constants.SPECIES, name: "Hyperphotosynthesis", after: "socialSpores", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 1, mind: 0, soul: 1, description: "When you successfully dodge any amount of Energy damage, you regain 1d4 stamina.", actions: [] },
    deepHeal: { tree: Constants.SPECIES, name: "Deep Heal", after: "hyperphotosynthesis", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 1, mind: 0, soul: 2, description: "If your current DHP is lower than half of your maximum DHP rounded down, you may spend 1 turn action and 1 SHP to regain 1 DHP.", actions: [] },
    regenerative: { tree: Constants.SPECIES, name: "Regenerative", after: "deepHeal", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 2, mind: 0, soul: 1, description: "When you take the Deep Breath action, you regain 1 SHP.", actions: [] },
    tireless: { tree: Constants.SPECIES, name: "Tireless", after: null, requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 0, mind: 1, soul: 0, description: "You do not gain points of Fatigure from lack of sleep.", actions: [] },
    adaptableDefenseOxtus: { tree: Constants.SPECIES, name: "Adaptable Defense", after: "tireless", requirements: [{ type: Constants.SPECIES, species: "otxus" }], body: 1, mind: 1, soul: 0, description: "Each of your defenses increase by 1.", actions: [] },
    remineralize: { tree: Constants.SPECIES, name: "Remineralize", after: "adaptableDefenseOxtus", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 1, mind: 1, soul: 0, description: "You may spend 1 minute to remineralize water. Any creature may spend 3 turn actions to drink it, regaining 1d4 stamina and 1d4 SHP. Water remineralized this way becomes impure after 1 hour.", actions: [] },
    naturalSupport: { tree: Constants.SPECIES, name: "Natural Support", after: "remineralize", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], body: 1, mind: 0, soul: 2, description: "You may spend 1 turn action and up to 10 SHP to force a touching creature to regain an amount of SHP equal to the amount spent.", actions: [] },
    
    // regal oxtus tree
    stubbornRegalOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Stubborn", after: null, requirements: [{ type: Constants.SPECIES, species: "regalOxtus" }], body: 0, mind: 0, soul: 1, description: "You gain a point of favor on tests made to resist being influenced or forced to commit an action.", actions: [] },
    persuasive: { primaryBranch: true, tree: Constants.SPECIES, name: "Persuasive", after: "stubbornRegalOxtus", requirements: [{ type: Constants.SPECIES, species: "regalOxtus" }], body: 0, mind: 0, soul: 2, description: "You gain a point of favor on tests made to influence and force creatures to commit an action.", actions: [] },
    beautifulRegalOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Beautiful", after: "persuasive", requirements: [{ type: Constants.SPECIES, species: "regalOxtus" }], body: 0, mind: 0, soul: 3, description: "You cannot gain points of disfavor on Appeal tests.", actions: [] },
    
    // brazen oxtus tree (yes brazen oxtii are trees wow so cool)
    quickFootingBrazenOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Quick Footing", after: null, requirements: [{ type: Constants.SPECIES, species: "brazenOxtus" }], body: 2, mind: 0, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [] },
    strongDefenseBrazenOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Strong Defense", after: "quickFootingBrazenOxtus", requirements: [{ type: Constants.SPECIES, species: "brazenOxtus" }], body: 2, mind: 0, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    berserk: { primaryBranch: true, tree: Constants.SPECIES, name: "Berserk", after: "strongDefenseBrazenOxtus", requirements: [{ type: Constants.SPECIES, species: "brazenOxtus" }], body: 3, mind: 0, soul: 0, description: "When you take the Attack action, you may spend 2 additional turn actions and 12 stamina to attack a random target within range. If you do, the attack's damage is doubled.", actions: [] },
    
    // astute oxtus tree
    inventiveAstuteOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Inventive", after: null, requirements: [{ type: Constants.SPECIES, species: "astuteOxtus" }], body: 0, mind: 1, soul: 0, description: "When crafting an item other than a component, you require 1 less material component of your choice, minimum cost of 1.", actions: [] },
    creativeAstuteOxtus: { primaryBranch: true, tree: Constants.SPECIES, name: "Creative", after: "inventiveAstuteOxtus", requirements: [{ type: Constants.SPECIES, species: "astuteOxtus" }], body: 0, mind: 2, soul: 0, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    naturalSurvivalist: { primaryBranch: true, tree: Constants.SPECIES, name: "Natural Survivalist", after: "creativeAstuteOxtus", requirements: [{ type: Constants.SPECIES, species: "astuteOxtus" }], body: 0, mind: 3, soul: 0, description: "When you harvest components from a creature or from foraging, you may make an Awareness test. If the test succeeds 11, you gain a random additional similar component. You may only make 1 Awareness test per harvest.", actions: [] },
    
    // elf tree
    mischevious: { tree: Constants.SPECIES, name: "Mischevious", after: null, requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 0, mind: 0, soul: 1, description: "You gain a point of favor on Appeal tests made against creatures that are hostile towards you.", actions: [] },
    youthful: { tree: Constants.SPECIES, name: "Youthful", after: "mischevious", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 0, mind: 0, soul: 2, description: "When you spend 5 or more stamina on something other than casting a spell, you may make a Portrayal test. If the test succeeds the amount of stamina spent, you regain 3 SHP. You may only make 1 Portrayal test per stamina costing event.", actions: [] },
    proudElf: { tree: Constants.SPECIES, name: "Proud", after: "youthful", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 0, mind: 0, soul: 2, description: "When you spend 5 or more stamina on something other than casting a spell, you may make a Portrayal test. If the test succeeds the amount of stamina spent, you regain 2 stamina. You may only make 1 Portrayal test per stamina costing event.", actions: [] },
    beautifulElf: { tree: Constants.SPECIES, name: "Beautiful", after: "proudElf", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 0, mind: 0, soul: 3, description: "You cannot gain points of disfavor on Appeal tests.", actions: [] },
    fast: { tree: Constants.SPECIES, name: "Fast", after: null, requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 2, mind: 0, soul: 0, description: "Your Land travel increases by 2.", actions: [] },
    fortunateElf: { tree: Constants.SPECIES, name: "Fortunate", after: "fast", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 1, mind: 0, soul: 1, description: "When you make a test, you may spend 3 stamina to reroll a single 1. You may only reroll any number of dice once per test.", actions: [] },
    spontaneous: { tree: Constants.SPECIES, name: "Spontaneous", after: "fortunateElf", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 2, mind: 0, soul: 0, description: "You may make an Agility test rather than a Speed test when calculating turn order.", actions: [] },
    daredevil: { tree: Constants.SPECIES, name: "Daredevil", after: "spontaneous", requirements: [{ type: Constants.SPECIES, species: "elf" }], body: 2, mind: 0, soul: 1, description: "You cannot gain points of disfavor on Stunt tests.", actions: [] },
    
    // solar elf tree
    strongDefenseSolarElf: { primaryBranch: true, tree: Constants.SPECIES, name: "Strong Defense", after: null, requirements: [{ type: Constants.SPECIES, species: "solarElf" }], body: 1, mind: 1, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    pridefulWarrior: { primaryBranch: true, tree: Constants.SPECIES, name: "Prideful Warrior", after: "strongDefenseSolarElf", requirements: [{ type: Constants.SPECIES, species: "solarElf" }], body: 1, mind: 1, soul: 0, description: "When you make a melee attack against a creature that can see you, you may spend 8 stamina to deal an additional 1d8 Physical damage. You may use this effect a number of times equal to your Stunt modifier per attack, minimum of 1.", actions: [] },
    championBrawler: { primaryBranch: true, tree: Constants.SPECIES, name: "Champion Brawler", after: "pridefulWarrior", requirements: [{ type: Constants.SPECIES, species: "solarElf" }], body: 1, mind: 0, soul: 1, description: "When making tests or calculating based on scores or modifiers, you may use your Stunt score in place of your Power score and use your Display score in place of your Strength score.", actions: [] },
    
    // lunar elf tree
    quickFootingLunarElf: { primaryBranch: true, tree: Constants.SPECIES, name: "Quick Footing", after: null, requirements: [{ type: Constants.SPECIES, species: "lunarElf" }], body: 1, mind: 1, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [] },
    valleyStalker: { primaryBranch: true, tree: Constants.SPECIES, name: "Valley Stalker", after: "quickFootingLunarElf", requirements: [{ type: Constants.SPECIES, species: "lunarElf" }], body: 1, mind: 0, soul: 1, description: "You gain a point of favor on tests made to remain inconspicuous.", actions: [] },
    championHunter: { primaryBranch: true, tree: Constants.SPECIES, name: "Champion Hunter", after: "valleyStalker", requirements: [{ type: Constants.SPECIES, species: "lunarElf" }], body: 1, mind: 0, soul: 1, description: "When making tests or calculating damage based on scores or modifiers, you may use your Appeal score in place of your Dexterity score and use your Charm score in place of your Agility score.", actions: [] },
    
    // twilight elf tree
    creativeTwilightElf: { primaryBranch: true, tree: Constants.SPECIES, name: "Creative", after: null, requirements: [{ type: Constants.SPECIES, species: "twilightElf" }], body: 0, mind: 1, soul: 1, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    mageMentalityTwilightElf: { primaryBranch: true, tree: Constants.SPECIES, name: "Mage Mentality", after: "creativeTwilightElf", requirements: [{ type: Constants.SPECIES, species: "twilightElf" }], body: 0, mind: 0, soul: 2, description: "You gain a point of favor on tests made to remain focused and to keep concentration.", actions: [] },
    championCaster: { primaryBranch: true, tree: Constants.SPECIES, name: "Champion Caster", after: "mageMentalityTwilightElf", requirements: [{ type: Constants.SPECIES, species: "twilightElf" }], body: 1, mind: 0, soul: 2, description: "When making tests or calculating based on scores or modifiers, you may use your Language score in place of your Resolve score and use your Charm score in place of your Will score.", actions: [] },
    
    // cambion tree
    thermalBarrierCambion: { tree: Constants.SPECIES, name: "Thermal Barrier", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 1, mind: 0, soul: 1, description: "Your Heat and Chill defenses each increase by 2.", actions: [] },
    rapidBlows: { tree: Constants.SPECIES, name: "Rapid Blows", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 2, mind: 0, soul: 0, description: "Your weaponless attacks require 1 turn action rather than 2.", actions: [] },
    strongDefenseCambion: { tree: Constants.SPECIES, name: "Strong Defense", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 2, mind: 0, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    kineticBufferCambion: { tree: Constants.SPECIES, name: "Kinetic Buffer", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 1, mind: 0, soul: 1, description: "Your Energy defense increases by 4.", actions: [] },
    hypercognant: { tree: Constants.SPECIES, name: "Hypercognant", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 1, mind: 1, soul: 0, description: "You cannot be inflicted with Unconsciousness unless you choose to, given you have more than 0 stamina and more than 0 DHP.", actions: [] },
    runicBufferCambion: { tree: Constants.SPECIES, name: "Runic Buffer", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 0, mind: 1, soul: 1, description: "You gain a point of favor on tests made to resist spell effects.", actions: [] },
    fortunateCambion: { tree: Constants.SPECIES, name: "Fortunate", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 0, mind: 1, soul: 1, description: "When you make a test, you may spend 3 stamina to reroll a single 1. You may only reroll any number of dice once per test.", actions: [] },
    proudCambion: { tree: Constants.SPECIES, name: "Proud", after: null, requirements: [{ type: Constants.SPECIES, species: "cambion" }], body: 0, mind: 1, soul: 1, description: "When you spend 5 or more stamina on something other than casting a spell, you may make a Portrayal test. If the test succeeds the amount of stamina spent, you regain 2 stamina. You may only make 1 Portrayal test per stamina costing event.", actions: [] },
    
    // angelic cambion tree
    quickFootingAngelicCambion: { primaryBranch: true, tree: Constants.SPECIES, name: "Quick Footing", after: null, requirements: [{ type: Constants.SPECIES, species: "angelicCambion" }], body: 1, mind: 0, soul: 1, description: "Your Dodge Rating increases by 1d12.", actions: [] },
    heavensHalo: { primaryBranch: true, tree: Constants.SPECIES, name: "Heaven's Halo", after: "quickFootingAngelicCambion", requirements: [{ type: Constants.SPECIES, species: "angelicCambion" }], body: 1, mind: 0, soul: 1, description: "Whenever you take the Deep Breath action, you may spend 1 DHP. If you do, choose any number of other creatures within 1 meter of you. They each regain 1 SHP.", actions: [] },
    otherworldlyGift: { primaryBranch: true, tree: Constants.SPECIES, name: "Otherworldly Gift", after: "heavensHalo", requirements: [{ type: Constants.SPECIES, species: "angelicCambion" }], body: 1, mind: 0, soul: 2, description: "When a creature within 5 meters of you makes a test, you may spend 1 interrupt action and 4 stamina up to once per test to give the creature a point of favor.", actions: [] },
    
    // demonic cambion tree
    thickSkinDemonicCambion: { primaryBranch: true, tree: Constants.SPECIES, name: "Thick Skin", after: null, requirements: [{ type: Constants.SPECIES, species: "demonicCambion" }], body: 1, mind: 1, soul: 0, description: "Your Physical defense increases by 4.", actions: [] },
    fallenHorns: { primaryBranch: true, tree: Constants.SPECIES, name: "Fallen Horns", after: "thickSkinDemonicCambion", requirements: [{ type: Constants.SPECIES, species: "demonicCambion" }], body: 1, mind: 0, soul: 1, description: "Your weaponless attacks deal 2d8 Physical damage.", actions: [] },
    otherworldlyCurse: { primaryBranch: true, tree: Constants.SPECIES, name: "Otherworldly Curse", after: "fallenHorns", requirements: [{ type: Constants.SPECIES, species: "demonicCambion" }], body: 1, mind: 0, soul: 2, description: "When a creature within 5 meters of you makes a test, you may spend 1 interrupt action and 4 stamina up to once per test to give the creature a point of disfavor.", actions: [] },
    
    // eldritch cambion tree
    telepathy: { primaryBranch: true, tree: Constants.SPECIES, name: "Telepathy", after: null, requirements: [{ type: Constants.SPECIES, species: "eldritchCambion" }], body: 0, mind: 1, soul: 0, description: "You may communicate telepathically with creatures that are able to communicate using a language you understand. Your telepathy has a maximum range of 10 meters.", actions: [] },
    mentalScreech: { primaryBranch: true, tree: Constants.SPECIES, name: "Mental Screech", after: "telepathy", requirements: [{ type: Constants.SPECIES, species: "eldritchCambion" }], body: 0, mind: 1, soul: 1, description: "When you make a weaponless attack, you may choose for it to deal 2d6 Psyche damage and have 5 meters of close range, 10 meters of far range, instead. Attacks made this way use your Memory modifier instead of Power.", actions: [] },
    ironWillEldritchCambion: { primaryBranch: true, tree: Constants.SPECIES, name: "Iron Will", after: "mentalScreech", requirements: [{ type: Constants.SPECIES, species: "eldritchCambion" }], body: 0, mind: 1, soul: 1, description: "Your Psyche defense increases by 4.", actions: [] },
    // ^ really? iron will is eldritch cambion's third subspecies talent? that's kinda lame, considering the other two cambion subspecies' third talents

    // warfare core tree
    cleave: { tree: Constants.WARFARE, name: "Cleave", after: null, body: 1, mind: 0, soul: 1, description: "When a melee attack you make reduses a creature's DHP to 0, you may retarget the remaining damage to another creature within the attack's range.", actions: [] },
    brawler: { tree: Constants.WARFARE, name: "Brawler", after: "cleave", body: 3, mind: 0, soul: 1, description: "You gain a point of favor on tests made to grapple creatures.", actions: [] },
    charger: { tree: Constants.WARFARE, name: "Charger", after: "brawler", body: 5, mind: 0, soul: 1, description: "When you take the Attack action with a melee weapon directly after taking the Travel action, you may reduce the amount of stamina required for the attack by double the number of meters traveled.", actions: [] },
    blitzer: { tree: Constants.WARFARE, name: "Blitzer", after: "charger", body: 7, mind: 0, soul: 1, description: "When you take the Attack action with a melee weapon, you may target each creature within the weapon's range rather than a single creature. Attacks made this way deal half damage to each creature, rounded up.", actions: [] },
    swiftStrike: { tree: Constants.WARFARE, name: "Swift Strike", after: null, body: 1, mind: 0, soul: 0, description: "When you make an attack with a weapon, you may spend 3 stamina to reduce the number of turn actions required by 1 any number of times, minimum cost of 4.", actions: [] },
    hastyAttacks: { tree: Constants.WARFARE, name: "Hasty Attacks", after: "swiftStrike", body: 1, mind: 1, soul: 0, description: "When you make an attack with a weapon, you may spend 5 stamina to reduce the number of turn actions required by 1 any number of times, minimum cost of 2.", actions: [] },
    recovery: { tree: Constants.WARFARE, name: "Recovery", after: "hastyAttacks", body: 2, mind: 2, soul: 0, description: "You may spend 3 turn actions and up to 20 stamina to regain an amount of SHP equal to the amount of stamina spent.", actions: [] },
    terminalDrive: { tree: Constants.WARFARE, name: "Terminal Drive", after: "recovery", body: 4, mind: 3, soul: 0, description: "When you make an attack with a weapon, you may spend 7 stamina to reduce the number of turn actions required by 1 any number of times, minimum cost of 1.", actions: [] },
    warmonger: { tree: Constants.WARFARE, name: "Warmonger", after: "terminalDrive", body: 4, mind: 4, soul: 1, description: "When a creature you're aware of takes the Attack action, you may spend 8 stamina to take the Attack action using interrupt actions as if they were turn actions.", actions: [] },
    sniper: { tree: Constants.WARFARE, name: "Sniper", after: null, body: 1, mind: 0, soul: 1, description: "Ranged weapon attacks you make have double the amount of close range.", actions: [] },
    titanSlayer: { tree: Constants.WARFARE, name: "Titan Slayer", after: "sniper", body: 3, mind: 0, soul: 1, description: "You gain a point of favor on tests made to scale creatures.", actions: [] },
    quickHands: { tree: Constants.WARFARE, name: "Quick Hands", after: "titanSlayer", body: 5, mind: 0, soul: 1, description: "When you make an attack with a ranged weapon that must be loaded or charged, you may spend 10 stamina to load or charge the weapon without paying the turn cost.", actions: [] },
    volley: { tree: Constants.WARFARE, name: "Volley", after: "quickHands", body: 7, mind: 0, soul: 1, description: "When you take the Attack action with a ranged weapon, you may target three times as many creatures within range and deal half the amount of damage to each creature, rounded up.", actions: [] },

    // tactics core tree
    sprint: { tree: Constants.TACTICS, name: "Sprint", after: null, body: 1, mind: 0, soul: 0, description: "When you take the Travel action, you may spend 3 stamina to add your Power score to your Land travel for the rest of the action.", actions: [] },
    athlete: { tree: Constants.TACTICS, name: "Athlete", after: "sprint", body: 1, mind: 2, soul: 0, description: "When you become the target of any effect, you may spend 3 stamina to take the Travel action using interrupt actions as if they were turn actions.", actions: [] },
    parkour: { tree: Constants.TACTICS, name: "Parkour", after: "athlete", body: 2, mind: 3, soul: 0, description: "A source of kinetic force can not deal more damage to you than half of your maximum DHP, rounded down.", actions: [] },
    reflexive: { tree: Constants.TACTICS, name: "Reflexive", after: null, body: 1, mind: 1, soul: 0, description: "Your Dodge Rating increases by 1d12.", actions: [] },
    defensive: { tree: Constants.TACTICS, name: "Defensive", after: "reflexive", body: 1, mind: 1, soul: 0, description: "Your Block Rating increases by 1d4.", actions: [] },
    sudden: { tree: Constants.TACTICS, name: "Sudden", after: "defensive", body: 2, mind: 2, soul: 0, description: "Your Dodge Rating increases by 2d12.", actions: [] },
    immovable: { tree: Constants.TACTICS, name: "Immovable", after: "sudden", body: 2, mind: 2, soul: 0, description: "Your Block Rating increases by 2d4.", actions: [] },
    totalPoise: { tree: Constants.TACTICS, name: "Total Poise", after: "immovable", body: 4, mind: 4, soul: 0, description: "Your Dodge Rating increases by 2d12 and your Block Rating increases by 2d4.", actions: [] },
    lively: { tree: Constants.TACTICS, name: "Lively", after: null, body: 1, mind: 0, soul: 1, description: "You gain a point of favor on tests made to decide turn order.", actions: [] },
    parry: { tree: Constants.TACTICS, name: "Parry", after: "lively", body: 3, mind: 0, soul: 3, description: "When you take the Block action against a melee attack, you may spend 1 additional interrupt action and 5 stamina to roll your melee weapon's attack rather than your Block Rating.", actions: [] },
    armorAptitude: { tree: Constants.TACTICS, name: "Armor Aptitude", after: "parry", body: 3, mind: 0, soul: 5, description: "When you take the Dodge action, you may spend 5 stamina to treat all of your defenses as if they were equal to your highest defense for the rest of the action.", actions: [] },

    // innovation core tree
    deconstructor: { tree: Constants.INNOVATION, name: "Deconstructor", after: null, body: 0, mind: 1, soul: 1, description: "You may spend 6 turn actions to destroy an item other than a component, receiving half of the components necessary to craft it rounded down.", actions: [] },
    alchemist: { tree: Constants.INNOVATION, name: "Alchemist", after: "deconstructor", body: 0, mind: 3, soul: 1, description: "When you craft a Consumable item, you craft twice as many instead.", actions: [] },
    tenacious: { tree: Constants.INNOVATION, name: "Tenacious", after: "alchemist", body: 0, mind: 5, soul: 2, description: "You may craft items and components without a tool station. Items and components crafted this way require twice as long to craft.", actions: [] },
    tinkerer: { tree: Constants.INNOVATION, name: "Tinkerer", after: null, body: 0, mind: 1, soul: 0, description: "You can craft Common items.", actions: [] },
    craftsman: { tree: Constants.INNOVATION, name: "Craftsman", after: "tinkerer", body: 0, mind: 3, soul: 0, description: "You can craft Extraordinary items.", actions: [] },
    artisan: { tree: Constants.INNOVATION, name: "Artisan", after: "craftsman", body: 0, mind: 5, soul: 0, description: "You can craft Rare items.", actions: [] },
    visionary: { tree: Constants.INNOVATION, name: "Visionary", after: "artisan", body: 0, mind: 7, soul: 0, description: "You can craft Legendary items.", actions: [] },
    creator: { tree: Constants.INNOVATION, name: "Creator", after: "visionary", body: 0, mind: 9, soul: 0, description: "You can craft Mythical items.", actions: [] },
    algorithmic: { tree: Constants.INNOVATION, name: "Algorithmic", after: null, body: 1, mind: 1, soul: 0, description: "Whenever you would use your Power or Dexterity modifier, you may spend 3 stamina to use your Engineering modifier instead.", actions: [] },
    mnemonic: { tree: Constants.INNOVATION, name: "Mnemonic", after: "algorithmic", body: 1, mind: 4, soul: 0, description: "You have a number of Recollection Charges equal to your Memory score. When you would make a test, you may spend a Recollection Charge to make a Memory test instead. You regain all charges after completing a rest.", actions: [] },
    intellectual: { tree: Constants.INNOVATION, name: "Intellectual", after: "mnemonic", body: 2, mind: 6, soul: 0, description: "Whenever another creature within 5 meters of you makes a test, given you can both sense each other, you may spend 1 interrupt action to add your Intellect modifier to its roll.", actions: [] },

    // magecraft core tree
    evocationArtistry: { tree: Constants.MAGECRAFT, name: "Evocation Artistry", after: null, body: 1, mind: 1, soul: 0, description: "You can cast and craft spells that require the Art of Evocation.", actions: [] },
    arrayArtistry: { tree: Constants.MAGECRAFT, name: "Array Artistry", after: "evocationArtistry", body: 1, mind: 2, soul: 0, description: "You can cast and craft spells that require the Art of Array.", actions: [] },
    wizardsWits: { tree: Constants.MAGECRAFT, name: "Wizard's Wits", after: "arrayArtistry", body: 2, mind: 2, soul: 0, description: "When you become the target of any effect, you may spend 2 interrupt actions to cast a spell. Spells cast this way cost double the amount of stamina, before discounts.", actions: [] },
    wakeArtistry: { tree: Constants.MAGECRAFT, name: "Wake Artistry", after: "wizardsWits", body: 2, mind: 3, soul: 0, description: "You can cast and craft spells that require the Art of Wake.", actions: [] },
    swiftCasting: { tree: Constants.MAGECRAFT, name: "Swift Casting", after: "wakeArtistry", body: 3, mind: 4, soul: 0, description: "You may spend 6 stamina to cast a spell with 2 turn actions or 11 stamina to cast it with 1 turn action. This cost does not count towards the cost of the spell.", actions: [] },
    enchantmentArtistry: { tree: Constants.MAGECRAFT, name: "Enchantment Artistry", after: null, body: 0, mind: 2, soul: 0, description: "You can cast and craft spells that require the Art of Enchantment.", actions: [] },
    magusApprentice: { tree: Constants.MAGECRAFT, name: "Magus Apprentice", after: "enchantmentArtistry", body: 0, mind: 2, soul: 0, description: "Spells you cast cost 2 less stamina, minimum cost of 1.", actions: [] },
    necromancyArtistry: { tree: Constants.MAGECRAFT, name: "Necromancy Artistry", after: "magusApprentice", body: 0, mind: 4, soul: 0, description: "You can cast and craft spells that require the Art of Necromancy.", actions: [] },
    runecraftAdept: { tree: Constants.MAGECRAFT, name: "Runecraft Adept", after: "necromancyArtistry", body: 0, mind: 7, soul: 0, description: "You may spend an additional turn action up to 3 times when casting a spell. If you do, the spell costs 4 less stamina for each additional turn action, minimum cost of 1.", actions: [] },
    illusionArtistry: { tree: Constants.MAGECRAFT, name: "Illusion Artistry", after: null, body: 0, mind: 1, soul: 1, description: "You can cast and craft spells that require the Art of Illusion.", actions: [] },
    divinationArtistry: { tree: Constants.MAGECRAFT, name: "Divination Artistry", after: "illusionArtistry", body: 0, mind: 2, soul: 1, description: "You can cast and craft spelles that require the Art of Divination.", actions: [] },
    bloodMagic: { tree: Constants.MAGECRAFT, name: "Blood Magic", after: "divinationArtistry", body: 0, mind: 2, soul: 2, description: "When you cast a spell, you may spend SHP instead of stamina. Spells cast this way cannot regain SHP. This does not count as a discoutn to cost.", actions: [] },
    alterationArtistry: { tree: Constants.MAGECRAFT, name: "Alteration Artistry", after: "bloodMagic", body: 0, mind: 3, soul: 2, description: "You can cast and craft spelles that require the Art of Alteration.", actions: [] },
    mageMurmur: { tree: Constants.MAGECRAFT, name: "Mage Murmur", after: "alterationArtistry", body: 0, mind: 4, soul: 3, description: "Whenever you take the Deep Breath action or regain stamina from consuming a component, regain 2 additional stamina..", actions: [] },

    // influence core tree
    impersonate: { tree: Constants.INFLUENCE, name: "Impersonate", after: null, body: 1, mind: 0, soul: 1, description: "You gain 2 points of favor on tests made to disguise yourself or to keep your identity unknown.", actions: [] },
    mimic: { tree: Constants.INFLUENCE, name: "Mimic", after: "impersonate", body: 2, mind: 0, soul: 2, description: "You gain 2 points of favor on tests made to mimic the actions of another creature.", actions: [] },
    sleuth: { tree: Constants.INFLUENCE, name: "Sleuth", after: "mimic", body: 3, mind: 0, soul: 3, description: "You gain 2 points of favor on tests made to deduce if another creature is lying or attempting to hide information from you.", actions: [] },
    executant: { tree: Constants.INFLUENCE, name: "Executant", after: "sleuth", body: 4, mind: 0, soul: 4, description: "Before you make a Portrayal, Stunt, or Display test, you may choose to treat each 5 rolled as if it was a 6 when calculating critical successes. If you do, treat each 2 rolled as if it was a 1 when calculating critical failures.", actions: [] },
    refreshing: { tree: Constants.INFLUENCE, name: "Refreshing", after: null, body: 0, mind: 0, soul: 1, description: "You may spend 3 turn actions to make an Appeal test. For each creature you choose that can sense and understand you, if the test was higher than the amount of stamina it was missing, it regains 1d8 stamina.", actions: [] },
    mentor: { tree: Constants.INFLUENCE, name: "Mentor", after: "refreshing", body: 0, mind: 0, soul: 3, description: "When a creature that you can sense makes a test, up to once per test, you may spend an interrupt action and 5 stamina to increase the roll by 1d4, given it understands you.", actions: [] },
    rousing: { tree: Constants.INFLUENCE, name: "Rousing", after: "mentor", body: 0, mind: 0, soul: 5, description: "You may spend 3 turn actions to make an Appeal test. For each creature you choose that can sense and understand you, if the test was higher than the amount of SHP it was missing, it regains 1d6 SHP.", actions: [] },
    influential: { tree: Constants.INFLUENCE, name: "Influential", after: "rousing", body: 0, mind: 0, soul: 7, description: "Whenever a creature within 5 meters of you makes a test, you may spend an interrupt action and 10 stamina up to once per test. If you do, it adds your modifier to the test.", actions: [] },
    linguist: { tree: Constants.INFLUENCE, name: "Linguist", after: null, body: 0, mind: 1, soul: 1, description: "You gain a point of favor on tests made to gain information from languages you don't understand.", actions: [] },
    fluent: { tree: Constants.INFLUENCE, name: "Fluent", after: "linguist", body: 0, mind: 2, soul: 2, description: "You learn an additional language of your choice.", actions: [] },
    broadcast: { tree: Constants.INFLUENCE, name: "Broadcast", after: "fluent", body: 0, mind: 3, soul: 3, description: "When you communicate, you may choose for creatures that sense you to gain 2 points of favor on tests made to deduce what you're saying, regardless of what languages they understand.", actions: [] },
    polyglot: { tree: Constants.INFLUENCE, name: "Polyglot", after: "broadcast", body: 0, mind: 4, soul: 4, description: "Before you make an Appeal, Language, or Charm test, you may choose to treat each 5 rolled as if it was a 6 when calculating critical successes. If you do, treat each 2 rolled as if it was a 1 when calculating critical failures.", actions: [] },

    // prowess core tree
    traveler: { tree: Constants.PROWESS, repeatable: true, name: "Traveler", after: null, body: 1, mind: 1, soul: 1, description: "Choose between Land travel and Water travel. Your travel of the chosen type increases by 2.", actions: [] },
    adventurer: { tree: Constants.PROWESS, repeatable: true, name: "Adventurer", after: "traveler", body: 1, mind: 1, soul: 1, description: "Choose two defenses. They each increase by 2.", actions: [] },
    voyager: { tree: Constants.PROWESS, repeatable: true, name: "Voyager", after: "adventurer", body: 1, mind: 1, soul: 1, description: "Choose either your Block Rating or Dodge Rating. If you choose your Block Rating, it increases by 1d4. If you choose your Dodge Rating, it increases by 1d12.", actions: [{ type: Constants.RESET_TALENT_BRANCH }] },
    practice: { tree: Constants.PROWESS, repeatable: true, name: "Practice", after: null, body: 1, mind: 1, soul: 1, description: "Choose one or two subtraits. If one is chosesn, it increases by 2 given it wouldn't increase past its maximum. If two are chosen, they both increase by 1, given they aren't at their maximum.", actions: [] },
    discipline: { tree: Constants.PROWESS, repeatable: true, name: "Discipline", after: "practice", body: 1, mind: 1, soul: 1, description: "You become gifted in a subtrait of your choice. If you are gifted in each subtrait, instead choose a subtrait. It increases by 3, given it wouldn't increase past its maximum.", actions: [] },
    prosperity: { tree: Constants.PROWESS, repeatable: true, name: "Propserity", after: "discipline", body: 2, mind: 2, soul: 2, description: "Increase either your Constitution, Endurance, or Effervescence by 1.", actions: [{ type: Constants.RESET_TALENT_BRANCH }] },
    nomad: { tree: Constants.PROWESS, repeatable: true, name: "Nomad", after: null, body: 2, mind: 0, soul: 0, description: "When you regain 5 or more SHP, you regain an additional 1d4 SHP.", actions: [] },
    wanderer: { tree: Constants.PROWESS, repeatable: true, name: "Wanderer", after: "nomad", body: 0, mind: 2, soul: 0, description: "When you spend any amount of stamina, you may reduce the cost by an additional 1 stamina, minimum cost of half the original, rounded up.", actions: [] },
    vagabond: { tree: Constants.PROWESS, repeatable: true, name: "Vagabond", after: "wanderer", body: 0, mind: 0, soul: 2, description: "When you finish a rest, you regain an additional 1d4 DHP.", actions: [{ type: Constants.RESET_TALENT_BRANCH }] },

    // basic specialist talents
    silentSteps: { special: true, name: "Silent Steps", requirements: [], description: "You gain a point of favor on tests made to remain inconspicuous.", actions: [] },
    mageFighter: { special: true, name: "Mage Fighter", requirements: [], description: "When you are affected by a spell using the Art of Array, you may make a Will contest against the caster. If you succeed the test, the spell fails and has no effect, though all costs are still paid by the caster.", actions: [] },
    sageSlayer: { special: true, name: "Sage Slayer", requirements: [{ type: Constants.SPECIALIST_TALENT, talent: "mageFighter" }], description: "When you are affected by a spell, you know the effects of the spell and may use interrupt actions before the effects resolve.", actions: [] },
    coupDeGrace: { special: true, name: "Coup de Grâce", requirements: [{ type: Constants.SUBTRAIT_SCORE, trait: Constants.STUNT, amount: 7 }], description: "When you make an attack against a creature that doesn't sense you, you may spend 8 stamina. If you do and the attack deals more damage than the creature's maximum DHP, its DHP is reduced to 0 instead. Otherwise, it deals half as much damage, rounded down.", actions: [] },
    huntersMark: { special: true, name: "Hunter's Mark", requirements: [{ type: Constants.SUBTRAIT_SCORE, trait: Constants.DEXTERITY, amount: 7 }], description: "When you make a test for accuracy using a ranged weapon, you may make an Agility test rather than a Dexterity test.", actions: [] },
    dualWielder: { special: true, name: "Dual Wielder", requirements: [{ type: Constants.TRAIT_SCORE, trait: Constants.STRENGTH, amount: 7 }, { type: Constants.TRAIT_SCORE, trait: Constants.AGILITY, amount: 7 }], description: "When you make an attack with multiple weapons simultaneously, you may spend 1 additional turn action and 8 stamina to have both weapons deal full damage.", actions: [] },
    intenseConcentration: { special: true, name: "Intense Concentration", requirements: [{ type: Constants.SUBTRAIT_SCORE, trait: Constants.RESOLVE, amount: 7 }], description: "When concentrating, you may cast spells and take the Attack, Block, and Dodge action.", actions: [] },
    splitFocus: { special: true, name: "Split Focus", requirements: [{ type: Constants.SUBTRAIT_SCORE, trait: Constants.AWARENESS, amount: 7 }], description: "You do not gain points of disfavor for focusing on multiple tasks when making tests to remain focused.", actions: [] },

    // skill specialist talents
    ironGripped: { special: true, name: "Iron Gripped", requirements: [], description: "Your Power score increases by 1. When a creature enters within 1 meter of you, you may take the Grapple action by spending 2 interrupt actions and 6 stamina.", actions: [] },
    poisedHandling: { special: true, name: "Poised Handling", requirements: [], description: "Your Dexterity score increases by 1. You gain a point of favor on tests made to decide the accuracy of attacks made with ranged weapons.", actions: [] },
    expeditious: { special: true, name: "Expeditious", requirements: [], description: "Your Speed score increases by 1. You may spend 3 stamina to take the Travel action with no turn action cost, up to once per turn on your turn.", actions: [] },
    pragmatic: { special: true, name: "Pragmatic", requirements: [], description: "Your Engineering score increases by 1. You gain a point of favor on tests made to use or alter devices.", actions: [] },
    photographicMemory: { special: true, name: "Photographic Memory", requirements: [], description: "Your Memory score increases by 1. When you make a test to recall information, if you roll less than a 10 before modifiers, you roll a 10 instead.", actions: [] },
    survivor: { special: true, name: "Survivor", requirements: [], description: "Your Awareness score increases by 1. You cannot be surprised by an attack if your current SHP is equal to your maximum SHP.", actions: [] },
    acrobat: { special: true, name: "Acrobat", requirements: [], description: "Your Stunt score increases by 1. You gain a point of favor on tests made to climb and traverse obstacles and difficult terrain.", actions: [] },
    thespian: { special: true, name: "Thespian", requirements: [], description: "Your Portrayal score increases by 1. When you make a test to replicate the behavior of a creature, if you roll less than a 10 before modifiers, you roll a 10 instead.", actions: [] },
    engaging: { special: true, name: "Engaging", requirements: [], description: "Your Appeal score increases by 1. You gain a point of favor on tests made to persuade creatures that you've never attempted to persuade before, given that they're not hostile towards you.", actions: [] },
    phoneticComposer: { special: true, name: "Phonetic Composer", requirements: [], description: "Your Language score increases by 1. You know a self-made language, only known by creatures who you have taught. You may teach another creature over 8 hours.", actions: [] },
    naturalHealer: { special: true, name: "Natural Healer", requirements: [], description: "Your Resolve score increases by 1. You have a number of Restoration Charges equal to your Resolve score. You may spend 3 turn actions and any number of Restoration Charges to heal a touching creature 1d4 DHP per Restoration Charge used. You regain all charges after completing a rest.", actions: [] },
    rugged: { special: true, name: "Rugged", requirements: [], description: "Your Fortitude score increases by 1. You have a number of Protection Charges equal to your Fortitude score. You may spend any number of Protection Charges to add an additional die to your next Block or Dodge roll for each charge used. You regain all charges after completing a rest.", actions: [] },

    // species specialist talents
    adept: { special: true, name: "Adept", requirements: [{ type: Constants.SPECIES, species: "human" }], description: "Choose a subtrait. You become gifted in the chosen subtrait.", actions: [] },
    swiftConsumption: { special: true, name: "Swift Consumption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], description: "When you consume a power component to regain stamina, you may consume three times as many instead, given they are all the same rarity. If you do, you regain three times as much stamina.", actions: [] },
    unbreakableMind: { special: true, name: "Unbreakable Mind", requirements: [{ type: Constants.SPECIES, species: "dwarf" }], description: "If you would make an Engineering or Memory test, you may spend 10 stamina to make an Intellect test instead. If you would make a Resolve or Awareness test, you may spend 10 stamina to make a Will test instead.", actions: [] },
    artificialHybrid: { special: true, name: "Artificial Hybrid", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], description: "When you become the target of an effect, you may choose to be treated as a Construct rather than a Humanoid against the effect. You do not gain points of Fatigue from lack of sleep.", actions: [] },
    emotionalSynapse: { special: true, name: "Emotional Synapse", requirements: [{ type: Constants.SPECIES, species: "oxtus" }], description: "You may communicate telepathically with any creature regardless of what languages it understands, if any.", actions: [] },
    elvenPride: { special: true, name: "Elven Pride", requirements: [{ type: Constants.SPECIES, species: "elf" }], description: "When you make a Portrayal, Appeal, Stunt, or Language test, you may choose to reroll it once. You must take the new roll. You lose an amount of stamina equal to the new roll.", actions: [] },
    greaterIntervention: { special: true, name: "Greater Intervention", requirements: [{ type: Constants.SPECIES, species: "cambion" }], description: "When your DHP is reduced to 0 or less, you may choose to have your stamina reduced to 0 and your DHP reduced to 1 instead. You may not use this talent again until your DHP has been fully restored.", actions: [] },

    // fabrication specialist talents
    hastyCraft: { special: true, name: "Hasty Craft", requirements: [], description: "Crafting items and components requires that you spend half as much time.", actions: [] },
    augmenter: { special: true, name: "Augmenter", requirements: [{ type: Constants.TALENT, talent: "tinkerer" }], description: "You may remove an augmented item from a creature without dealing damage to it.", actions: [] },
    advancedConstruction: { special: true, name: "Advanced Construction", requirements: [{ type: Constants.TALENT, talent: "craftsman" }], description: "When you make an attack with a weapon that you crafted, additional damage calculated by modifiers is doubled, minimum bonus of +1.", actions: [] },
    relaxedCraft: { special: true, name: "Relaxed Craft", requirements: [{ type: Constants.TALENT, talent: "artisan" }], description: "You regain all SHP and stamina after crafting an item other than a component that is Common or rarer. You may only regain SHP and stamina this way once between rests.", actions: [] },
    cyberneticSpecialist: { special: true, name: "Cybernetic Specialist", requirements: [{ type: Constants.TALENT, talent: "visionary" }], description: "You may augment armor that isn't augmentable into creatures.", actions: [] },
    nanomechanics: { special: true, name: "Nanomechanics", requirements: [{ type: Constants.TALENT, talent: "creator" }], description: "You may augment two items into yourself per armor slot instead of one.", actions: [] },

    // arcane specialist talents
    subtleSpells: { special: true, name: "Subtle Spells", requirements: [{ type: Constants.AT_LEAST_FROM_TREE, tree: Constants.MAGECRAFT }], description: "You may cast spells without making any physical or audible gestures. Creatures gain a point of favor on tests made to resist spells cast this way. You may cast spells 2 meters through a medium rather than 1.", actions: [] },
    mysticalCognance: { special: true, name: "Mystical Cognance", requirements: [{ type: Constants.TALENT, talent: "subtleSpells" }], description: "When casting spells with no physical gestures, creatures do not gain favor on tests made to resist spells cast.", actions: [] },
    arcaneWithdrawal: { special: true, name: "Arcane Withdrawal", requirements: [{ type: Constants.TALENT, talent: "enchantmentArtistry" }], description: "You may spend 6 turn actions to undo a permanent spell that you cast, given you are within 1 meter of the spell's effects.", actions: [] },
    inTune: { special: true, name: "In Tune", requirements: [{ type: Constants.TRAIT_SCORE, trait: Constants.WILL, amount: 10 }], description: "Your Spellcap is equal to your Will score. If you have no Spellcap, spells you cast cost an amount of stamina less than or equal to your Soul score.", actions: [] },
    enlightened: { special: true, name: "Enlightened", requirements: [{ type: Constants.TALENT, talent: "inTune" }, { type: Constants.AT_LEAST_ANY_OF, talents: [ "evocationArtistry", "arrayArtistry", "wakeArtistry", "enchantmentArtistry", "necromancyArtistry", "illusionArtistry", "divinationArtistry", "alterationArtistry" ], amount: 3 }], description: "Your Spellcap is equal to double your Will score. If you have no Spellcap, spells you cast cost an amount of stamina less than or equal to your Mind score.", actions: [] },
    occultMind: { special: true, name: "Occult Mind", requirements: [{ type: Constants.AT_LEAST_FROM_TREE, tree: Constants.MAGECRAFT }], description: "You gain 2 points of favor on tests made to resist losing Focus or breaking concentration.", actions: [] },
    pyromancy: { special: true, name: "Pyromancy", requirements: [{ type: Constants.TALENT, talent: "evocationArtistry" }], description: "You may cast spells that deal only Heat damage and cost 3 stamina or less after discounts without spending any stamina.", actions: [] },
    cyromancy: { special: true, name: "Cyromancy", requirements: [{ type: Constants.TALENT, talent: "evocationArtistry" }], description: "You may cast spells that deal only Chill damage and cost 3 stamina or less after discounts without spending any stamina.", actions: [] },

    // ultimate specialist talents
    conquerer: { special: true, name: "Conquerer", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.WARFARE }], description: "On each of your turns, you have 9 turn actions instead of 6.", actions: [] },
    champion: { special: true, name: "Champion", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.TACTICS }], description: "On each other creature's turn, you have 3 interrupt actions rather than 2.", actions: [] },
    predisposed: { special: true, name: "Predisposed", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.INNOVATION }], description: "You may spend 6 turn actions to craft an item or component. Items crafted this way do not require a tool station.", actions: [] },
    archmage: { special: true, name: "Archmage", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.MAGECRAFT }], description: "You have no Spellcap.", actions: [] },
    faesong: { special: true, name: "Faesong", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.INFLUENCE }], description: "Whenever you regain DHP, you may choose any number of creatures that can sense and understand you. Each creature chosen this way regains a similar amount of DHP.", actions: [] },
    empirical: { special: true, name: "Empirical", requirements: [{ type: Constants.ALL_FROM_TREE, tree: Constants.PROWESS }], description: "Choose up to 6 subtraits and up to 4 defenses. Increase the chosen subtraits by a total of 6 and the chosen defenses by a total of 10, distributed in any way you choose. Subtraits cannot be increased beyond their maximum this way. Your choice of Constitution, Endurance, or Effervescence increases by 1.", actions: [] },
  },
  languages: {
    utopian: {
      name: "Utopian",
      description: "Utopian is a language spoken by all manner of people, utilized as a common tongue to communicate with other cultures and species.",
      alphabet: [
        'a', 'b', 'c', 'd', 'e', 'fa', 'fu', 'fe', 'fo', 'g', 'i', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'z', 'kpsop'
      ],
      alphabetCaseSensitive: false,
      words: [{
        word: "na",
        uses: [{
          type: "exclamation",
          state: "informal",
          meaning: "hello",
          example: "Na!",
          translation: "Hello!",
          literalTranslation: "Hello!"
        }]
      }]
    }
  }
};

export function applyModifier(modifier, stat) {
  return ((stat * modifier.mult) + modifier.flat) * modifier.abMult;
}

setupDiscordSdk().then(() => {
  console.log("done");
});

// Initialize pages
export const pages = {
  inGame: new InGame(),
  characterSheet: new CharacterSheet(),
  talents: new Talents(),
  actions: new Actions(),
  inventory: new Inventory(),
  language: new Language(),
  handbook: new Handbook(),
  notes: new Notes(),
  loading: new Loading(),
  gm: {
    creature: new Creature(),
    fight: new Fight(),
    inGame: new GMInGame(),
    language: new LanguageCreation(),
    species: new SpeciesCreation(),
    talent: new TalentCreation()
  }
};


function hidePages(p) {
  Object.values(p).forEach(v => {
    if (!(v instanceof Page) && typeof v === 'object')
      hidePages(v);
    else if (v instanceof Page)
      v.hide()
  });
}

export function showPage(page) {
  hidePages(pages);

  page.show();
}

// Initialize default page
//pages.loading.show();

// dev
//pages.gm.language.show();
//pages.gm.language.loadLanguage("utopian");
pages.talents.show();