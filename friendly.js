import { assert, is, tryToStringify, size, hasProp } from "./core.js";

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
const validate = (patternObj, valueObj) => {
  //gotcha: do not use getType predicate because handler !== object, etc
  const isObjecty = a => is.obj(a) || is.msg(a)
  if (!isObjecty(valueObj)) return patternObj;
  if (patternObj === null) return {};
  if (patternObj === {}) return undefined;

  assert(isObjecty(patternObj), `pattern must be an object but was ${tryToStringify(patternObj)}`);

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
    if (!pass) {
      result[patternKey] = failReasons;
    }
    objPass = objPass && pass;
  }
  return objPass ? undefined : result;
};

/**
 * This is an internal method exported only to support testing. but it checks a value against an array of predicates.
 * This function is the one you want to change if you want to add new predicates or features to the system.
 *
 * @param predArray An array describing the valid value
 * @param value The value to be checked
 * @returns {undefined|*} Undefined (falsy) if pass. If there's a problem, return an array of failed predicates.
 */
const checkValue = (predArray, value) => {
  if (!is.arr(predArray)){
    return value === predArray ? undefined : ["equals", predArray];
  }

  const failedPreds = [];
  let pass = true;
  let allPass = true;

  for (let i = 0; i < predArray.length; i++) {
    let pred = predArray[i].toLowerCase();
    if (pred === 'failed') break;
    switch (pred) {
      case "between":
        const lo = predArray[i + 1];
        const hi = predArray[i + 2];
        i += 2;

        pass = is.between(lo, hi, size(value));
        if (!pass) {
          predArray.push('failed')
          predArray.push(value);
          failedPreds.push(pred, lo, hi);
        }
        break;
      case "size":
        const length = predArray[i + 1];
        i += 1;

        pass = is.equals(length, size(value));
        if (!pass) {
          predArray.push('failed')
          predArray.push(value);
          failedPreds.push(pred, length);
        }
        break;
      case "pick":
        const count = predArray[i + 1];
        const options = predArray.slice(i + 2);
        i += 1 + options.length;

        pass = options.includes(value);
        if (!pass) {
          predArray.push('failed')
          predArray.push(value);
          failedPreds.push(pred, count, options);
        }
        break;
      case "optional":
        pass = true;
        if (is.undef(value)) {
          return undefined;
        }
        break;
      default:
        // You can call any predicate by name - typically this will be a type check
        if (!hasProp(is, pred)) {
          predArray.push('failed');
          throw `missing predicate ${pred}`;
        }
        pass = is[pred](value);
        if (!pass) {
          failedPreds.push(pred);
        }
        break;
    }
    allPass = allPass && pass;
  }
  return allPass ? undefined : failedPreds;
};

export {validate, checkValue}
