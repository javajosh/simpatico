// Utils
const now = a => a ? Date.now() - a : Date.now()
const log = console.log.bind(console)
const debug = console.debug.bind(console)
const info = console.info.bind(console)

// Functional
const and = (a,b) => !!a && !!b
const or = (a,b) => !!a || !!b
const identity = a => a
const curryLeft = (f, a) => b => f(a,b) //left to right
const curryRight = (f, a) => b => f(b,a) //right to left
const curry = curryLeft
const compose = (f, g) => a => g(f(a))

// Array.prototype.peek = function(){return this.length > 0 ? this[this.length-1] : null}; tempting!
const peek = arr => arr.length ? arr[arr.length - 1] : null
const push = (arr, a) => {arr.push(a); return arr} //mutating

// Objects
const hasProp = (a, prop) => a.hasOwnProperty(prop)
const propType = (a, prop) => getType(a[prop])
const getProp = (a, prop) => hasProp(a, prop) ? a[prop] : null;
const mapObject = (a,fn) => Object.fromEntries(Object.entries(a).map(fn))
const equals = (a,b) => PREDS.OBJ(a) ? tryToStringify(a) === tryToStringify(b) : a === b;
const arrEquals = (a,b) => ASSERT.ARR(a) && ASSERT.ARR(b) && a.length === b.length &&
  a.map((v,i) => v === b[i]).reduce(and, true)
const deepEquals = equals; //a more common name for the same thing
const tryToStringify = a => {
  if (!PREDS.OBJ(a)) return a;
  let result = '<Circular>';
  try{ result = JSON.stringify(a); } catch (ignored) {}
  return result;
}
const copy1 = a => [...a]
const copy2 = a => a.slice()
const copy3 = a => JSON.parse(JSON.stringify(a)) //sadly unstable key order
const copy4 = a => mapObject(a,identity); //shallow copy, but might be extensible.
const copy = copy3; //TODO: find or make a better copy.

const shuffle = arr => {
  ASSERT.ARR(arr);
  let right, left; // Fisher-Yates shuffle using ES6 swap
  for (right = arr.length - 1; right > 0; right--) {
    left = Math.floor(Math.random() * (right + 1));
    [arr[left], arr[right]] = [arr[right], arr[left]];
  }
}

// Types
const TYPES = {
  // These are the 7 basic JS types, excluding void (which I haven't had a use for)
  UNDEF: 'undefined',
  NUL: 'null',
  STR: 'string',
  NUM: 'number',
  BOOL: 'boolean',
  FUN: 'function',
  OBJ: 'object',

  // Useful but synthetic built in types
  ARR: 'array',
  ANY: 'any',
  ELT: 'element', //useful in browsers

  //Simpatico types
  CORE: 'handlers', //a core has handlers
  HANDLER: 'handle', //a handler has a handle function
  MSG: 'msg', //a message has a msg attr
};

const getType = (a) => {
  const {UNDEF,NUL,STR,FUN,OBJ,ARR,ELT,CORE,HANDLER,MSG} = TYPES;

  let t = typeof a;
  if (t !== OBJ)  return t;

  if (a === null) return NUL;
  if (a === undefined) return UNDEF;
  if (Array.isArray(a)) return ARR;
  if (
    typeof window  !== 'undefined' &&
    typeof Element !== 'undefined' &&
    a instanceof Element
  )
    return ELT;

  // Simpatico stuff
  if (propType(a, HANDLER) === FUN) return HANDLER;
  if (propType(a, MSG) === STR) return MSG;
  // if (propType(a, CORE) === OBJ) return CORE;

  return OBJ;
};

const size = (a) => {
  const t = getType(a);
  const {UNDEF,NUL,NUM,STR,FUN,OBJ,ARR,ELT,CORE,HANDLER,MSG} = TYPES;
  switch (t){
    case NUM:
      return a;
    case STR:
      return a.length;
    case ARR:
      return a.length;
    case CORE:
      return a.msgs.length;
    case HANDLER:
    case MSG:
    case OBJ:
      return Object.keys(a).length;
    default:
      return 0;
  }
};

// Cast a string into any other type
const cast = (type, str) => {
  const {STR,NUM,BOOL} = TYPES;
  assert(PREDS.STR(str), `string value required; called with [${getType(str)}]`);

  switch (type) {
    case STR:
      return str;
    case NUM:
      const result = 1 * str;
      if (Number.isNaN(result)) throw new Error(`Cannot convert ${str} into a number`);
      return result;
    case BOOL:
      return (str === 'true');
    default:
      throw `casting to type ${type} not supported`
  }
};

