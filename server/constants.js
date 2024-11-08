// game states
/** state */ export const SETTING_UP = 0;
/** state */ export const LOBBY = 1;

// talent condition ids
/** talent condition/tree/specialist talent category */ export const SPECIES = 0; // requires player to be of defined species before they may unlock this talent
/** talent condition */ export const TALENT = 1; // requires player to have defined talent before they may unlock this talent
/** talent condition */ export const AT_LEAST_FROM_TREE = 2; // requires player to have defined amount from the defined tree, or at least 1 from the defined tree if amount is undefined
/** talent condition */ export const ALL_FROM_TREE = 3; // requires player to have every talent in the defined tree
/** talent condition */ export const AT_LEAST_ANY_OF = 4; // requires player to have defined amount from the defined list of talents, or at least 1 from the defined list of talents if amount is undefined
/** talent condition */ export const SUBTRAIT_SCORE = 5; // requires player to have a subtrait score of the defined value or higher before they may unlock this talent
/** talent condition */ export const TRAIT_SCORE = 6; // same as above but with traits instead
/** talent condition */ export const OR = 7; // any of the conditions defined must be true 
/** talent condition */ export const EXCLUSIVE_OR = 8; // only one condition defined must be true
/** talent condition */ export const NOT = 9; // condition must be false

// talent cost type ids
/** talent cost */ export const FLAT = false;
/** makes the talent cost depend on the actions the talent performs
 * 
 * e.g. the SUBSPECIES_TALENT action will make the talent's cost equal to the talent picked, plus `amount`
*/
export const DEPENDANT = true;

// action ids (used for talents/species)
/** action */ export const MODIFY_SUBTRAIT = 0;
/** action */ export const MODIFY_META = 1; // meta stats
/** action */ export const MODIFY_CORE = 2; // core stats (body, mind, soul, defenses, travel modifiers)
/** action */ export const MODIFY_SCORE = 3;
/** action */ export const MODIFY_BLOCK_RATING = 4;
/** action */ export const MODIFY_DODGE_RATING = 5;
/** action */ export const SUBSPECIES_TALENT = 6;
/** action */ export const CONTINUE_SUBSPECIES_TALENT = 7;
/** action */ export const CRAFTING = 8; // dont know about this one should work
/** action */ export const RESET_TALENT_BRANCH = 9; // resets an entire talent branch, starting from talent. If talent is not specified, resets current branch
/** action */ export const EITHER = 10; // shows the user two different actions, allowing them to pick one to have apply
/** action */ export const LEARN_TALENT = 11;
/** action */ export const ADD_ACTION = 12; // adds an available action to the player's list of actions (doesn't actually provide any mechanical effect)
/** action */ export const REMOVE_ACTION = 13; // hides an action from the player's list of actions (doesn't actually delete it)

// action costs (used in species creation, in qp, where undefined means it won't show, and null means its dependant on values set)
export const ACTION_COSTS = [3, 1, 3, 0.5, 1, 1, 4, undefined, 2, undefined, null, null, 1, -0.5];

// subtrait ids
/** subtrait */ export const SPEED = 0; // agility
/** subtrait */ export const DEXTERITY = 1;
/** subtrait */ export const POWER = 2; // strength
/** subtrait */ export const FORTITUDE = 3;
/** subtrait */ export const ENGINEERING = 4; // intellect
/** subtrait */ export const MEMORY = 5;
/** subtrait */ export const RESOLVE = 6; // will
/** subtrait */ export const AWARENESS = 7;
/** subtrait */ export const PORTRAYAL = 8; // display
/** subtrait */ export const STUNT = 9;
/** subtrait */ export const APPEAL = 10; // charm
/** subtrait */ export const LANGUAGE = 11;

// trait ids
/** trait */ export const AGILITY = 0;
/** trait */ export const STRENGTH = 1;
/** trait */ export const INTELLECT = 2;
/** trait */ export const WILL = 3;
/** trait */ export const DISPLAY = 4;
/** trait */ export const CHARM = 5;

