#JavaScript
2020

ES6. Objects, functions. Prototypal inheritance.

```js
  // This demonstrates prototypal inheritance.
  let a = {a:1, b:2};
  let b = {c:3, d:4};
  let c = {e:5, f:6};

  // A primitive combine() (only supports non-reactive, destructive key-merge)
  // But it has the essential feature of reifying our state and our input, and shows
  // the mutable-state pattern. d is mutated as a side-effect
  let d = {};
  Object.assign(d, a);
  Object.assign(d, b);
  Object.assign(d, c);

  // By contrast, an immutable-state pattern looks like this. The value of e is never changed,
  // but e is a mutable reference that points to a succession of values. If you squint your eyes
  // you see that each state has a fresh allocation (the empty object at the beginning of the assign call).
  let e = {};
  e = Object.assign({}, e, a);
  e = Object.assign({}, e, b);
  e = Object.assign({}, e, c);

  // The elements of assign can be computed.
  let f = (e,a) => ({a: e.a + a.a});
  e = Object.assign({}, e, f(e,a));
  e = Object.assign({}, e, f(e,a), f(e,b), f(e,c));

  // Compute all inputs independently
  [a,b,c].map(input => f(e, input));

  // Compute all inputs dependently, mutating e
  [a,b,c].reduce(f, e);
  [e,a,b,c].reduce(f, {});
```

