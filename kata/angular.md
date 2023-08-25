<!--<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="keywords" content="Simpatico, physics">
  <meta name="author" content="jbr">
  <title>SimpatiCode: Angular, TypeScript, Flux</title>

  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='pink' />
    </svg>"/>
  <link href="/style.css" rel="stylesheet" type="text/css" >
  <link href="/kata/highlight.github-dark.css" rel="stylesheet" >
  <script type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    hljs.registerLanguage('javascript', javascript);
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('pre code').forEach((el) => {
        hljs.highlightElement (el);
      });
    });
  </script>
  <script src="/testable.js" type="module"></script>

</head>-->

# Kata: Angular, TypeScript, Flux

Using an [iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) show the Angular bundle.
This requires a front-end build, so it cannot be iterated on using [literate markdown](/lit).
Project setup is described in the [readme in the angular project](angular/my-project/README) .

Note: The use of an iframe isolates the angular application completely from the host page.
Alternatively, [load this example directly](angular/my-project/bundle/index.html).
Loading directly is handy if using [Angular dev tools](https://angular.io/guide/devtools) or [Redux dev tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd) in Chrome.

```html
  <iframe
    title="Embedded Angular Kata"
    width="500"
    height="500"
    src="angular/my-project/bundle/index.html">
</iframe>
```

Angular bundles [TypeScript](https://www.typescriptlang.org/) and usually [Material Design](https://m3.material.io/).
In our case, we'll also include [NgRx](https://ngrx.io/) which is an implementation of the [Flux architectural pattern](https://www.newline.co/fullstack-react/p/intro-to-flux-and-redux/) bundled with [RxJs](https://rxjs.dev/guide/overview), a reactive library.
(Note that I have a separate [rxjs kata](rxjs) which is embedded directly with no build required, allowing faster iteration.)
