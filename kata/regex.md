<!--<!DOCTYPE html>
<head>
  <title>Simpatico Kata: Regular Expressions</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">

  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">

  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>
</head>-->

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
