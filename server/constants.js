// game states
export const SETTING_UP = 0;
export const LOBBY = 1;

// talent condition ids
export const SPECIES = 0;

// talent cost type ids
export const FLAT = 0;
export const DEPENDANT = 1;

// action ids (used for talents/species)
export const MODIFY_SUBTRAIT = 0;
export const MODIFY_META = 1; // meta stats
export const MODIFY_CORE = 2; // core stats (body, mind, soul, defenses, travel modifiers)
export const MODIFY_BLOCK_RATING = 3;
export const MODIFY_DODGE_RATING = 4;
export const SUBSPECIES_TALENT = 5;
export const CONTINUE_SUBSPECIES_TALENT = 6;
export const CRAFTING = 7; // dont know about this one should work

// subtrait ids
export const SPEED = 0; // agility
export const DEXTERITY = 1;
export const POWER = 2; // strength
export const FORTITUDE = 3;
export const ENGINEERING = 4; // intellect
export const MEMORY = 5;
export const RESOLVE = 6; // will
export const AWARENESS = 7;
export const PORTRAYAL = 8; // display
export const STUNT = 9;
export const APPEAL = 10; // charm
export const LANGUAGE = 11;

// meta stat ids
export const SIMPLE_LANGUAGE = 0;
export const COMPLEX_LANGUAGE = 1;
export const EITHER_LANGUAGE = 2;
export const SET_LANGUAGE = 3; // makes the player 
export const ANY_GIFTED = 4; // allows player to pick any new gifted subtrait
export const SET_GIFTED = 5; // makes the player gifted in a specific subtrait(s)

// core stat ids
export const BODY = 0;
export const MIND = 1;
export const SOUL = 2;
// defense
export const CHILL_DEF = 3;
export const ENERGY_DEF = 4;
export const HEAT_DEF = 5;
export const PHYSICAL_DEF = 6;
export const PSYCHE_DEF = 7;
// travel
export const LAND = 8;
export const WATER = 9;
export const FLIGHT = 10;

// operator ids
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