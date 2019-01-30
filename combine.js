'use strict';

install(window, TYPES);

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
rules[STR+STR] = (s1,s2) => s2;

rules[NUM+NUM] = (i1,i2) => i1 + i2;
rules[NUM+NULL] = () => 0;
rules[NUM+STR] = (n, s) => cast(TYPES.NUM, s);

rules[BOOL+BOOL] = (b1, b2) => b2;
rules[BOOL+STR] = (b, s) => cast(TYPES.BOOL, s);
rules[BOOL+NULL] = b => !b;

rules[ARR+ARR] = (arr1,arr2) => arr1.concat(arr2);
rules[ARR+NULL] = () => [];
rules[ARR+ANY] = (arr,a) => {arr.push(a); return arr;};

rules[ANY+FUN] = (a, fn) => fn(a);
rules[FUN+ANY] = (fn, a) => fn(a);
rules[FUN+FUN] = (f1,f2) => a => f1(f2(a));
rules[FUN+NULL] = () => null;
rules[NULL+FUN] = (a, fn) => fn;

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
