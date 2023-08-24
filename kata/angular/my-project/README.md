# MyProject

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.0.

## Preamble

  1. Fix node version with nvm. `nvm install --lts` and because [something went wrong](https://github.com/nvm-sh/nvm/issues/3173) `sudo ln -s /home/simp/.nvm/versions/node/v18.17.1/bin/node /usr/bin/node`
  2. Install angular cli globally. `npm install -g @angular/cli`
  3. Create a new project. `ng new my-project`
  4. Add ngrx to the project. `ng add @ngrx/store`

Later, once things are working, it's important to build (`ng build`) check in the bundle which is in `dist/` and links to the "kata" should point to that directory rather than this one. E.g. [/kata/angular/my-project/bundle/](/kata/angular/my-project/bundle). This is because the `dist/` directory is ignored by git. Also, we need to update the base url to be relative, which is the small addition of `--base-href ./` to the build command or quivalently modify the base href in `index.html/head` to be `<base href="./">`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

Flourish: use [concurrently](https://www.npmjs.com/package/concurrently) 
 to run [json-server](https://www.npmjs.com/package/json-server) in parallel with the build and server. `concurrently "json-server --watch db.json" "ng serve" "ng build --watch --base-href ./ --output-path dist --output-hashing none"`. Install locally with `npm i -D concurrently json-server` and then add a new script `package.json/fancy` and run with `npm run fancy`.

## Tooling (IntelliJ)

There is [considerable IntelliJ support for Angular](https://www.jetbrains.com/help/idea/2021.1/angular.html#ws_angular_syntax_highlighting). But for now I'm going to stick mostly with the command line for generating new components. I also use the Run Configuration to make using the various `npm run` commands a one-click thing.

Hosted tooling is also a thing - this is codepen for more involved front-ends.
[Stackblitz](https://stackblitz.com/run?file=src%2Fapp%2Fapp.component.html) is one example.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Cleaning up the code.
take the titles and change the links to my stuff. Also remove the default resources links (but they are useful so here they are):

  1. https://angular.io/tutorial
  2. https://angular.io/cli
  3. https://material.angular.io/
  4. https://blog.angular.io/
  5. https://angular.io/devtools/
  6. https://angular.io/guide/cheatsheet - a great reminder of directive and binding syntax, which is easy to forget.

There is also this pattern which is an example of using angular templates give the user the ability to select an arbitrary chunk of DOM and replace another chunk, all without requiring component code. I also like the use of SVG icons: 
```angular2html
  <input type="hidden" #selection>

<div class="card-container">
  <button class="card card-small" (click)="selection.value = 'component'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>New Component</span>
  </button>

  <button class="card card-small" (click)="selection.value = 'material'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>Angular Material</span>
  </button>

  <button class="card card-small" (click)="selection.value = 'pwa'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>Add PWA Support</span>
  </button>

  <button class="card card-small" (click)="selection.value = 'dependency'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>Add Dependency</span>
  </button>

  <button class="card card-small" (click)="selection.value = 'test'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>Run and Watch Tests</span>
  </button>

  <button class="card card-small" (click)="selection.value = 'build'" tabindex="0">
    <svg class="material-icons" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
    <span>Build for Production</span>
  </button>
</div>

<!-- Terminal -->
<div class="terminal" [ngSwitch]="selection.value">
  <pre *ngSwitchDefault>ng generate component xyz</pre>
  <pre *ngSwitchCase="'material'">ng add @angular/material</pre>
  <pre *ngSwitchCase="'pwa'">ng add @angular/pwa</pre>
  <pre *ngSwitchCase="'dependency'">ng add _____</pre>
  <pre *ngSwitchCase="'test'">ng test</pre>
  <pre *ngSwitchCase="'build'">ng build</pre>
</div>

```

## Build

  1. Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
  1. Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).
  1. Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

