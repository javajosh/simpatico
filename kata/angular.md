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

Angular bundles [TypeScript](https://www.typescriptlang.org/)
and usually [Material Design](https://m3.material.io/).
We add [NgRx](https://ngrx.io/)
which is an implementation of the [Flux architectural pattern](https://www.newline.co/fullstack-react/p/intro-to-flux-and-redux/)
bundled with [RxJs](https://rxjs.dev/guide/overview), a reactive library.
(Note that I have a separate [rxjs kata](rxjs) which is embedded directly with no build required, allowing faster iteration.)

Angular is very heavy on *structure*.
After your mockup you sketch out your module and component structure and generate.
In this case, we add options to keep the number of files to a minimum (-s uses inline styles, -t inline templates, --flat doesn't create a directory and --skip-tests skips creating the test file.)
The Angular module system is unique. It uses TypeScript annotations to finely control what is available to components at runtime.
The modules operate as a dependency injector, using constuctors to put examples in there.
```bash
# Create the simplest possible scaffold for an Angular app after initial `ng new my-project`
# For timing, `npm install -g gnomon` and then pipe to gnomon like `./gen.sh | gnomon`

# Global components
ng g c home -s -t --flat --skip-tests
ng g c navbar -s -t --flat --skip-tests

# Create a todos module with components
ng g m todos
ng g c todos/todos -m todos -s -t --flat --skip-tests
ng g c todos/todo-add -m todos -s -t --flat --skip-tests
ng g c todos/todo-edit -m todos -s -t --flat --skip-tests
```

Build with the following command, and serve the bundle:

```bash
ng build --output-path bundle
```


## Sudden, massive ng slowdown on Windows/WSL2
I'm experiencing a massive slowdown of all `ng` commands that I execute my Windows/WSL2/Ubuntu VM.
This happened suddenly, and I'm not sure what changed to cause it.
The same commands execute quickly on my Ubuntu laptop.

While it's interesting that [WSL1 is more performant when working with Windows filesystems](https://stackoverflow.com/questions/68972448/why-is-wsl-extremely-slow-when-compared-with-native-windows-npm-yarn-processing), this seems unlikely, but not impossible.
The number of dependencies in `node_modules` has exploded.
However, `ng` seems to hang before doing *anything* so I'm not convinced that is the problem.

  1. Create a WSL1 version of the VM and see if that helps.
    `wsl --export Ubuntu c:\ubu` then `wsl --import C:\ubu --version 1`
     This change took ~1 hr and resulted in a 2x speedup. But it's still slow.
  2. Another possible culprit is IntelliJ, at least indirectly.
     It's possible that it's done something at the project level and generated another `node_modules` somewhere that is confusing `ng`.

