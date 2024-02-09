# Friendly Functions
created *27 Jan 2019* last updated *20 June 2022* by jbr

A friendly function is one that tells you how to call it, and if there is an argument which part of the argument is wrong.

 1. If you call it with nothing, it returns a <i>pattern</i> describing how to call it.
 2. If you call it with an object that matches the pattern, then, great!
 3. If you call it with an object that only partially matches the pattern, it will return an object containing a combination of matched values and unmatched patterns.

How can you tell the difference between a successful function invocation and an unsuccessful one?
Return something other than an object!
The most general (and useful) convention is to return an array.

Related:
  1. [Zod](https://github.com/colinhacks/zod) "TypeScript-first schema validation with static type inference "
  2. [JSONSchema and the schema store](https://www.schemastore.org/json/)


```js
  import {checkValue, validate} from '/friendly.js';

  const {str, num, bool, fun, obj, undef, arr, same,
    all, contains, arrEquals} = as;

  const testPattern = {
    a: ['num', 'between', 0, 10],
    b: ['str'],
    c: ['optional', 'str', 'between', 0, 10],
    d: {
      e: ['num', 'between', 0, 10],
      f: ['optional', 'str', 'between', 3, 8],
    },
    g: ['str', 'pick', 1, 'apple', 'orange', 'bannana'],
  };

  // Here's a value that matches
  const testValid = {
    a: 5,
    b: 'hi',
    d: {
      e: 3,
      f: 'abcd',
    },
    g: 'apple'
  };

  // Here's one that doesn't
  const testNotValid = {
    a: 5,
    b: 'hi',
    d: {
      e: 11, //this one fails.
      f: 'abcd',
    },
    g: 'pear', // so does this one
  };

  // checkValue() tests - The normal happy cases
  // undef is GOOD, it means the function was satisfied and didn't have to spit something back.
  undef(checkValue('foo', 'foo'));
  undef(checkValue(1, 1));


  undef(checkValue(['str'], 'a'));
  undef(checkValue(['str'], ''));
  undef(checkValue(['num'], .1));
  undef(checkValue(['int'], 1));
  undef(checkValue(['bool'], false));
  undef(checkValue(['arr'], [1,2,3]));
  undef(checkValue(['obj'], {a:1}));
  undef(checkValue(['undef']) /*, undefined */);

  undef(checkValue(['optional']) /*, undefined */);

  undef(checkValue(['num','between', 0, 3], 2));
  undef(checkValue(['str', 'between', 1, 3], "a")); // checking length
  undef(checkValue(['str', 'between', 1, 3], "abc"));
  undef(checkValue(['str', 'size', 3], "abc"));

  undef(checkValue(['optional','num','between', 0, 3], 2));
  undef(checkValue(['optional','num','between', 0, 3] /*, undefined */ ));

  // checkValue() tests - Bad scalar matches
  arrEquals(checkValue('foo', 'bar'), ['equals', 'foo']);
  arrEquals(checkValue(1, 2), ['equals', 1]);
  arrEquals(checkValue(['num'], 'a'), ['num']);
  arrEquals(checkValue(['int'], .1), ['int']);
  arrEquals(checkValue(['str'], 1), ['str']);
  arrEquals(checkValue(['between', 0, 3], 4), ['between', 0, 3]);
  arrEquals(checkValue(['str', 'between', 0, 3], 'abcd'), ['between', 0, 3]);

  // checkValue() tests - optional doesn't mean you can supply a bad value!
  arrEquals(checkValue(['optional', 'num'], 'a'), ['num']);
  arrEquals(checkValue(['optional', 'between', 0, 3], 4), ['between', 0, 3]);
  arrEquals(checkValue(['optional', 'num', 'between', 0, 3], 'a'), ['num']);

  undef(checkValue(['optional', 'num', 'between', 0, 10], 5), undefined);

  // validate() tests - single key
  assertEquals(validate({a: ['num']}, {a: 1}), undefined, 'passed key');
  assertEquals(validate({a: ['num']}, {a: 'a'}), {a: ['num']}, 'failed key');
  assertEquals(validate({a: ['num']}, {}), {a: ['num']}, 'missing non-optional');

  // validate() tests multi key
  assertEquals(validate({a: ['num'], b: ['num']}, {a: 1, b: 1}), undefined, 'multi-key success');
  assertEquals(validate({a: ['num'], b: ['num']}, {a: 1, b: ''}), {b: ['num']}, 'multi-key fail');
  // TEST: If we returned matching values this would be
  // assertEquals(validate({a: ['num'], b: ['num']}, {a: 1, b: ''}), {a: 1, b: ['num']}, 'multi-key fail');

  // validate() tests special cases
  assertEquals(validate({}, {everything: 'passes'}), undefined);
  assertEquals(validate(null, {everything: 'fails'}), {});
  assertEquals(validate({a: ['str']}, 'non-obj value fails'), {a: ['str']});

  // validate() satisfied when optional is ignored
  assertEquals(validate({
      a: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      a: 'dec'
    }),
    undefined);
  assertEquals(validate({
      handler: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      handler: 'dec'
    }),
    undefined
  );
  assertEquals(validate({
      msg: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      msg: 'dec',

    }),
    undefined
  );

  // validate() returns failures even if some succeeded.
  assertEquals(validate({
    e: ['num', 'between', 0, 10],
    f: ['optional', 'str', 'between', 3, 8],
  }, {
    e: 11,
    f: "abcd",
  }), {
    e: ['between', 0, 10],
  });

  // nested object
  assertEquals(validate({
      a: ['num'],
      b: {c: ['num']},
    }, {
      a: 1,
      b: {c: 1},
    }),
    undefined
  );

  assertEquals(validate({
    a: ['num'],
    b: {c: ['num']}
  }, {
    a: 1,
    b: {c: ''}
  }), {
    b: {c: ['num']}
  });

  // the full monty
  assertEquals(validate(testPattern, testValid), undefined, 'full monty should be valid');
  assertEquals(validate(testPattern, testNotValid), {d: {e: ['between', 0, 10]}, g:["pick", 1, ["apple","orange","bannana"] ]}, 'full monty should NOT be valid');

  /** docs
   A simple friendly function.
   Friendly functions can only take one object arg.
   If the the argument is valid, we execute the function.
   If the argument is invalid, we return the failed pattern.
   */
  const friendly = input => {
    const pattern = {a: ['bool']};
    if (!validate(pattern, input)) { // concern: It's not intuitive to check !validate. rename to 'invalid'?
      return 2;
    } else {
      return validate(pattern, input);
    }
  }

  // Lots of wrong ways to call this function; only one right way
  assertEquals(friendly(), {a: ['bool']})
  assertEquals(friendly(1), {a: ['bool']})
  assertEquals(friendly({a: 1}), {a: ['bool']})
  assertEquals(friendly({b: true}), {a: ['bool']})
  assertEquals(friendly({a: true}), 2)
```
