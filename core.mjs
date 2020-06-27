// Utils
const now = a => a ? Date.now() - a : Date.now()
const log = console.log.bind(console)
const debug = console.debug.bind(console)
const info = console.info.bind(console)

// Functional
const and = (a,b) => !!a && !!b
const or = (a,b) => !!a || !!b
const identity = a => a

// Arrays and lists
const all = arr => arr.reduce(and, true)
const any = arr => arr.reduce(or, false)
const same = arr => arr.reduce(equals, arr[0])
const peek = arr => arr.length ? arr[arr.length - 1] : null
const push = (arr, a) => {arr.push(a); return arr} //mutating

// Objects
const hasProp = (a, prop) => a.hasOwnProperty(prop)
const propType = (a, prop) => getType(a[prop])
const getProp = (a, prop) => hasProp(a, prop) ? a[prop] : null;
const mapObject = (a,fn) => Object.fromEntries(Object.entries(a).map(fn))
const equals = (a,b) => typeof a === 'object' ? tryToStringify(a) === tryToStringify(b) : a === b;
const tryToStringify = obj => {
  if (typeof obj !== 'object') return obj;
  let result = '<Circular>';
  try{ result = JSON.stringify(obj); } catch (ignored) {}
  return result;
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
  HANDLER: 'handle', //a hander has a handle function
  MSG: 'handler', //a message points to a handler
};

const getType = (a) => {
  const {UNDEF,NUL,STR,FUN,OBJ,ARR,ELT,CORE,HANDLER,MSG} = TYPES;

  let t = typeof a;
  if (t !== OBJ)  return t;

  if (a === null) return NUL;
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
const assertEquals = (actual, expected, msg) => {
  assert(equals(actual, expected),
    `got [${tryToStringify(actual)}] expected [${tryToStringify(expected)}]${msg ? ' msg:' + msg : ''}`
  )
};
const assertThrows = fn => {
  ASSERT.FUN(fn); let throws = false; let result;
  try { result = fn() } catch (e) { throws = true }
  assert(throws, `Expected fn to throw, but it didn't and returned ${result}`);
};

// PREDS looks something like {NUL: a => getType(a) === NUL, STR: a => getType(a) === STR}
// ASSERT wraps with an assertion  {NUL: (a, msg) => assert(getType(a) === NUL, msg), STR: (a,msg) => assert(getType(a) === STR, msg)}
const PREDS = mapObject(TYPES,([k,v])=>[k, a => getType(a) === v])
const ASSERT = mapObject(TYPES,([k,v])=>[k, (a, msg) => assert(getType(a) === v, msg)]);

const int = a => typeof a === 'number' && Math.floor(a) === a
const between = (lo, hi, a) => {
  ASSERT.NUM(lo) && ASSERT.NUM(hi) && assert(lo <= hi);
  if (PREDS.STR(a) || PREDS.ARR(a)) a = a.length;
  return (PREDS.NUM(a)) ? lo <= a && a <= hi : false;
}
const contains  = (a,b) => PREDS.ARR(a) && a.includes(b);


export default {
  utils: {now, log, debug, info, tryToStringify},
  logic: {and, or, identity},
  arrays: {all, any, same, peek, push},
  objects: {hasProp, propType, getProp, mapObject, equals, tryToStringify},
  asserts: {error, assert, assertEquals, assertThrows, ...ASSERT},
  preds: {int, between, contains, ...PREDS},
  types: {TYPES, getType, cast}

};
