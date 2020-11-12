// Utils
const now = a => a ? Date.now() - a : Date.now()
const log = console.log.bind(console)
const debug = console.debug.bind(console)
const info = console.info.bind(console)

// Functional
const and = (a,b) => !!a && !!b
const or = (a,b) => !!a || !!b
const identity = a => a
const curry = (f, a) => b => f(a,b)
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
const deepEquals = equals; //a more common name for the same thing
const tryToStringify = obj => {
  if (typeof obj !== 'object') return obj;
  let result = '<Circular>';
  try{ result = JSON.stringify(obj); } catch (ignored) {}
  return result;
}
const copy1 = a => [...a]
const copy2 = a => a.slice()
const copy = a => JSON.parse(JSON.stringify(a))
const shuffle = arr => {
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
  HANDLER: 'handle', //a handler has a handler function
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
const assertEquals = (actual, expected, msg) => {
  assert(equals(actual, expected),
    `expected ${tryToStringify(expected)} but got ${actual} ${msg ? ' msg:' + msg : ''}`
  )
};
const assertThrows = fn => {
  ASSERT.FUN(fn); let throws = false; let result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned ${result}`);
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
  PREDS.NUM(lo) && PREDS.NUM(hi) &&
  lo <= hi &&
  lo <= size(a) &&
  hi >= size(a);

PREDS.T = a => true
PREDS.F = a => false
// Arrays
PREDS.ALL = arr => ASSERT.ARR(arr) && arr.reduce(and, true)
PREDS.ANY = arr => ASSERT.ARR(arr) && arr.reduce(or, false)
PREDS.SAME = arr => ASSERT.ARR(arr) && arr.reduce((a=a[0],b=a[0])=>a===b?a:false)
PREDS.CONTAINS = (arr, b) => PREDS.ARR(arr) && arr.includes(b)

const ASSERT = mapObject(PREDS,([k,v])=>[k, (a, b, c, d) => assert(PREDS[k](a,b,c), d)]);

// A simple PRNG inside the browser.
// Note that every call increments state exactly once.
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


// export default {
//   utils: {now, log, debug, info, tryToStringify},
//   logic: {and, or, identity},
//   arrays: {all, any, same, peek, push},
//   objects: {hasProp, propType, getProp, mapObject, equals, tryToStringify},
//   asserts: {error, assert, assertEquals, assertThrows, ...ASSERT},
//   preds: {int, between, contains, ...PREDS},
//   types: {TYPES, getType, cast}
// };
