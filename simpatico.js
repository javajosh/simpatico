// Simpatico has three parts: combine, the rtree, and friendly functions.
// The core utils are generic javascript helpers, like predicates, assertions, and runtime types.
// export * as Core from './core.js';
// export * as Combine from './combine.js';
// export * as RTree from './rtree.js';
// export * as Friendly from './friendly.js';

// S is both a function and an object. As a function, S accepts either an object or an integer as input.
// If it's an integer, this is interpreted as changing the focus of the RTree.

import * as Core from './core.js';
import * as RTree from './rtree.js';

let {rtree} = RTree;

// Here is where our "primordial start event" ends up, during module load.


export const S = a => {
  rtree = rtree(a);
  return rtree;
};

