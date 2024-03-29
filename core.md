# Core.js
2024

A handful of comprehensive helper functions to make working with ES6 more functional. Focus is on types, predicates, assertions, functional helpers and general utilites.

## Logging

```js
  c.info('welcome to core.js')
  c.log(new Date().toUTCString());
  c.debug('this is a debugging statement') //won't show up if your console isn't set to verbose
```

## Assertions

```js
import {cast, TYPES} from './core.js';

//   Uncomment to test and make sure it actually fails.
//   assertThrows(1)
//   assertThrows(()=>{}, 'testing assertion failure');

assertEquals({a: 1, b: [2, 3]}, {a: 1, b: [2, 3]})
assertEquals({b:[{a:1},{b:2}], a:1},{a:1, b:[{a:1},{b:2}]});

// Some negative testing.
assertThrows(() => {throw ''})
assertThrows(() => {c.error('this is an error ')})
assertThrows(() => {assert(false, 'testing assertion failure')})
assertThrows(() => as.num('1'))
assertThrows(() => as.bool('1'))
assertThrows(() => as.obj([]))
assertThrows(() => as.between(0, 10, 11))
assertThrows(() => as.between(10, 10, 11))
assertThrows(()=>  as.same([false, true]))
assertThrows(() => as.same([1, 1, 2]))
assertThrows(() => as.all([true, false]))
assertThrows(() => as.num(c.cast('a', TYPES.NUM)))
assertThrows(() => assertEquals({a: 1, b: [2, 3]}, {a: 1, b: [2, 3, false]}))
```

## Object Functions

```js
  const a = {a: 1};
  const b = {b: 2};

  is.hasProp(a, 'a');
  as.hasProp(a, 'a');
  assert(c.hasProp(a, 'a'))
  assert(!c.hasProp(a, 'b'))

  as.equals(c.getProp(a, 'a'), 1)
  // test the default behavior of getProp
  as.equals(c.getProp(a, 'b', 3), 3)

  const d = c.mapObject(a, ([k, v]) => [k, v + 5])
  as.hasProp(d, 'a')
  as.equals(d['a'], 6)
```

## Equals

```js
  const a = {a: 1}, b = {b: 2}
  as.equals(1, 1)
  as.notEquals(1, 2)
  as.notEquals(a, b)
  as.equals(a, {a: 1})
  as.notEquals(a, {a: 1, b: 2})

  const arr0 = [], arr1 = [1, 3, 5], arr2 = [1, 3, 5], arr3 = [1, 3], arr4 = [1, 3, 5, 'a']
  as.equals(arr1, arr2)
  as.notEquals(arr0, arr1)
  as.notEquals(arr1, arr3)
  as.notEquals(arr1, arr4)
  as.notEquals(arr0, arr4)
```
## Booleans
```js
  assert(c.and(true, true))
  assert(!c.and(true, false))
  assert(c.or(true, false))
  assert(c.or(false, true))
  assert(!c.or(false, false))

```
## Predicates
```js
  assert(is.num(.1))
  assert(is.int(1))
```

## Arrays
Functional, non-mutating versions of the built in array functions.

```js
  const arr0 = [], arr1 = [1, 3, 5], arr2 = [1, 3, 5], arr3 = [1, 3], arr4 = [1, 3, 5, 'a']
  as.equals(c.peek(arr1), 5)
  as.equals(c.peek(arr0), null)
  as.equals(c.peek(arr0, 0), 0)


  const arr5 = c.push(arr1, 3)
  as.equals([1, 3, 5, 3], arr1)
  as.equals(arr5, arr1)
```
## Types

```js
  assertEquals(c.getType(1), c.TYPES.NUM)
  assertEquals(c.getType([]), c.TYPES.ARR)
  assertEquals(c.getType({}), c.TYPES.OBJ)

  // Simpatico specific duck-typing
  assertEquals(c.getType({
    handle: () => {}
  }), c.TYPES.HANDLER)
  assertEquals(c.getType({handler: ''}), c.TYPES.MSG)

  // Size is defined differently for different types.
  assertEquals(c.size(10), 10)
  assertEquals(c.size('foo'), 3)
  assertEquals(c.size([3, 2, 5, 4]), 4)
  assertEquals(c.size({foo: 1, bar: 2}), 2)
  assertEquals(c.size(() => {
  }), 0)
  assertEquals(c.size(null), 0)
  assertEquals(c.size(), 0)

  assertEquals({},{})
  assertEquals([1],[1])

```
## Assertions

```js
  as.str('foobar')
  as.num(1)
  as.bool(false)
  as.fun(() => {});
  as.obj({})
  as.arr([])
  as.between(0, 10, 5)
  as.between(0, 10, 'a') //between assumes string length
  as.between(0, 4, [1, 2])
  as.exists([])
  as.exists({})
  as.exists(0)

  as.equals([], [])
  as.contains([1, 3, 4], 3)
  as.excludes([1, 3, 4], 5)
  as.bool(c.cast('false'))
  as.num(c.cast('1234'))
  as.all([1, 1, 1])
  as.all(['a','a','a'])
  as.same([true, true])
  as.same([false, false])
  as.same([1, 1, 1, 1, 1])
  as.same(['a', 'a', 'a'])
  as.same([{}, {}, {}, {}])

```
## parseObjectLiteralString
Used for [reflector](reflector.md) arguments

```js

  const parsed = c.parseObjectLiteralString(`{http:80, https:443, ws:8081, host:simpatico.io,
    cert:/etc/letsencrypt/live/simpatico.io/fullchain.pem,
    key:/etc/letsencrypt/live/simpatico.io/privkey.pem
  }`)
  // Doesn't do type conversion, but that's okay
  as.int(parsed.http)
  // Only take strings
  assertThrows(() => c.parseObjectLiteralString())
  assertThrows(() => c.parseObjectLiteralString({}))
  // You must not have spaces between key, colon and value. I'd like to relax this, but am not a regexpert.
  // This also means that you can't have a value with a leading space, which is annoying
  assertThrows(() => c.parseObjectLiteralString(`{http :80, https:443}`))

  ```
## De/Serialization


```js
  // Lets test the function detecting regex.
  const functionString = "async function greet(name) {\n  console.log(`Hello, ${name}!`);\n}";
  const arrowFunctionString = "(async (x, y) => x + y)";
  const notFunctionString = "const message = 'Hello, world!'";
  assert(c.regex.functions.test(functionString));
  assert(c.regex.functions.test(arrowFunctionString));
  assert(!c.regex.functions.test(notFunctionString));
  const o1 = {
    a: 1,
    b: {
      c: function() {
        console.log('hello');
      },
      d: {
        e: function() {
          console.log('world');
        }
      },
      f: (a,b) => {console.log('arrows')}
    },
    g: 'hello',
    h: 'world() && foo',
  };
  const strActual = c.stringifyWithFunctions(o1);
  const strExpected = `{"a":1,"b":{"c":"function() {\\n        console.log('hello');\\n      }","d":{"e":"function() {\\n          console.log('world');\\n        }"},"f":"_ArrowF_(a,b) => {console.log('arrows')}"},"g":"hello","h":"world() && foo"}`;
  assertEquals(strActual, strExpected);
```
