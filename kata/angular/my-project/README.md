# MyProject

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.0.

## Preamble

  1. Fix node version with nvm. `nvm install --lts` and because [something went wrong](https://github.com/nvm-sh/nvm/issues/3173) `sudo ln -s /home/simp/.nvm/versions/node/v18.17.1/bin/node /usr/bin/node`
  2. Install angular cli globally. `npm install -g @angular/cli`
  3. Create a new project. `ng new my-project`
  4. Add ngrx to the project. `ng add @ngrx/store`

Later, once things are working, it's important to build (`ng build`) check in the bundle which is in `dist/` and links to the "kata" should point to that directory rather than this one. E.g. [/kata/angular/my-project/dist/](/kata/angular/my-project/dist/my-project)



## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
