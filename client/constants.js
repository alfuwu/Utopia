// talent cost type ids
export const FLAT = false;
export const DEPENDANT = true;

// tree ids
export const SPECIES = 0;
export const WARFARE = 1;
export const TACTICS = 2;
export const INNOVATION = 3;
export const MAGECRAFT = 4;
export const INFLUENCE = 5;
export const PROWESS = 6;
export const SPECIALIST = 7; // unused

// specialist talent categories
//export const SPECIES = 0; // specialist talents only obtainable by specific species
export const BASIC = 1; // specific, niche, cheap, synergistic
export const SIKLL = 2; // cenetered around a specific subtrait
export const FABRICATION = 3; // innovation core tree specialist talents
export const ARCANE = 4; // magecraft core tree specialist talents
export const ULTIMATE = 5; // specialist talents obtainable after completing a tree

// item types
export const NONE = 0; // anything else
export const WEAPON = 1; // swords, bows, shields, etc
export const EQUIPMENT = 2; // helmets, breastplates, rings, clothing, etc
export const CONSUMABLE = 3; // food, potions, etc
export const GEAR = 4; // rope, lock picks, etc

// operators
export const ADD = 0;
export const SUB = 1;
export const MUL = 2;
export const DIV = 3;
export const ABMUL = 4;
export const ABDIV = 5;
export const SUBTRAIT = 6;

// rounding ids
export const ROUND_UP = true;
export const ROUND_DOWN = false;
export const ROUND_NEAREST = null;