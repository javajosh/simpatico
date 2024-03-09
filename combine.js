const tryToStringify = obj => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (value !== null && typeof value === 'object') {
      if (seen.has(value)) return '<Circular>';
      seen.add(value);
    }
    return value;
  });
};

const DELETE = Symbol.for('DeleteProperty');

const isObj =     a => typeof a === 'object' && !Array.isArray(a);
const isCore =    a => typeof a === 'object' && typeof a['handlers'] === 'object';
const isHandler = a => typeof a === 'object' && typeof a['handle'  ] === 'function';
const isMsg =     a => typeof a === 'object' && typeof a['handler' ] === 'string';
const isDelete =  a =>  a === DELETE;

class HandlerError extends Error {
  constructor(handlerResult) {
    super('handler error: ' + JSON.stringify(handlerResult));
    this.customData = handlerResult;
  }
}


/**
 * Combines two values, a and b, based on their types and properties.
 * Combine is a pure function.
 * By convention b "acts on" a.
 * When b is null, a is "zeroed out" according to a's type:
 * 1. When a is null or undefined, b is returned.
 * 2. When a and b are objects, this acts like a structural Object.assign().
 * 3. When a and b are arrays, they are concatenated.
 * 4. When a is a "core" (an object with "handlers") and b is a "msg" (an object with a string "handle" property), the handler is invoked.
 * (Handlers are objects with a "handle" function that returns an array of object results, which are recursively combined.)
 *
 * Note: we can't zero out a boolean without introducing null, so we toggle it instead.
 * Note: Combine is not associative (results are order-dependent), but it does have an identity and a zero.
 *
 * @param {any} a - The first value to be combined.
 * @param {any} b - The second value to be combined.
 * @param rules - optionally add some rules; return undefined to allow pass through
 * @param addMsgsToResidue - add a msgs array to residue tracking the message cascade. default to false
 * @returns {any} The result of combining the two values.
 */
function combine(a, b, rules = () => {}, addMsgsToResidue=false ) {
  const ta = typeof a;
  const tb = typeof b;
  let error;

  if (ta === 'undefined' || a === null) return b; // 'something is better than nothing'
  if (tb === 'undefined') return a;               // do nothing if b is undefined; see object combination where undefined property is 'delete'
  if (b === null) {                               // 'use null as a signal to set a type-dependent zero
    if (Array.isArray(a)) return [];
    if (ta === 'object')  return {};
    if (ta === 'number')  return  0;
    if (ta === 'string')  return '';
    if (ta === 'boolean') return !a;
    if (ta === 'function') return () => {};
  }

  // If both args are arrays, concat
  if (Array.isArray(a) && Array.isArray(b)) {
    return [...a, ...b];
  }

  // if the target is an array,  push the msg onto the array
  if (Array.isArray(a) && !Array.isArray(b)) {
    return [...a, b];
  }

  if (isCore(a) && isMsg(b)){
    if (!isHandler(a.handlers[b.handler])) {
      throw new Error(`Unable to find valid handler ${b.handler} in core ${tryToStringify(a)}`);
    }
    // invoke the handler
    let result = a.handlers[b.handler].handle(a, b);

    // non-array results treated as an error
    if (!Array.isArray(result)) {
      throw new HandlerError(result);
    }

    // Add a msgs field to track the message cascade - will create the msgs property if it doesn't exist
    if (addMsgsToResidue && result.some(obj => obj && obj.hasOwnProperty('handler'))){
      a.msgs = a.msgs ? [...a.msgs, ...result] : [b, ...result];
    }

    // recursively combine results back with a
    result.every(obj => a = combine(a, obj, rules));
    return a;
  }

  if (isObj(a) && isObj(b)) {
    // ordinary object combination - behave like a recursive Object.assign()
    const result = {...b};
    for (const key of Object.keys(a)) {
      result[key] = a[key];
      if (key in b) {
        if (isDelete(b[key])) {
          delete result[key];
        } else {
          result[key] = combine(a[key], b[key], rules);
        }
      }
    }
    return result;
  }

  // allow override of scalar rules
  if (rules && typeof rules === 'function'){
    const result = rules(a,b);
    if (typeof result !== 'undefined'){
      return result;
    }
  }

  // scalar combination - usually just replace
  if (ta === 'string'   && tb === 'string'  ) return b;
  if (ta === 'boolean'  && tb === 'boolean' ) return b;
  if (ta === 'function' && tb === 'function') return b;
  if (ta === 'number'   && tb === 'number'  ) return a + b;

  error = new Error(`unable to combine ${tryToStringify(a)} and ${tryToStringify(b)} types ${ta} ${tb}`);
  throw error;
}

const combineReducer = (a, b) => combine(a,b);

// This is a convenience function that makes calling combine a bit easier
function combineAll(...args) {
  if (args.length === 1 && Array.isArray(args[0])) {
    return args[0].reduce(combineReducer, {});
  } else if (args.length === 2 && Array.isArray(args[0]) && typeof args[1] === 'function') {
    return args[0].reduce((a,b) => combine(a,b, args[1]), {});
  } else if (args.length === 2 ) {
    return combine(args[0], args[1]);
  }else {
    return args.reduce((a,b) => combine(a,b), {});
  }
}

// wrap these functions for easier addition to core. TODO add support for bare function handlers in combine()
const h = (fn, optionalName) => {
  const result = {handlers:{}};
  const name = optionalName ? optionalName : fn.name;
  result.handlers[name] = {handle: fn};
  return result;
}

export {
  combineAll as combine,
  combineReducer,
  combine as combineRules,
  HandlerError,
  DELETE,
  h,
}
