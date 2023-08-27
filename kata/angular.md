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

[load the bundle directly](angular/my-project/bundle/index.html) or
[load the dev server version](http://localhost:4200/) (locally running only)
handy if using [Angular dev tools](https://angular.io/guide/devtools) or
[Redux dev tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd).

```html
<iframe
  id="angular-frame"
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

# Fonts

Angular Material (`ng add @angular/material`) wants to control typography, but the code it generates requires that the client browser access Google's site at runtime, which is unacceptable:
```html
  <!--- DO NOT EXECUTE --->
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```
The best solution is to not use their fonts, and rely on what's built-in to the browser.
This avoids the download (~170KB!), the code complexity, and the [FOUT](https://fonts.google.com/knowledge/glossary/fout) that makes the site worse.
If fonts matter so much that the browser fonts aren't good enough, use PDF.

The next best solution is to self-host the [fonts](https://fonts.google.com/specimen/Roboto?query=roboto) (you can download them manually there)
and [icons](https://developers.google.com/fonts/docs/material_symbols#browsing_and_downloading_individual_icons) (download them [here](https://github.com/google/material-design-icons/tree/master/variablefont))
and add the following css. See [Google's guide to using web fonts](https://fonts.google.com/knowledge/using_type/using_web_fonts)

```css
/*** DO NOT EXECUTE ***/
  @font-face {
    font-family: 'Material Symbols Outlined';
    font-style: normal;
    src: url(material-symbols.woff) format('woff');
  }

  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;  /* Preferred icon size */
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
  }
```

## Fontsource

Manual self-hosting is problematic. Treat fonts like a dependency.
Enter [fontsource](https://fontsource.org/docs/getting-started/introduction).
We'll use [variable fonts](https://fontsource.org/docs/getting-started/variable),
which is [widely supported by modern browsers](https://caniuse.com/?search=variable%20font).
We'll use the [Fontsource Angular guide](https://fontsource.org/docs/guides/angular).

The Angular Material components want [Roboto](https://fonts.google.com/specimen/Roboto?query=roboto) and [Material Symbols](https://fontsource.org/docs/getting-started/material-symbols).
Let's start with Roboto.

```bash
npm install @fontsource-variable/open-sans
npm install @fontsource-variable/roboto-flex
```

Then in `app.component.css`

```css
/*** DO NOT EXECUTE ***/
@import "~@fontsource-variable/open-sans/wght.css";
@import "~@fontsource-variable/roboto-flex/wght.css";


/* in the component */
.open-sans-variable {
  font-family: "Open Sans Variable", sans-serif;
}
.roboto-flex {
  font-family: "Roboto", sans-serif;
}
```

This worked pretty well! Angular magically includes the woff2 files in the bundle. It remains to be seen if Angular Material picks up Roboto.

The other font we need is [material symbols](https://fonts.google.com/icons?icon.style=Rounded)
which have [slightly different install instructions](https://fontsource.org/docs/getting-started/material-symbols):

```bash
npm install @fontsource-variable/material-symbols-rounded
```
```css
/*** DO NOT EXECUTE ***/
@import "~@fontsource-variable/material-symbols-rounded/wght.css";

.material-symbols-outlined {
  font-family: "Material Symbols Rounded";
  font-weight: normal;
  font-style: normal;
  font-size: 24px; /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}
```

Note that Material Symbols font file is a whopping 665KB over the wire!!!
To avoid this there's an [svg angular symbols package](https://github.com/marella/material-design-icons/tree/main/svg#readme).
But I've spent enough time on this!

# Material

Google made components. Comes with their own [schematics](https://material.angular.io/guide/schematics).
Install and generate a nav comoponent like so:

```bash
ng add @angular/material
ng g @angular/material:navigation material-nav

```
