# Friendly Functions
2024

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
    all, contains, equals} = as;

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
  undef(checkValue(['undef']));

  undef(checkValue(['optional']));

  undef(checkValue(['num','between', 0, 3], 2));
  undef(checkValue(['str', 'between', 1, 3], "a")); // checking length
  undef(checkValue(['str', 'between', 1, 3], "abc"));
  undef(checkValue(['str', 'size', 3], "abc"));

  undef(checkValue(['optional','num','between', 0, 3], 2));
  undef(checkValue(['optional','num','between', 0, 3] ));

  // checkValue() tests - Bad scalar matches
  equals(checkValue('foo', 'bar'), ['equals', 'foo']);
  equals(checkValue(1, 2), ['equals', 1]);
  equals(checkValue(['num'], 'a'), ['num']);
  equals(checkValue(['int'], .1), ['int']);
  equals(checkValue(['str'], 1), ['str']);
  equals(checkValue(['between', 0, 3], 4), ['between', 0, 3]);
  equals(checkValue(['str', 'between', 0, 3], 'abcd'), ['between', 0, 3]);

  // checkValue() tests - optional doesn't mean you can supply a bad value!
  equals(checkValue(['optional', 'num'], 'a'), ['num']);
  equals(checkValue(['optional', 'between', 0, 3], 4), ['between', 0, 3]);
  equals(checkValue(['optional', 'num', 'between', 0, 3], 'a'), ['num']);

  undef(checkValue(['optional', 'num', 'between', 0, 10], 5));

  // validate() tests - single key
  undef(validate({a: ['num']}, {a: 1}));
  equals(validate({a: ['num']}, {a: 'a'}), {a: ['num']}, 'failed key');
  equals(validate({a: ['num']}, {}), {a: ['num']}, 'missing non-optional');

  // validate() tests multi key
  equals(validate({a: ['num'], b: ['num']}, {a: 1, b: 1}), undefined, 'multi-key success');
  equals(validate({a: ['num'], b: ['num']}, {a: 1, b: ''}), {b: ['num']}, 'multi-key fail');
  // TEST: If we returned matching values this would be
  // assertEquals(validate({a: ['num'], b: ['num']}, {a: 1, b: ''}), {a: 1, b: ['num']}, 'multi-key fail');

  // validate() tests special cases
  undef(validate({}, {everything: 'passes'}));
  equals(validate(null, {everything: 'fails'}), {});
  equals(validate({a: ['str']}, 'non-obj value fails'), {a: ['str']});

  // validate() satisfied when optional is ignored
  undef(validate({
      a: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      a: 'dec'
    }));
  undef(validate({
      handler: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      handler: 'dec'
    })
  );
  undef(validate({
      msg: 'dec',
      b: ['optional', 'num', 'between', 0, 10]
    }, {
      msg: 'dec',
    })
  );

  // validate() returns failures even if some succeeded.
  equals(validate({
    e: ['num', 'between', 0, 10],
    f: ['optional', 'str', 'between', 3, 8],
  }, {
    e: 11,
    f: "abcd",
  }), {
    e: ['between', 0, 10],
  });

  // nested object
  undef(validate({
      a: ['num'],
      b: {c: ['num']},
    }, {
      a: 1,
      b: {c: 1},
    })
  );

  equals(validate({
    a: ['num'],
    b: {c: ['num']}
  }, {
    a: 1,
    b: {c: ''}
  }), {
    b: {c: ['num']}
  });

  // the full monty
  undef(validate(testPattern, testValid));
  equals(validate(testPattern, testNotValid), {d: {e: ['between', 0, 10]}, g:["pick", 1, ["apple","orange","bannana"] ]}, 'full monty should NOT be valid');

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
  equals(friendly(), {a: ['bool']})
  equals(friendly(1), {a: ['bool']})
  equals(friendly({a: 1}), {a: ['bool']})
  equals(friendly({b: true}), {a: ['bool']})
  equals(friendly({a: true}), 2)
```
