import express from "express";
import expressWs from "express-ws";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as Constants from "./constants";
import * as Util from "./util";
dotenv.config({ path: "../.env" });

const app = express();
expressWs(app);
const router = express.Router();
const port = 3001;

// Allow express to parse JSON bodies
router.use(express.json());

router.post("/api/token", async (req, res) => {
  // Exchange the code for an access_token
  const response = await fetch(`https://discord.com/api/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.VITE_DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code: req.body.code,
    }),
  });

  // Retrieve the access_token from the response
  const { access_token } = await response.json();

  // Return the access_token to our client as { access_token: "..."}
  res.send({access_token});
});

router.post("/api/ping", async (req, res) => {
  res.send({"message": "hello!!!"});
});

app.use("/", router);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

class JSet extends Set {
  constructor(...a) {
    super(...a);
  }
  toJSON() {
    return [...this];
  }
}

class StatModifier {
  flat = 0.0; // flat increase to base value
  mult = 1.0; // multiplier (before flat has been added to base value)
  abMult = 1.0; // absolute multiplier (after flat has been added to base value)
  constructor(flat = 0.0, mult = 1.0, abMult = 1.0) {
    this.flat = flat;
    this.mult = mult;
    this.abMult = abMult;
  }
  apply(value) {
    return ((value * mult) + this.flat) * this.abMult;
  }
  toJSON() {
    return {
      flat: this.flat,
      mult: this.mult,
      abMult: this.abMult
    };
  }
}

/**
 * @type {Object.<string, WebSocket>}
 */
const clients = (global.clients = Object.create(null));
/**
 * @type {Set.<string>}
 */
const uids = new Set();
/**
 * @type {Object.<string, Game>}
 */
const games = Object.create(null);
/**
 * @type {Object.<string, string>}
 */
const ids = Object.create(null);

class Game {
  name;
  channelId;
  state = Constants.SETTING_UP;
  password;
  users = new JSet();
  userData = Object.create(null);
  gm;
  species = {
    human: { name: "Human", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { any: 2 }, languages: { simple: 2 }, quirks: [] },
    automaton: { name: "Automaton", constitution: 7, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { any: 2 }, languages: { either: 1 }, quirks: [] },

    // superspecies aren't rendered on the client
    dwarf: { name: "Dwarf", superspecies: true, constitution: 4, endurance: 6, effervescence: 3, blockRating: [3, 4], dodgeRating: [1, 12], languages: { set: ["utopian", "dwarvish"] }, quirks: [] },
    copperDwarf: { name: "Copper Dwarf", subspecies: "dwarf", gifted: { set: [Constants.MEMORY, Constants.RESOLVE, Constants.ENGINEERING] }, quirks: [] },
    ironDwarf: { name: "Iron Dwarf", subspecies: "dwarf", gifted: { set: [Constants.MEMORY, Constants.RESOLVE, Constants.AWARENESS] }, quirks: [] },
    
    cyborg: { name: "Cyborg", superspecies: true, constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], languages: { simple: 1, set: ["utopian"] }, quirks: [] },
    biotechCyborg: { name: "Biotech Cyborg", subspecies: "cyborg", gifted: { set: [Constants.ENGINEERING, Constants.MEMORY, Constants.AWARENESS] }, quirks: [] },
    cyberneticCyborg: { name: "Cybernetic Cyborg", subspecies: "cyborg", gifted: { set: [Constants.ENGINEERING, Constants.MEMORY, Constants.POWER] }, quirks: [] },
    
    oxtus: { name: "Oxtus", superspecies: true, constitution: 4, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "oxtan"] }, quirks: [] },
    regalOxtus: { name: "Regal Oxtus", subspecies: "oxtus", gifted: { set: [Constants.MEMORY, Constants.PORTRAYAL, Constants.APPEAL] }, quirks: [] },
    brazenOxtus: { name: "Brazen Oxtus", subspecies: "oxtus", gifted: { set: [Constants.MEMORY, Constants.PORTRAYAL, Constants.POWER] }, quirks: [] },
    astuteOxtus: { name: "Astute Oxtus", subspecies: "oxtus", gifted: { set: [Constants.MEMORY, Constants.PORTRAYAL, Constants.ENGINEERING] }, quirks: [] },
    
    elf: { name: "Elf", superspecies: true, constitution: 3, endurance: 7, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "elvish"] }, quirks: [] },
    solarElf: { name: "Solar Elf", subspecies: "elf", gifted: { set: [Constants.SPEED, Constants.PORTRAYAL, Constants.STUNT] }, quirks: [] },
    lunarElf: { name: "Lunar Elf", subspecies: "elf", gifted: { set: [Constants.SPEED, Constants.PORTRAYAL, Constants.APPEAL] }, quirks: [] },
    twilightElf: { name: "Twilight Elf", subspecies: "elf", gifted: { set: [Constants.SPEED, Constants.PORTRAYAL, Constants.LANGUAGE] }, quirks: [] },
    
    cambion: { name: "Cambion", superspecies: true, constitution: 4, endurance: 6, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "primordial"] }, quirks: [] },
    angelicCambion: { name: "Angelic Cambion", subspecies: "cambion", gifted: { set: [Constants.POWER, Constants.APPEAL, Constants.STUNT] }, quirks: [] },
    demonicCambion: { name: "Demonic Cambion", subspecies: "cambion", gifted: { set: [Constants.POWER, Constants.APPEAL, Constants.PORTRAYAL] }, quirks: [] },
    eldritchCambion: { name: "Eldritch Cambion", subspecies: "cambion", gifted: { set: [Constants.POWER, Constants.APPEAL, Constants.MEMORY] }, quirks: [] },
    
    //goliath: { name: "Goliath", constitution: ???, endurance: ???, effervescence: ???, blockRating: [???, 4], dodgeRating: [??? 12], gifted: { set: [Constants.???, Constants.???, Constants.???] }, languages: { set: ["utopian", "???"] } },
  };
  talents = {
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
    versatile: { primaryBranch: true, tree: Constants.SPECIES, name: "Versatile", after: "flexible", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the second-tier talent chosen with the **Flexible** talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "flexible" }] }, // continues the tree chosen in the talent defined as "prev"
    malleable: { primaryBranch: true, tree: Constants.SPECIES, name: "Malleable", after: "versatile", requirements: [{ type: Constants.SPECIES, species: "human" }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the third-tier talent correlated to the talent chosen with the **Versatile** talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "versatile" }] },

    // automaton tree
    weakAbsorption: { tree: Constants.SPECIES, name: "Weak Absorption", after: null, requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 0, description: "You may spend 1 turn action and consume a Common or rarer Power Component to regain 3 stamina.", actions: [] },
    activeAbsorption: { tree: Constants.SPECIES, name: "Active Absorption", after: "weakAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 1, description: "You may spend 1 turn action and consume an Extraordinary or rarer Power Component to regain 6 stamina.", actions: [] },
    strongAbsorption: { tree: Constants.SPECIES, name: "Strong Absorption", after: "activeAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 1, description: "You may spend 1 turn action and consume an Rare or rarer Power Component to regain 12 stamina.", actions: [] },
    absoluteAbsorption: { tree: Constants.SPECIES, name: "Absolute Absorption", after: "strongAbsorption", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 0, soul: 2, description: "You may spend 1 turn action and consume a Legendary or rarer Power Component to regain 24 stamina.", actions: [] },
    thermalBarrierAutomaton: { tree: Constants.SPECIES, name: "Thermal Barrier", after: null, requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 2, mind: 0, soul: 0, description: "Your Heat and Chill defenses each increase by 2.", actions: [] },
    selfRepair: { tree: Constants.SPECIES, name: "Self Repair", after: "thermalBarrierAutomaton", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 2, soul: 0, description: "You may spend 6 turn actions to make an Engineering test. If the test succeeds the amount of DHP you're missing, you regain 2d4 DHP, otherwise you are dealt 3 damage. Dealt this way ignores defenses.", actions: [] },
    mechanicalMedic: { tree: Constants.SPECIES, name: "Mechanical Medic", after: "selfRepair", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 2, mind: 1, soul: 0, description: "When you use the **Self Repair** talent, you may consume a Common or rarer material component to gain a point of favor on the Engineering test.", actions: [] },
    thorough: { tree: Constants.SPECIES, name: "Thorough", after: "mechanicalMedic", requirements: [{ type: Constants.SPECIES, species: "automaton" }], body: 1, mind: 1, soul: 1, description: "When you succeed on the Engineering test using the **Self Repair** talent, you regain 2d8 DHP instead.", actions: [] },
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
    augmentPrep: { tree: Constants.SPECIES, name: "Augment Prep", after: "internalSlots", requirements: [{ type: Constants.SPECIES, species: "cyborg" }], body: 0, mind: 2, soul: 0, description: "You may use the **Quickened Augment** talent with 1 turn action rather than 2.", actions: [] },
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
    prosperity: { tree: Constants.PROWESS, repeatable: true, name: "Prosperity", after: "discipline", body: 2, mind: 2, soul: 2, description: "Increase either your Constitution, Endurance, or Effervescence by 1.", actions: [{ type: Constants.RESET_TALENT_BRANCH }] },
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
  };
  startingLevel = 10;
  creatures = {};
  languages = {
    utopian: {},
    dwarvish: {},
    oxtan: {},
    elvish: {},
    primordial: {}
  };
  spells = {

  };
  arts = {

  }; // custom magic arts
  alfuwuPatch = false;
  constructor(name, channelId, gm = -1, password = "") {
    this.name = name;
    this.channelId = channelId;
    this.gm = gm;
    this.password = password;
  }
  updateSpecies(...newSpecies) {
    const data = Object.assign({}, this.species);
    for (const specie of data)
      if (!newSpecies.includes(specie))
        delete data[specie];
    let s = JSON.stringify({ event: "species", data });
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  updateTalents(...newTalents) {
    const data = Object.assign({}, this.talents);
    for (const talent of data)
      if (!newTalents.includes(talent))
        delete data[talent];
    let s = JSON.stringify({ event: "talents", data });
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  updateLanguages(newData) {
    let s = JSON.stringify({ event: "language", newData });
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  updateUser(user, isGM=false, ...include) {
    const data = Object.assign({}, this);
    if (!include.includes("talents"))
      delete data.talents;
    if (!include.includes("species"))
      delete data.species;
    if (!include.includes("languages"))
      delete data.languages;
    if (!include.includes("users"))
      delete data.userData;
    let s = JSON.stringify({ event: "gameData", data }, (key, value) => value);
    clients[ids[user]].send(s);
  }
  updateUsers(ignore=1, ...include) {
    let i = 0;
    for (const user of this.users)
      if (i++ != ignore)
        this.updateUser(user, user.userId == this.gm, ...include);
  }
  isGM(id) {
    for (let user of this.users)
      if (user == id)
        return user.userId == this.gm;
  }
  getGM() {
    for (let user of this.users)
      if (user.userId == this.gm)
        return user;
  }
  addUser(id, avatar, name) {
    this.users.add(id);
    if (!(id in this.userData))
      this.userData[id] = this.createDefaultData(avatar, name);
    //console.log(name + " (" + id + ") ADDED");
    this.updateUsers();
  }
  removeUser(id) {
    this.users.delete(id);
    if (this.users.size == 1) {
      //this.state = Constants.LOBBY;
      //for (const user in this.userData)
      //  Object.assign(this.userData[user], { ready: false });
    }
    this.updateUsers();
  }
  readyUser(id, state = true) {
    this.userData[id].ready = state;
    //if (this.everoneReady())
    this.updateUsers();
  }
  everyoneReady() {
    for (const user of this.users)
      if (!this.userData[user].ready)
        return false;
    return true;
  }
  applyTalent(user, talent) {
    if (talent.after && !this.userData[user].talents.has(talent.after))
      return;
    if (talent.requirements && !Util.meetsAllRequirements(this, user, talent.requirements))
      return;
    if (talent.special) {
      if (this.userData[user].level - this.userData[user].specialistTalents * 10 < 10)
        return; // cannot pick a specialist talent (too low level)
      this.userData[user].specialistTalents++;
    }
    this.userData[user].talents.add(talent);
    for (const act of talent.actions) {
      switch (act.type) {
        case Constants.MODIFY_SUBTRAIT:
          Util.applyOp(this.userData[user].subtraitModifiers[act.id], act);
          break;
        case Constants.MODIFY_META:
          if (act.id === Constants.SIMPLE_LANGUAGE)
            this.userData[user].availableSimpleLanguages = Util.applyOp(this.userData[user].availableSimpleLanguages, act);
          break;
        case Constants.MODIFY_CORE:
          Util.applyOp(this.userData[user].coreModifiers[act.id], act);
          break;
        case Constants.MODIFY_SCORE:
          if (act.id <= Constants.EFFERVESCENCE) {
            Util.applyOp(this.userData[user].scoreModifiers[act.id], act);
            
            // todo: calculate minimum con/end/eff stats
            let stat, max = 0;
            let min = 2;
            if (act.id === Constants.CONSTITUTION) {
              stat = this.userData[user].constitution;
              max = Util.getMaxCon(this, this.userData[user]);
            } else if (act.id === Constants.ENDURANCE) {
              stat = this.userData[user].endurance;
              max = Util.getMaxEnd(this, this.userData[user]);
            } else if (act.id === Constants.EFFERVESCENCE) {
              stat = this.userData[user].effervescence;
              max = Util.getMaxEff(this, this.userData[user]);
            }
            const applied = this.userData[user].scoreModifiers[act.id].apply(stat);
            if (applied > max)
              this.userData[user].scoreModifiers[act.id].flat -= applied - max;
            else if (applied < min)
              this.userData[user].scoreModifiers[act.id].flat += min - applied;
          }
          break;
      }
    }
  }
  createDefaultData(avatar, name) {
    const defaultSpecie = Object.keys(this.species)[0];
    return {
      creatingCharacter: true,
      playerName: name,
      species: defaultSpecie,
      level: this.startingLevel,
      specialistTalents: 0,
      xp: 0,
      body: 0,
      mind: 0,
      soul: 0,
      chillDef: 0,
      energyDef: 0,
      heatDef: 0,
      physicalDef: 0,
      psycheDef: 0,
      scoreModifiers: [new StatModifier(), new StatModifier(), new StatModifier()],
      /** @type {[number, number]} */
      blockRating: [this.species[defaultSpecie].blockRating],
      /** @type {[number, number]} */
      dodgeRating: [this.species[defaultSpecie].dodgeRating],
      blockBonus: 0,
      dodgeBonus: 0,
      /** @type {Set.<string>} */
      gifted: new JSet(this.species[defaultSpecie].languages.set ?? this.species[defaultSpecie].gifted.set),
      /** @type {number} */
      availableGifteds: this.species[defaultSpecie].gifted.any || 0,
      coreModifiers: [new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier()],
      dhpMod: new StatModifier(),
      shpMod: new StatModifier(),
      staminaMod: new StatModifier(),
      dhp: this.startingLevel, // effervescence * soul, except soul is 0 for new characters so that equates to 0
      shp: this.startingLevel, // ^
      stamina: this.startingLevel, // ^
      /** @type {Set.<string>} */
      languages: new JSet(this.species[defaultSpecie].languages.set ?? this.species[defaultSpecie].languages.set),
      /** @type {number} */
      availableSimpleLanguages: this.species[defaultSpecie].languages.simple || 0,
      /** @type {number} */
      availableComplexLanguages: this.species[defaultSpecie].languages.complex || 0,
      /** @type {number} */
      availableEitherLanguages: this.species[defaultSpecie].languages.either || 0,
      /** @type {Set.<string>} */
      talents: new JSet(),
      /** @type {Set.<string>} */
      inventory: new JSet(),
      // speed, dexterity, power, fortitude, 
      subtraits: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      subtraitModifiers: [new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier(), new StatModifier()],
      ready: false,
      avatar,
      name,
    };
  }
}

function guid() {
  return `${randHex(8)}-${randHex(4)}-${randHex(4)}-${randHex(4)}-${randHex(12)}`;
}

function randHex(length) {
  return Math.random()
    .toString(16)
    .slice(2, 2 + length);
}

router.ws(
  "/api/ws",
  /** @param {WebSocket} ws */ (ws) => {
    const uuid = guid();
    clients[uuid] = ws;
    uids.add(uuid);
    ws.send(JSON.stringify({ event: "clientId", data: uuid }));
    ws.on("message", (data) => {
      if (data == '{"event":"pong"}') // just ignore pongs
        return;
      let msg;
      try {
        msg = JSON.parse(data);
      } catch {
        msg = data;
      }
      if (msg.event) {
        if (!(msg.data.channelId in games) && typeof msg.data.channelId === Number && msg.data.channelId >= 0)
          games[msg.data.channelId] = new Game(msg.data.gameName || "Unnamed", msg.data.channelId, msg.data.userId || -1);
        const game = games[msg.data.channelId];
        switch (msg.event) {
          case "userData":
            ws.data = msg.data;
            ids[msg.data.userId] = uuid;
            game.addUser(msg.data.userId, msg.data.avatar, msg.data.name);
            ws.send(JSON.stringify({ event: "resSelfData", data: game.userData[game.users[msg.data.userId]]}));
            return;
          case "ready":
            game.readyUser(ws.data.userId, msg.data);
            return;
          case "reqUserData":
            ws.send(JSON.stringify({ event: "resUserData", data: clients[ids[msg.data]].data }));
            return;
          case "reqSelfData":
            ws.send(JSON.stringify({ event: "resSelfData", data: game.userData[game.users[msg.data.userId]]}));
            return;
          case "updateSelfData":
            const user = game.users[msg.data.userId];
            switch (msg.data.type) {
              case "n": // name change
                game.userData[user].name = msg.data.n;
                break;
              case "t": // talent
                const talent = game.talents[msg.data.t];
                const [meetsReq, bodyCost, mindCost, soulCost] = Util.meetsTPRequirement(game, talent, game.userData[user].level - game.userData[user].body - game.userData[user].mind - game.userData[user].soul, msg.data.tr);
                if (meetsReq) {
                  game.applyTalent(user, talent);
                  game.userData[user].body += bodyCost;
                  game.userData[user].mind += mindCost;
                  game.userData[user].soul += soulCost
                }
                break;
            }
            game.updateUsers();
            return;
          case "addSpecies":
            return;
          case "toggleAlfuwuPatch":
            
            return;
        }
      }
      console.log(msg, JSON.stringify(data));
    });
    ws.on("close", () => {
      delete clients[uuid];
      uids.delete(uuid);
      if (ws.data?.channelId in games) {
        const game = games[ws.data.channelId];
        game.removeUser(ws.data.userId);
        if (game.users.size == 0)
          delete games[ws.data.channelId];
      }
    });
  }
);

// dev stuff
/*const g = new Game();
const uid = 0;
const uuid = guid();
uids.add(uuid);
ids[uid] = uuid;
clients[ids[uid]] = {
  send: function(data){
    console.log(data);
  }
}
g.addUser(uid, null, "hii");
g.applyTalent(uid, g.talents.adaptableDefenseHuman);
g.applyTalent(uid, g.talents.acrobat);
g.applyTalent(uid, g.talents.archmage);
g.applyTalent(uid, g.talents.championBrawler);
console.log(g.userData[uid]);*/