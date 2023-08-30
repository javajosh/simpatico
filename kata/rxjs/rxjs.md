<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="JavaScript, ES6, functional, simpatico, minimalist, web verite">
  <meta name="author" content="jbr">

  <!-- Begin testable.js html boilerplate; testable.js is in the same directory -->
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='DodgerBlue' />
  </svg>"/>
  <script src="/testable.js"></script>
  <!-- End testable.js boilerplate  -->

  <title>Simpatico: RxJs</title>
  <link rel="stylesheet" type="text/css" href="/style.css">
  <link rel="stylesheet" href="/kata/highlight.github-dark.css">
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement(el);
      });
    });
  </script>
</head>-->

#RxJs - Reactive JavaScript

[Install](https://rxjs.dev/guide/installation) with `npm install rxjs` then import from `/node_modules/rxjs/dist/esm`
However the transient imports don't end in .js so this will not work! This is a [known bug](https://github.com/ReactiveX/rxjs/issues/4416). Someone was kind enough to make a [bundled version](https://github.com/esm-bundle/rxjs) you can add with `npm install rxjs@npm:@esm-bundle/rxjs`.

To make this work in production, copy the library files out of `node_modules`:
```bash
cp ../../node_modules/rxjs/esm/es5/rxjs* lib
```

```js
import {fromEvent} from './lib/rxjs.min.js';

fromEvent(document, 'click').subscribe(() => console.log('Clicked!'));
```
