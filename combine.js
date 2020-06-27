import C from './core.js';

const {TYPES, getType, cast} = C.types;
const {tryToStringify, debug} = C.utils;

const combine = (target, msg, rules=getRules()) => {
  const {NUL,FUN,ARR,ANY} = TYPES;
  let ttarget = getType(target);
  let tmsg = getType(msg);

  // In some cases we erase type (set to "ANY")
  // This saves us from repetative rule writing
  if (ttarget === NUL){
    tmsg = ANY;
  } else if (tmsg !== NUL) {
    // Functions just invoke, so erase the counter type
    if      (tmsg    === FUN) ttarget = ANY;
    else if (ttarget === FUN) tmsg = ANY;
    // Arrays push, so erase the message type
    else if (ttarget === ARR && tmsg !== ARR) tmsg = ANY;
  }

  // Lookup the rule, throw if you can't find it.
  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) {
    throw `rule not found. rule[${ruleKey}] target[${tryToStringify(target)}] msg[${tryToStringify(msg)}]`;
  }

  // Invoke the rule and return
  // debug('combine()=>', 'rule:', ruleKey, 'target:', target, 'msg:', msg );
  const result = rule(target, msg);
  debug(`result[${tryToStringify(result)}] rule[${ruleKey}] target[${tryToStringify(target)}] msg[${tryToStringify(msg)}]` );
  return result;
}

const getRules = () => {
  //Rules for combining things. The first arg is the target, second the message
  //We proceed from the "natural" types to the synthetic types introduced by Simpatico.
  /* Docs Comments on the basic rules:
   Null means "clear". For booleans, it means "toggle".
   We cannot push null to an array because that will clear the array.
   Arrays immutable concat (this is one way to get a null in there!)
 */
  const {UNDEF,NUL,STR,NUM,BOOL,FUN,OBJ,ARR,ELT,ANY,CORE,HANDLER,MSG} = TYPES;
  const rules = {};
  rules[NUL+ANY]  = (_,b) => b;

  rules[STR+STR]  = (_,b) => b;
  rules[STR+NUL]  = ()    => '';

  rules[NUM+NUM]  = (a,b) => a + b;
  rules[NUM+STR]  = (_,b) => cast(NUM, b);
  rules[NUM+NUL]  = ()    => 0;

  rules[BOOL+BOOL]= (a,b) => b;
  rules[BOOL+STR] = (_,b) => cast(BOOL, b);
  rules[BOOL+NUL] = (a,_) => !a;

  rules[ARR+ARR]  = (a,b) => a.concat(b);
  rules[ARR+ANY]  = (a,b) => [...a,b];
  rules[ARR+NUL]  = ()    => [];

  rules[FUN+ANY]  = (a,b) => a(b);
  rules[ANY+FUN]  = (a,b) => b(a);

  rules[OBJ+OBJ]  = (a,b) => {
    // B is defensively copied, mutated and returned, not A!
    b = Object.assign({},b);
    for (let prop in a){
      b[prop] = b.hasOwnProperty(prop) ?
        combine(a[prop],b[prop]): //recurse
        a[prop];
    }
    return b;
  };

  //Gotcha: handler invocation does some limited mutation!
  //mutation: core.msgs will get a push,
  //mutation: msg will get an id, time and children
  //mutation: all results will get the id of the parent
  rules[OBJ+MSG] = (core, msg) => {
    const {UNDEF, ARR, OBJ} = C.preds;

    // World event - defensively copy because we mutate
    if (UNDEF(msg.parent)) msg = Object.assign({}, msg);

    msg.id = core.msgs.length;
    // msg.time = now(); // this makes the display quite chatty
    core.msgs.push(msg);

    //Find the named handler
    const handler = core.handlers[msg.handler];
    if (!handler) throw `handler not found for call ${JSON.stringify(msg)}`;

    // Invoke the handler.
    // Results should always be an array, so help sloppy handlers
    let results = handler[HANDLER](core, msg);
    if (UNDEF(results)) results = [];
    if (!ARR(results))  results = [results];

    // Build up some more info about the message cascade.
    msg.children = results;

    //Recurse for each result
    for (const result of results){
      // Store the id of the parent to avoid cycles that stop stringification
      if (OBJ(result)) result.parent = msg.id;
      core = combine(core, result); //recurse
    }
    return core;
  };

  //handler registration
  rules[OBJ+HANDLER] = (core, handler) => {
    core = combine(core, {handlers:{}, msgs:[]});
    core.handlers[handler.name] = handler;
    return core;
  };
  return rules;
};

// Convenience functions that wrap combine
const combineAll = (arr, core={}) => arr.reduce(combine, core)
const combineAllArgs = (...args) => combineAll(Array.from(args))

export {combine, combineAll, combineAllArgs}
