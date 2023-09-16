#RxJs - Reactive JavaScript

RxJs is the JavaScript implementation of Microsoft's ReactiveX design pattern.
It's not quite functional reactive programming (FRP) because it deals in discrete, not continuous values.

The core of RxJs is the Observable. This is the source of all values, and your expression is a pipeline of operators that transform the values as they pass through. The primary reason for using RxJs is to handle asynchronous events, but it can also be used for synchronous values. That is, we program with temporal values the same way we program with spatial values (collections and arrays).

In practice, this library is used to handle events from the DOM, from web sockets, and from asynchronous calls to the server. It's also used to handle animations and other time-based events. And to weave all of these together in a way that doesn't yield nasty race conditions or ugly callback hell.

I think of RxJs as a DSL for describing a state machine. The state is the current value of the Observable, and the transitions are the operators that transform the values. The state machine is a directed graph, and the operators are the edges. Unfortunately because of the way the library is written, it uses the jsvm callstack to hold all intermediate state, which can make it painful to debug.

RxJs is almost always used in conjunction with other frameworks and tools.
For example, NgRx combines RxJs with Redux to manage events and state in Angular applications (with a helping of TypeScript on top). However, you can use RxJs with any framework, or even without a framework. Which is what we'll do here.

## Hello World
```js
import {fromEvent, of, timer, delay} from './lib/rxjs.min.js';

fromEvent(document, 'click').subscribe(() => console.log('Clicked!'));

of(false).pipe(delay(1000)).subscribe(() => console.log('Delayed 1!'));
timer(2000).subscribe(() => console.log('Delayed 2!'));
```

## Fetch

Here we use [fromFetch](https://rxjs.dev/api/fetch/fromFetch) [of](https://rxjs.dev/api/index/function/of) [switchMap](), [catchError](), and [pipe](https://rxjs.dev/api/index/function/pipe) to fetch a JSON file from the server. `fromFetch` creates the observable, and `pipe` is used to chain the operators together. `switchMap` is used to transform the response into a JSON object, and `catchError` is used to handle any errors. The stream is started with the `subscribe` call.

```js
import { fromFetch } from './lib/rxjs-fetch.min.js';
import { switchMap, of, catchError } from './lib/rxjs.min.js';

const URL = 'db.json';
console.log('Fetching', URL);

const data$ = fromFetch(URL).pipe(
  switchMap(response => {
    if (response.ok) {
      return response.json();
    } else {
      return of({ error: true, message: `Error ${ response.status } ${response.body}` });
    }
  }),
  catchError(err => {
    console.error(err);
    return of({ error: true, message: err.message })
  })
);

data$.subscribe({
  next: result => console.log(result),
  complete: () => console.log('done')
});
````

## A note on installing RxJs within Simpatico

[Install](https://rxjs.dev/guide/installation) with `npm install rxjs` then import from `/node_modules/rxjs/dist/esm`
However the transient imports don't end in .js so this will not work!
This is a [known bug](https://github.com/ReactiveX/rxjs/issues/4416).
Someone was kind enough to make a [bundled version](https://github.com/esm-bundle/rxjs) you can add with `npm install rxjs@npm:@esm-bundle/rxjs`.

To make this work in production, copy the library files out of `node_modules`:

```bash
cp ../../node_modules/rxjs/esm/es5/rxjs* lib
```

And now we can start playing!