// Assertions and Predicates
const error = a => {throw new Error(a)}
const assert = (a, msg) => a ? true : error(msg)
// NB: it occurs to me it would be better to swap actual and expected for easier left currying of the most static argument.
const assertEquals = (actual, expected, msg='') =>
  assert(equals(actual, expected), `expected ${tryToStringify(expected)} but got [${actual}]. ${msg}`)

const assertThrows = fn => {
  ASSERT.FUN(fn); let throws = false; let result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned [${result}]`);
};

// Valid, but possibly redundant, and therefore confusing.
// const isType = (type, a) => getType(a) === type;
// const assertType = (type, a) => assert(getType(a) === type, `Expected ${a} to be of type ${type} but was of type ${getType(a)}`);

// PREDS looks something like {NUL: a => getType(a) === NUL, STR: a => getType(a) === STR}
// ASSERT wraps with an assertion  {NUL: (a, msg) => assert(getType(a) === NUL, msg), STR: (a,msg) => assert(getType(a) === STR, msg)}
const PREDS = mapObject(TYPES,([k,v])=>[k, a => getType(a) === v])
PREDS.INT = (a, msg) => PREDS.NUM(a,msg) && (a % 1 === 0)
PREDS.EXISTS = a => (typeof a !== 'undefined') && (a !== null)
PREDS.BETWEEN = (lo, hi, a) =>
  size(lo) <= size(hi) &&
  size(lo) <= size(a) &&
  size(hi) >= size(a);

PREDS.T = a => true
PREDS.F = a => false
// Arrays
PREDS.ALL = arr => ASSERT.ARR(arr) && arr.reduce(and, true)
PREDS.ANY = arr => ASSERT.ARR(arr) && arr.reduce(or, false)

// It would be nice if this was expressable as arr.reduce(equals, true), but I couldn't get it to work.
// Also, this code is probably a lot more performant.
PREDS.SAME = arr => {
  ASSERT.ARR(arr);
  let prev = arr[0], curr;
  for(let i = 1; i < arr.length; i++){
    curr = arr[i];
    if (!equals(curr, prev)){
      return false;
    }
  }
  return true;
}
PREDS.CONTAINS = (arr, b) => PREDS.ARR(arr) && arr.includes(b);
PREDS.ARREQUALS = arrEquals;
PREDS.EQUALS = deepEquals;

const ASSERT = mapObject(PREDS,([k,v]) => [k, (a, b, c, d) => assert(PREDS[k](a,b,c), d)]);

// A simple PRNG inside the browser.
// Note that every call increments state exactly once.
//TODO: convert this into a generator function?
function RNG(seed) {
  // A simple seedable RNG based on GCC's constants
  // https://en.wikipedia.org/wiki/Linear_congruential_generator
  this.m = 0x80000000; // 2**31;
  this.a = 1103515245;
  this.c = 12345;
  this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function () {
  this.state = (this.a * this.state + this.c) % this.m;
  return this.state;
}
RNG.prototype.nextFloat = function () {
  // returns in range [0,1]
  return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function (start, end) {
  // returns in range [start, end): including start, excluding end
  // can't modulu nextInt because of weak randomness in lower bits
  const rangeSize = end - start;
  const randomUnder1 = this.nextInt() / this.m;
  return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function (arr) {
  return arr[this.nextRange(0, arr.length)];
}


// This is basically an object.assign that prints out an error if the target doesn't permit setting the key
const install = (target, source) => Object.keys(source).forEach(key => {
  try {
    target[key] = source[key];
  } catch (e) {
    console.error(`Tried to install ${key} but an exception was thrown ${e.message}`);
  }
});

// This file can be included as is, and will put all of the below symbols in the
// global space. Or you can import it through browser modules
export default {
  utils:    {now, log, install, debug, info, tryToStringify, RNG, size},
  logic:    {and, or, identity},
  arrays:   {all:PREDS.ALL, any:PREDS.ANY, same:PREDS.SAME, equals: PREDS.ARREQUALS, peek, push},
  objects:  {hasProp, propType, getProp, mapObject, equals, tryToStringify},
  asserts:  {error, assert, assertEquals, assertThrows, arrEquals: ASSERT.ARREQUALS, between:ASSERT.BETWEEN, ...ASSERT},
  preds:    PREDS,
  types:    {TYPES, getType, cast},
};

