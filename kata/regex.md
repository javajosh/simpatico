# Simpatico Kata: Regular Expressions
See: [home](/index.html), [reflector](/reflector.md)

Regular expressions are hard.
Regular expressions in JavaScript are even harder.
Regular expressions in JavaScript in the browser are the hardest.
See [regex 101](https://regex101.com/) for a good regex tester.

## Common use cases

```js
// Does a string contain a substring?
assertEquals(true, /foo/.test('foobar'));
assertEquals(false, 'foobar'.indexOf('foo') === -1);

// Regex literals in javascript: the following are equivalent:
const regex = /foo/gm;
const regex = new RegExp('foo', 'gm');

```
