'use strict';

install(window, TYPES);

const combineAll = (state, arr) => arr.reduce(combine, state);

const combine = (target, msg, print=false) => {
  let ttarget = getType(target);
  let tmsg = getType(msg);

  // Rules about function application are too hard to encode as a simple object,
  // So we implement this (limited) functionality here as "virtual rules".
  // Unless null is involved (which often has a special meaning):
  // Virtual rule #1: A function message is applied to the target, and vv.
  // Virtual rule #2: A message to an array that isn't an array gets pushed
  if (tmsg !== NULL && ttarget !== NULL){
    if      (tmsg === FUN && ttarget !== FUN) ttarget = ANY;
    else if (ttarget === FUN && tmsg !== FUN) tmsg    = ANY;
    else if (ttarget === ARR && tmsg !== ARR) tmsg    = ANY;
  }

  const ruleKey = ttarget + tmsg;
  const rule = rules[ruleKey];
  if (!rule) throw `rule not found for ruleKey ${ruleKey} target ${JSON.stringify(target)} and msg ${JSON.stringify(msg)}`;
  if (print) log(`combining target ${JSON.stringify(target)} and msg ${JSON.stringify(msg)} with ruleKey ${ruleKey}` );
  const result = rule(target, msg);
  return result;
}

//Rules for combining things. The first arg is the target
//We proceed from the "natural" types to the synthetic types introduced by Simpatico.
const rules = {};
rules[STR+STR] = (_,b) => b;
rules[STR+NULL] = () => '';

rules[NUM+NUM]  = (a, b) => a+b;
rules[NUM+STR]  = (_, b) => cast(TYPES.NUM, b);
rules[NUM+NULL] = ()     => 0;

rules[BOOL+BOOL] = (a,b) => b;
rules[BOOL+STR]  = (_,b) => cast(TYPES.BOOL, b);
rules[BOOL+NULL] = (a,_) => !a;

rules[ARR+ARR]  = (a,b) => a.concat(b);
rules[ARR+ANY]  = (a,b) => {a.push(b); return a;};
rules[ARR+NULL] = ()    => [];


rules[FUN+ANY]  = (fn, b) => fn(b);
rules[ANY+FUN]  = (a, fn) => fn(a);

rules[NULL+FUN] = (_,fn)  => fn;



rules[OBJ+OBJ] = (a,b) => {
  b = Object.assign({},b);
  for (let prop in a){
    b[prop] = b.hasOwnProperty(prop) ?
      combine(a[prop],b[prop]): //recurse
      a[prop]; 
  }
  return b;
};

rules[OBJ+MSG] = (core, msg) => { //handler invocation
  let handler = core.handlers[msg.msg];
  if (!handler) throw `handler not found for call ${JSON.stringify(msg)}`;

  let results = handler[HANDLER](core, msg);
  if (predicates.undef(results)) results = [];
  if (!predicates.arr(results)) results = [results];

  for (const result of results) 
    core = combine(core, result); //recurse

  return core;
};
rules[OBJ+HANDLER] = (core, handler) => { //handler registration
  core = combine(core, {handlers:{}});
  core.handlers[handler.name] = handler;
  return core;
};