// meta stat ids
/** meta */ export const SIMPLE_LANGUAGE = 0; // allows the player to pick a simple language to learn
/** meta */ export const COMPLEX_LANGUAGE = 1; // allows the player to pick a complex language to learn
/** meta */ export const EITHER_LANGUAGE = 2; // allows the player to pick a complex/simple language to learn
/** meta */ export const SET_LANGUAGE = 3; // makes the player learn a language
/** meta */ export const ANY_GIFTED = 4; // allows player to pick any new gifted subtrait
/** meta */ export const SET_GIFTED = 5; // makes the player gifted in a specific subtrait(s)

// tree ids
///** tree */ export const SPECIES = 0;
/** tree */ export const WARFARE = 1;
/** tree */ export const TACTICS = 2;
/** tree */ export const INNOVATION = 3;
/** tree */ export const MAGECRAFT = 4;
/** tree */ export const INFLUENCE = 5;
/** tree */ export const PROWESS = 6;
/** tree */ export const SPECIALIST = 7; // unused

// specialist talent categories
///** specialist talent category */ export const SPECIES = 0; // specialist talents only obtainable by specific species
/** specialist talent category */ export const BASIC = 1; // specific, niche, cheap, synergistic
/** specialist talent category */ export const SIKLL = 2; // cenetered around a specific subtrait
/** specialist talent category */ export const FABRICATION = 3; // innovation core tree specialist talents
/** specialist talent category */ export const ARCANE = 4; // magecraft core tree specialist talents
/** specialist talent category */ export const ULTIMATE = 5; // specialist talents obtainable after completing a tree

// core stat ids
/** core */ export const BODY = 0;
/** core */ export const MIND = 1;
/** core */ export const SOUL = 2;
// defense
/** core */ export const CHILL_DEF = 3;
/** core */ export const ENERGY_DEF = 4;
/** core */ export const HEAT_DEF = 5;
/** core */ export const PHYSICAL_DEF = 6;
/** core */ export const PSYCHE_DEF = 7;
// travel
/** core */ export const LAND = 8;
/** core */ export const WATER = 9;
/** core */ export const FLIGHT = 10;

// score stat ids things
/** score */ export const CONSTITUTION  = 0;
/** score */ export const ENDURANCE = 1;
/** score */ export const EFFERVESCENCE = 2;
// maxes
/** score */ export const MAX_CONSTITUTION  = 3;
/** score */ export const MAX_ENDURANCE = 4;
/** score */ export const MAX_EFFERVESCENCE = 5;
// mins
/** score */ export const MIN_CONSTITUTION  = 6;
/** score */ export const MIN_ENDURANCE = 7;
/** score */ export const MIN_EFFERVESCENCE = 8;

// item types
/** item type */ export const NONE = 0; // anything else
/** item type */ export const WEAPON = 1; // swords, bows, shields, etc
/** item type */ export const EQUIPMENT = 2; // helmets, breastplates, rings, clothing, etc
/** item type */ export const CONSUMABLE = 3; // food, potions, etc
/** item type */ export const GEAR = 4; // rope, lock picks, etc

// operator ids
/** operator + */ export const ADD = 0;
/** operator - */ export const SUB = 1;
/** operator * */ export const MUL = 2;
/** operator / */ export const DIV = 3;
/** operator abmul */ export const ABMUL = 4;
/** operator abdiv */ export const ABDIV = 5;
/** operator dependant on subtrait */ export const SUBTRAIT = 6;

// rounding ids
/** rounds a value up (used with DIV operator) */ export const ROUND_UP = true;
/** rounds a value down (used with DIV operator) */ export const ROUND_DOWN = false;
/** rounds a value to nearest integer (used with DIV operator) */ export const ROUND_NEAREST = null;