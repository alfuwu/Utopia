import express from "express";
import expressWs from "express-ws";
import dotenv from "dotenv";
import fetch from "node-fetch";
import * as Constants from "./constants";
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
  state = SETTING_UP;
  password;
  users = new JSet();
  userData = Object.create(null);
  gm = 0;
  species = {
    human: { name: "Human", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { any: 2 }, languages: { simple: 2 } },
    automaton: { name: "Automaton", constitution: 7, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { any: 2 }, languages: { either: 1 } },

    dwarf: { name: "Dwarf", constitution: 4, endurance: 6, effervescence: 3, blockRating: [3, 4], dodgeRating: [1, 12], languages: { set: ["utopian", "dwarvish"] } },
    copperDwarf: { name: "Copper Dwarf", subspecies: "dwarf", gifted: { set: ["Memory", "Resolve", "Engineering"] } },
    ironDwarf: { name: "Iron Dwarf", subspecies: "dwarf", gifted: { set: ["Memory", "Resolve", "Awareness"] } },
    
    cyborg: { name: "Cyborg", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], languages: { simple: 1, set: ["utopian"] } },
    biotechCyborg: { name: "Biotech Cyborg", subspecies: "cyborg", gifted: { set: ["Engineering", "Memory", "Awareness"] } },
    cyberneticCyborg: { name: "Cybernetic Cyborg", subspecies: "cyborg", gifted: { set: ["Engineering", "Memory", "Power"] } },
    
    oxtus: { name: "Oxtus", constitution: 4, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "oxtan"] } },
    regalOxtus: { name: "Regal Oxtus", subspecies: "oxtus", gifted: { set: ["Memory", "Portrayal", "Appeal"] } },
    brazenOxtus: { name: "Brazen Oxtus", subspecies: "oxtus", gifted: { set: ["Memory", "Portrayal", "Power"] } },
    astuteOxtus: { name: "Astute Oxtus", subspecies: "oxtus", gifted: { set: ["Memory", "Portrayal", "Engineering"] } },
    
    elf: { name: "Elf", constitution: 3, endurance: 7, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "Eevish"] } },
    solarElf: { name: "Solar Elf", subspecies: "elf", gifted: { set: ["Speed", "Portrayal", "Stunt"] } },
    lunarElf: { name: "Lunar Elf", subspecies: "elf", gifted: { set: ["Speed", "Portrayal", "Appeal"] } },
    twilightElf: { name: "Twilight Elf", subspecies: "elf", gifted: { set: ["Speed", "Portrayal", "Language"] } },
    
    cambion: { name: "Cambion", constitution: 4, endurance: 6, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], languages: { set: ["utopian", "primordial"] } },
    angelicCambion: { name: "Angelic Cambion", subspecies: "cambion", gifted: { set: ["Power", "Appeal", "Stunt"] } },
    demonicCambion: { name: "Demonic Cambion", subspecies: "cambion", gifted: { set: ["Power", "Appeal", "Portrayal"] } },
    eldritchCambion: { name: "Eldritch Cambion", subspecies: "cambion", gifted: { set: ["Power", "Appeal", "Memory"] } },
    
    //goliath: { name: "Goliath", constitution: ???, endurance: ???, effervescence: ???, blockRating: [???, 4], dodgeRating: [??? 12], gifted: { set: ["???", "???", "???"] }, languages: { set: ["Utopian", "??>"] } },
  };
  talents = {
    // human tree
    adaptableDefense: { name: "Adaptable Defense", after: null, requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [{ type: Constants.MODIFY_CORE, id: Constants.CHILL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.ENERGY_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.HEAT_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PHYSICAL_DEF, amount: 1, op: Constants.ADD }, { type: Constants.MODIFY_CORE, id: Constants.PSYCHE_DEF, amount: 1, op: Constants.ADD }] },
    quickFooting: { name: "Quick Footing", after: "adaptableDefense", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 0 }, description: "Your Dodge Rating increases by 1d12.", actions: [{ type: Constants.MODIFY_DODGE_RATING, amount: 1, die: false, op: Constants.ADD }] },
    strongDefenseHuman: { name: "Strong Defense", after: "quickFooting", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Your Block Rating increases by 1d4.", actions: [{ type: Constants.MODIFY_BLOCK_RATING, amount: 1, die: false, op: Constants.ADD }] },
    physicalCombatHuman: { name: "Physical Combat", after: "strongDefenseHuman", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 0 }, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an additional 2d8 physical damage.", actions: [] }, // combat is handled by GM (too complex, would be limiting to make it defined)
    inventiveHuman: { name: "Inventive", after: null, requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 0 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "When crafting an item other than a component, you require 1 less material component of your choice, minimum of 1.", actions: [{ type: Constants.CRAFTING }] },
    creativeHuman: { name: "Creative", after: "inventiveHuman", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 0 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Spells you cast cost 1 less stamina, minimum cost of 1.", actions: [] },
    prodigy: { name: "Prodigy", after: "creativeHuman", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 0 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Choose a subtrait. You become gifted in it.", actions: [] },
    expertise: { name: "Expertise", after: "prodigy", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.FLAT, amount: 0 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 2 }, description: "Whenever you make a test using a subtrait that you are gifted in, you may spend 5 stamina to gain a point of favor. You may only gain a point of favor this way once per test.", actions: [] },
    // the only thing primaryTree does is make the traits render differently (bc they're ✨special✨)
    flexible: { primaryTree: true, name: "Flexible", after: null, requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the first-tier talent of any subspecies talent tree. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.SUBSPECIES_TALENT, tree: null }] },
    versatile: { primaryTree: true, name: "Versatile", after: "flexible", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the second-tier talent chosen with the <b>Flexible</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "flexible" }] },
    malleable: { primaryTree: true, name: "Malleable", after: "versatile", requirements: [{ type: Constants.SPECIES, condition: ["human"] }], body: { type: Constants.DEPENDANT, amount: 0 }, mind: { type: Constants.DEPENDANT, amount: 0 }, soul: { type: Constants.DEPENDANT, amount: 1 }, description: "You gain the third-tier talent correlated to the talent chosen with the <b>Versatile</b> talent. The cost of this talent is equal to the cost of the chosen talent plus 1 Soul Point.", actions: [{ type: Constants.CONTINUE_SUBSPECIES_TALENT, prev: "versatile" }] },

    // automaton tree
    weakAbsorption: { name: "Weak Absorption", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 0 }, description: "You may spend 1 turn action and consume a Common or rarer Power Component to regain 3 stamina.", actions: [] },
    activeAbsorption: { name: "Active Absorption", after: "weakAbsorption", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 1 }, description: "You may spend 1 turn action and consume an Extraordinary or rarer Power Component to regain 6 stamina.", actions: [] },
    strongAbsorption: { name: "Strong Absorption", after: "activeAbsorption", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 1 }, description: "You may spend 1 turn action and consume an Rare or rarer Power Component to regain 12 stamina.", actions: [] },
    absoluteAbsorption: { name: "Absolute Absorption", after: "strongAbsorption", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 2 }, description: "You may spend 1 turn action and consume a Legendary or rarer Power Component to regain 24 stamina.", actions: [] },
    thermalBarrierAutomaton: { name: "Thermal Barrier", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Your Heat and Chill defenses each increase by 2.", actions: [] },
    selfRepair: { name: "Self Repair", after: "thermalBarrierAutomaton", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "You may spend 6 turn actions to make an Engineering test. If the test succeeds the amount of DHP you're missing, you regain 2d4 DHP, otherwise you are dealt 3 damage. Dealt this way ignores defenses.", actions: [] },
    mechanicalMedic: { name: "Mechanical Medic", after: "selfRepair", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "When you use the <b>Self Repair</b> talent, you may consume a Common or rarer material component to gain a point of favor on the Engineering test.", actions: [] },
    thorough: { name: "Thorough", after: "mechanicalMedic", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "When you succeed on the Engineering test using the <b>Self Repair</b> talent, you regain 2d8 DHP instead.", actions: [] },
    kineticBufferAutomaton: { primaryTree: true, name: "Kinetic Buffer", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Your Energy defense increases by 4.", actions: [] },
    conductiveAutomaton: { primaryTree: true, name: "Conductive", after: "kineticBuffer", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Whenever you take any amount of Energy damage, you regain that much stamina.", actions: [] },
    mechanized: { primaryTree: true, name: "Mechanized", after: "conductiveAutomaton", requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "When you are the target of an attack, you may spend 1 interrupt action and up to 7 stamina to increase one of your defenses by the amount of stamina spent for the rest of the action.", actions: [] },
    
    // dwarf tree
    thickSkin: { name: "Thick Skin", after: null, requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 2 }, mind: { type: Constants.FLAT, amount: 0 }, soul: { type: Constants.FLAT, amount: 0 }, description: "Your Physical defense increases by 4.", actions: [] },
    strongDefenseDwarf: { name: "Strong Defense", after: "thickSkin", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Your Block Rating increases by 1d4.", actions: [] },
    physicalCombatDwarf: { name: "Physical Combat", after: "strongDefenseDwarf", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "When you make an attack, you may spend an additional turn action up to 3 times to deal an addition 2d8 Physical damag.", actions: [] },
    kineticBufferDwarf: { name: "Kinetic Buffer", after: "physicalCombatDwarf", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    oreScent: { name: "Ore Scent", after: null, requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    stubborn: { name: "Stubborn", after: "oreScent", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    ironWill: { name: "Iron Will", after: "stubborn", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    proud: { name: "Proud", after: "ironWill", requirements: [{ type: Constants.SPECIES, condition: "dwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    
    // copper dwarf tree
    inventiveCopperDwarf: { primaryTree: true, name: "Inventive", after: null, requirements: [{ type: Constants.SPECIES, condition: "copperDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    ingenious: { primaryTree: true, name: "Ingenious", after: "inventiveCopperDwarf", requirements: [{ type: Constants.SPECIES, condition: "copperDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    brilliant: { primaryTree: true, name: "Brilliant", after: "ingenious", requirements: [{ type: Constants.SPECIES, condition: "copperDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    
    // iron dwarf tree
    creativeIronDwarf: { primaryTree: true, name: "Creative", after: null, requirements: [{ type: Constants.SPECIES, condition: "ironDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    mageMentality: { primaryTree: true, name: "Mage Mentality", after: "creativeIronDwarf", requirements: [{ type: Constants.SPECIES, condition: "ironDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    runicBuffer: { primaryTree: true, name: "Runic Buffer", after: "mageMentality", requirements: [{ type: Constants.SPECIES, condition: "ironDwarf" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    
    // cyborg tree
    quickenedAugment: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    internalSlots: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    augmentPrep: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    steelStrikes: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    thermalBarrierCyborg: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    strongDefenseCyborg: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    kineticBufferCyborg: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    activatedCombat: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    conductiveCyborg: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "cyborg" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
    adaptableDefense: { name: "", after: null, requirements: [{ type: Constants.SPECIES, condition: "automaton" }], body: { type: Constants.FLAT, amount: 1 }, mind: { type: Constants.FLAT, amount: 1 }, soul: { type: Constants.FLAT, amount: 1 }, description: "Each of your defenses increase by 1.", actions: [] },
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
  alfuwuPatch = false;
  constructor(name, channelId, password = "") {
    this.name = name;
    this.channelId = channelId;
    this.password = password;
  }
  updateSpecies(...newSpecies) {
    const data = Object.assign({}, this.species);
    for (const specie of data)
      if (!newSpecies.includes(specie))
        delete data[specie];
    let s = JSON.stringify({ event: "species", data }, (key, value) => value);
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  updateTalents(...newTalents) {
    const data = Object.assign({}, this.talents);
    for (const talent of data)
      if (!newTalents.includes(talent))
        delete data[talent];
    let s = JSON.stringify({ event: "talents", data }, (key, value) => value);
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  updateUsers(...include) {
    this.gm = Math.max(0, this.gm % this.users.size);
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
    for (const user of this.users)
      clients[ids[user]].send(s);
  }
  isGM(id) {
    let i = 0;
    for (let user of this.users)
      if (i++ === this.gm)
        return user == id;
  }
  getGM() {
    let i = 0;
    for (let user of this.users)
      if (i++ === this.gm)
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
    if ([...this.users].indexOf(id) < this.gm)
      this.gm--;
    this.users.delete(id);
    if (this.users.size == 1) {
      this.state = Constants.LOBBY;
      for (const user in this.userData)
        Object.assign(this.userData[user], { ready: false });
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
  createDefaultData(avatar, name) {
    const defaultSpecie = Object.keys(this.species)[0];
    return {
      playerName: name,
      species: defaultSpecie,
      level: this.startingLevel,
      xp: 0,
      body: 0,
      mind: 0,
      soul: 0,
      /** @type {number} */
      constitution: this.species[defaultSpecie].constitution,
      /** @type {number} */
      endurance: this.species[defaultSpecie].endurance,
      /** @type {number} */
      effervescence: this.species[defaultSpecie].effervescence,
      /** @type {[number, number]} */
      blockRating: this.species[defaultSpecie].blockRating,
      /** @type {[number, number]} */
      dodgeRating: this.species[defaultSpecie].dodgeRating,
      blockBonus: 0,
      dodgeBonus: 0,
      /** @type {Set.<string>} */
      gifted: new JSet(this.species[defaultSpecie].languages.set ?? this.species[defaultSpecie].gifted.set),
      /** @type {number} */
      availableGifteds: this.species[defaultSpecie].gifted.any || 0,
      /** @type {StatModifier} */
      landTravelMod: new StatModifier(),
      /** @type {StatModifier} */
      waterTravelMod: new StatModifier(),
      /** @type {StatModifier} */
      airTravelMod: new StatModifier(),
      dhpMod: new StatModifier(),
      /** @type {StatModifier} */
      shpMod: new StatModifier(),
      /** @type {StatModifier} */
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
        if (!(msg.data.channelId in games))
          games[msg.data.channelId] = new Game(msg.data.gameName || "Unnamed", msg.data.channelId);
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
                game.userData[user].talents;
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