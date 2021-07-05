import { assert, is, tryToStringify, size } from "./core.js";

/**
 *  Validate an object against a pattern obj.
 *
 *  Special cases:
 *    value != object => nothing passes (return pattern)
 *    pattern = null => nothing passes (return {})
 *    pattern = {} => everything passes (return undefined)
 *
 *  Usage as a straight boolean is confusing since !validate() would actually mean it passed.
 *  Perhaps it needs a rename to "failures" and then it would make more sense.
 *
 * @param patternObj
 * @param valueObj
 * @returns {{}|undefined|*} undefined if the object passes; an object describing the failure if it fails.
 */
export const validate = (patternObj, valueObj) => {
  //gotcha: do not use getType predicate because handler !== object, etc
  const isObjecty = a => is.obj(a) || is.msg(a)
  if (!isObjecty(valueObj)) return patternObj;
  if (patternObj === null) return {};
  if (patternObj === {}) return undefined;

  assert(
    isObjecty(patternObj),
    `pattern must be an object but was ${tryToStringify(patternObj)}`
  );

  const result = {};
  let objPass = true;

  for (const [patternKey, patternValue] of Object.entries(patternObj)) {
    const value = valueObj[patternKey];
    let pass = true;
    let failReasons = undefined;

    if (is.obj(patternValue)) {
      failReasons = validate(patternValue, value); //recurse
    } else {
      failReasons = checkValue(patternValue, value); //normal case
    }

    pass = is.undef(failReasons);
    if (!pass) result[patternKey] = failReasons;
    objPass = objPass && pass;
  }
  return objPass ? undefined : result;
};

/**
 * This is an internal method exported only to support testing. but it checks a value against an array of predicates.
 * This function is the one you want to change if you want to add new predicates or features to the system.
 *
 * @param predArray
 * @param value
 * @returns {undefined|*} Undefined (falsy) if pass - like the Unix convention. If there's a problem, return it.
 */
export const checkValue = (predArray, value) => {
  if (!is.arr(predArray)){
    return value === predArray ? undefined : ["equals", predArray];
  }

  const failedPreds = [];
  let pass = true;
  let allPass = true;

  // Loop through the predicates.
  for (let i = 0; i < predArray.length; i++) {
    let pred = predArray[i].toLowerCase(); // case of preds doesn't matter

    if (pred === "between") {
      const lo = predArray[i + 1];
      const hi = predArray[i + 2];
      pass = is.between(lo, hi, size(value));
      i += 2;
      if (!pass) {
        failedPreds.push(pred, lo, hi);
      }
    } else if (pred === "optional") {
      //optional means we skip if it's missing
      if (is.undef(value)) {
        return undefined;
      }
    } else {
      // You can call any predicate by name - typically this will be a type check
      pass = is[pred](value);
      if (!pass) failedPreds.push(pred);
    }
    allPass = allPass && pass;
  }
  return allPass ? undefined : failedPreds;
};
