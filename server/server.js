import express from "express";
import expressWs from "express-ws";
import dotenv from "dotenv";
import fetch from "node-fetch";
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

const SETTING_UP = 0;
const LOBBY = 1;

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
    copperDwarf: { name: "Copper Dwarf", constitution: 4, endurance: 6, effervescence: 3, blockRating: [3, 4], dodgeRating: [1, 12], gifted: { set: ["Memory", "Resolve", "Engineering"] }, languages: { set: ["Utopian", "Dwarvish"] } },
    ironDwarf: { name: "Iron Dwarf", constitution: 4, endurance: 6, effervescence: 3, blockRating: [3, 4], dodgeRating: [1, 12], gifted: { set: ["Memory", "Resolve", "Awareness"] }, languages: { set: ["Utopian", "Dwarvish"] } },
    biotechCyborg: { name: "Biotech Cyborg", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Engineering", "Memory", "Awareness"] }, languages: { simple: 1, set: ["Utopian"] } },
    cyberneticCyborg: { name: "Cybernetic Cyborg", constitution: 4, endurance: 5, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Engineering", "Memory", "Power"] }, languages: { simple: 1, set: ["Utopian"] } },
    regalOxtus: { name: "Regal Oxtus", constitution: 4, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Memory", "Portrayal", "Appeal"] }, languages: { set: ["Utopian", "Oxtan"] } },
    brazenOxtus: { name: "Brazen Oxtus", constitution: 4, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Memory", "Portrayal", "Power"] }, languages: { set: ["Utopian", "Oxtan"] } },
    astuteOxtus: { name: "Astute Oxtus", constitution: 4, endurance: 4, effervescence: 3, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Memory", "Portrayal", "Engineering"] }, languages: { set: ["Utopian", "Oxtan"] } },
    solarElf: { name: "Solar Elf", constitution: 3, endurance: 7, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Speed", "Portrayal", "Stunt"] }, languages: { set: ["Utopian", "Elvish"] } },
    lunarElf: { name: "Lunar Elf", constitution: 3, endurance: 7, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Speed", "Portrayal", "Appeal"] }, languages: { set: ["Utopian", "Elvish"] } },
    angelicCambion: { name: "Angelic Cambion", constitution: 4, endurance: 6, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Power", "Appeal", "Stunt"] }, languages: { set: ["Utopian", "Primordial"] } },
    demonicCambion: { name: "Demonic Cambion", constitution: 4, endurance: 6, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Power", "Appeal", "Portrayal"] }, languages: { set: ["Utopian", "Primordial"] } },
    eldritchCambion: { name: "Eldritch Cambion", constitution: 4, endurance: 6, effervescence: 2, blockRating: [2, 4], dodgeRating: [2, 12], gifted: { set: ["Power", "Appeal", "Memory"] }, languages: { set: ["Utopian", "Primordial"] } },
  };
  startingLevel = 10;
  creatures = {};
  languages = {};
  alfuwuPatch = false;
  constructor(name, channelId, password = "") {
    this.name = name;
    this.channelId = channelId;
    this.password = password;
  }
  updateUsers() {
    this.gm = Math.max(0, this.gm % this.users.size);
    const data = Object.assign({}, this);
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
    this.updateUsers();
  }
  removeUser(id) {
    if ([...this.gm].indexOf(id) < this.gm)
      this.gm--;
    this.users.delete(id);
    if (this.users.size == 1) {
      this.state = LOBBY;
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
        switch (msg.event) {
          case "userData":
            ws.data = msg.data;
            ids[msg.data.userId] = uuid;
            if (!(msg.data.channelId in games))
              games[msg.data.channelId] = new Game(msg.data.gameName, msg.data.channelId);
            const game = games[msg.data.channelId];
            game.addUser(msg.data.userId, msg.data.avatar, msg.data.name);
            return;
          case "ready":
            games[ws.data.channelId].readyUser(ws.data.userId, msg.data);
            return;
          case "reqUserData": {
            ws.send(JSON.stringify({ event: "resUserData", data: clients[ids[msg.data]].data }));
            return;
          }
          case "addSpecies": {

          }
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