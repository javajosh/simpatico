import C from './core.mjs';
import {checkValue, validate} from "./friendly.mjs";

const {assert, assertEquals, OBJ} = C.asserts;
const {ARR, UNDEF,between} = C.preds;
const {tryToStringify} = C.utils;

const testPattern = {
  a: ['num', 'between', 0, 10],
  b: ['str'],
  c: ['optional', 'str', 'between', 0, 10],
  d: {
    e: ['num', 'between', 0, 10],
    f: ['optional', 'str', 'between', 3, 8],
  }
};

// Here's a value that matches
const testValid = {
  a: 5,
  b: 'hi',
  d: {
    e: 3,
    f: 'abcd'
  }
};

// Here's one that doesn't
const testNotValid = {
  a: 5,
  b: 'hi',
  d: {
    e: 11, //this one fails.
    f: 'abcd'
  }
};

// Tests checkValue()

// The normal happy cases
assertEquals(checkValue(['str'], 'a'), undefined);
assertEquals(checkValue(['num'], 1), undefined);
assertEquals(checkValue(['bool'], false), undefined);
assertEquals(checkValue(['between', 0, 3], 2), undefined);
assertEquals(checkValue(['optional'], undefined), undefined);

// Bad scalar matches
assertEquals(checkValue(['num'], 'a'), ['num']);
assertEquals(checkValue(['str'], 1), ['str']);
assertEquals(checkValue(['between', 0, 3], 4), ['between', 0, 3]);

// Optional doesn't mean you can supply a bad value!
assertEquals(checkValue(['optional', 'num'], 'a'), ['num']);
assertEquals(checkValue(['optional', 'between', 0, 3], 4), ['between', 0, 3]);
assertEquals(checkValue(['optional', 'num', 'between', 0, 3], 'a'), ['num']);

assertEquals(checkValue(['optional', 'num', 'between', 0, 10], 5), undefined);

// Tests validate()
debugger;
// single key
assertEquals(validate({a: ['num']}, {a: 1}), undefined, 'passed key');
assertEquals(validate({a: ['num']}, {a: 'a'}), {a: ['num']}, 'failed key');
assertEquals(validate({a: ['num']}, {}), {a: ['num']}, 'missing non-optional');

// multi key
assertEquals(validate({a: ['num'], b:['num']}, {a: 1, b:1}), undefined, 'multi-key success');
assertEquals(validate({a: ['num'], b:['num']}, {a: 1, b:''}), {b:['num']}, 'multi-key fail');

// special cases
assertEquals(validate({},{everything:'passes'}), undefined);
assertEquals(validate(null, {everything:'fails'}), {});
assertEquals(validate({a:['num']}, 'every non-obj value fails'), {a:['num']});

assertEquals(validate({a: 'dec', b:['optional', 'num', 'between', 0, 10]}, {a:'dec'}), undefined);
assertEquals(validate({handler: 'dec', b:['optional', 'num', 'between', 0, 10]}, {handler:'dec'}), undefined);


assertEquals(validate({
  e: ['num', 'between', 0, 10],
  f: ['optional', 'str', 'between', 3, 8],
}, { e: 11, f: "abcd" }), {
  e: ['between', 0, 10]
});

// nested object
assertEquals(validate({a:['num'], b:{c:['num']}}, {a: 1, b:{c:  1}}), undefined);
assertEquals(validate({a:['num'], b:{c:['num']}}, {a: 1, b:{c: ''}}), {b:{c:['num']}});

// the full monty
assertEquals(validate(testPattern, testValid), undefined, 'full monty should be valid');
assertEquals(validate(testPattern, testNotValid), {d:{e:['between', 0, 10]}}, 'full monty should NOT be valid');


/** docs
 A simple friendly function. Note that friendly functions can only take one object arg.
 It's better if they don't return objects if they execute normally, since this clashes with the descriptive failure mode
 We will see that in a handler context these conditions are very natural and easy
 */
const friendly = input => {
  const pattern = {a:['bool']};
  if (!validate(pattern, input)){ // concern: It's not intuitive to check !validate. rename to 'invalid'?
    return 2;
  } else {
    return pattern;
  }
}

assertEquals(friendly(), {a:['bool']})
assertEquals(friendly(1), {a:['bool']})
assertEquals(friendly({a:1}), {a:['bool']})
assertEquals(friendly({b:true}), {a:['bool']})
assertEquals(friendly({a:true}), 2)
