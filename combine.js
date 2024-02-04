import {assert, cast, debug, getType, hasProp, is, now, tryToStringify, TYPES} from './core.js';
// import {gather, scatter} from "./svg.js";

const DEBUG = false;

const combine = (target, msg, rules = getRules()) => {
  const {NUL, FUN, ARR, ANY, UNDEF} = TYPES;
  let ttarget = getType(target);
  let tmsg = getType(msg);

  // In some cases we erase type (set to "ANY")
  // This saves us from repetitive rule writing
  if (ttarget === NUL) {
    tmsg = ANY;
  } else if (tmsg === UNDEF) {
    return target;
  } else if (tmsg !== NUL) {
    // invoke the target function unless the message is a function, which replaces
    if (ttarget === FUN && tmsg !== FUN) tmsg = ANY;
    // Arrays push, so erase the message type
    if (ttarget === ARR && tmsg !== ARR) tmsg = ANY;
  }

  // Lookup the rule, throw if you can't find it.
  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) {
    throw `rule not found. rule[${ruleKey}] target[${tryToStringify(target)}] msg[${tryToStringify(msg)}]`;
  }

  // Invoke the rule and return
  // debug('combine()=>', 'rule:', ruleKey, 'target:', target, 'msg:', msg );
  const debugObject = {
    ruleKey: ruleKey,
    target: tryToStringify(target),
    msg: tryToStringify(msg),
  }
  // debug(debugObject);
  const result = rule(target, msg);
  debugObject.result = tryToStringify(result);
  if (DEBUG) debug(debugObject);

  return result;
}

const getRules = () => {
  /**
     Rules for combining things. The first arg is the target, second the message
     proceed from the "natural" types to the synthetic types introduced by Simpatico.

     Null means "clear", except for booleans, where null means "toggle".
     We cannot push null to an array because that will clear the array.
     Arrays immutable concat (this is one way to get a null in there!)
   */
  const {UNDEF, NUL, STR, NUM, BOOL, FUN, OBJ, ARR, ELT, ANY, CORE, HANDLER, MSG} = TYPES;
  const rules = {};
  rules[NUL + ANY] = (_, b) => b;

  rules[STR + STR] = (_, b) => b;
  rules[STR + NUL] = () => '';

  rules[NUM + NUM] = (a, b) => a + b;
  rules[NUM + STR] = (_, b) => cast(NUM, b);
  rules[NUM + NUL] = () => 0;

  rules[BOOL + BOOL] = (a, b) => b;
  rules[BOOL + STR] = (_, b) => cast(BOOL, b);
  rules[BOOL + NUL] = (a, _) => !a;

  rules[ARR + ARR] = (a, b) => a.concat(b);
  rules[ARR + ANY] = (a, b) => [...a, b];
  rules[ARR + NUL] = () => [];

  rules[FUN + NUL] = (a, b) => null;
  rules[FUN + ANY] = (a, b) => a(b);
  rules[ANY + FUN] = (a, b) => b(a);
  rules[FUN + FUN] = (a, b) => b;

  // rules[ELT + OBJ] = (a, b) => scatter(a, b);
  // rules[OBJ + ELT] = (a, b) => gather(a, b);

  rules[OBJ + OBJ] = (a, b) => {
    // B is defensively copied, mutated and returned, not A!
    b = Object.assign({}, b);
    for (const prop in a) {
      b[prop] = b.hasOwnProperty(prop) ?
        combine(a[prop], b[prop]) : //recurse
        a[prop];
    }
    return b;
  };

  //Gotcha: handler invocation does some limited mutation!
  //mutation: core.msgs will get a push,
  //mutation: msg will get an id, time and children
  //mutation: all results will get the id of the parent
  rules[OBJ + MSG] = (core, msg) => {
    // World event - defensively copy because we mutate
    const isWorldEvent = is.undef(msg.parent);
    if (isWorldEvent) {
      msg = {time: now(), ...msg};
      if (!hasProp(core, 'msgs')){
        core.msgs = [];
      }
    }
    msg = {id: core.msgs.length, ...msg};
    core.msgs.push(msg);

    //Find the named handler
    const handler = core.handlers[msg[TYPES.MSG]];
    assert(handler, `handler not found for msg ${tryToStringify(msg)}`);

    // Invoke the handler.
    // Results should always be an array, so help sloppy handlers
    let results = handler[TYPES.HANDLER](core, msg);
    if (!is.arr(results)) results = [results];

    // Build up some more info about the message cascade.
    msg.children = results;

    //Recurse for each result
    for (const result of results) {
      // Store the id of the parent to avoid cycles that stop stringification
      if (is.obj(result)) result.parent = msg.id;
      core = combine(core, result); //recurse, generates the message cascade.
    }
    return core;
  };

  //handler registration
  rules[OBJ + HANDLER] = (core, handler) => {
    core = combine(core, {handlers: {}, msgs: []});
    core.handlers[handler.name] = handler;
    return core;
  };
  return rules;
};

// Convenience functions that wrap combine
// Note that the intuitive reduction (arr.reduce(combine, residue)) doesn't work for some unknown reason.
const combineAll = (arr, residue = {}) => {
  for (let i = 0; i < arr.length; i++) {
    residue = combine(residue, arr[i]);
  }
  return residue;
};

const combineAllArgs = (...args) => combineAll(Array.from(args));

export {combine, combineAll, combineAllArgs}

