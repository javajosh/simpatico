<!--<!DOCTYPE html>
<head>
  <title>Simpatico: Async Kata</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <meta id="refresh" http-equiv="refresh" content="2">
  <script class="testable" src="testable.js" type="module"></script>
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

_________________________________________________________
# Simpatico: Async Kata()
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md)

<div class="makeItStop"></div>

JavaScript is single-threaded, which means asynchrony is left as an exercise for the reader.
    1. First there were callbacks.
    2. Then there were `Promises`.
    3. Then there was `async/await`, which is syntax sugar over `Promises`.
    4. There is also `RxJs`, which reifies a program in builder syntax.

In simple cases callbacks are still appropriate, and desirable for their simplicity.
However it can be a challenge to understand what is happening at runtime in systems written this way.
In all cases we are "cutting" the current thread of execution and saying, "This is going to take time, so come back here"

