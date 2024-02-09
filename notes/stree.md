# STree
jbr *2023*

See [combine](/combine)

# Introduction
  1. Start with an n-ary tree wrapping the value
  2. Add a residue to the node, to a reduction from root

The Simpatico Tree, Summary Tree, or STree or STrie is an n-ary tree
with these applications:

1.  Unification of different kinds of specialization, especially
    inheritance vs instantiation.
2.  Similar strategy for integration of disparate families of inputs,
    e.g., network AND hci inputs.
3.  We demonstrate parts of the operation elsewhere:
    1.  [Browser events](/notes/browser-events.html) demonstrates
        techniques for trapping and integrating HCI events.
    2.  [Chat](/chat) demonstrates integrating network events.


## STree as a sequence of reductions

1.  Reduction 1: The basic input is a list of values, interleaved objects and integers.
    Integers are interpreted as a 'selection' or 'focus' over either nodes (the positive integers) or the rows (negative integers plus 0).
    Targeting a node creates a new branch, and targeting a branch adds to that branch.
2.  Reduction 2: Each branch is reduced with `combine()` into a residue.
    1.  For efficiency, only one residue is kept per branch.
3.  Reduction 3: (optional) All residues are reduced into a summary.
    1.  The simplest useful summary simply concatenates, as in an array
    2.  The summary allows controlled interaction between rows during
        every measurement integration

The intuition is that you have some type rows, and branch from points in those rows to create instances.
The effect is that you can have `type versions` active at the same time.

# Support for non-combine() reductions
One can get a trie by using string concatenation.
One can get a summing tree by using addition as combine.
One can get a sequence of related objects by using `Object.assign()`.

## STree over sum

```js
  import { stree } from './stree.js';

  // Create a new stree under addition
  const s = stree(0, (a, b) => a + b);
  assertEquals(1, s.branches.length);
  assertEquals(0, s.branches[0].residue);
  assertEquals(0, s.getFocus());
  assertEquals(0, s.residue());

  s.add(1);
  assertEquals(1, s.branches.length,  'Branch length should not have changed');
  assertEquals(1, s.branches[0].residue, 'The residue is now 1');
  assertEquals(0, s.getFocus(), 'still focused on row 0');
  assertEquals(1, s.residue(), 'Another way to get residue');

  s.add(3);
  assertEquals(1, s.branches.length, 'Branch length should not have changed');
  assertEquals(4, s.branches[0].residue, 'The residue is now 4, the sum of 1 and 3');
  assertEquals(0, s.getFocus(), 0, 'Still focused on row 0');
  assertEquals(4, s.residue(), 4);

  // Set focus
  s.setFocus(1);
  assertEquals(1, s.branches.length, 1);
  assertEquals(4, s.branches[0].residue, 4);
  assertEquals(1, s.getFocus(), 'focus is now on node 1');
  assertEquals(1, s.residue(), 'residue is of node 1, which is 1');

  // Adding to a node will create a new branch with value 6. Rows are labeled with negative integers.
  s.add(5);
  assertEquals(2, s.branches.length, 'now there are 2 branches');
  assertEquals(4, s.branches[0].residue, 'the first branch is at 4, as before');
  assertEquals(6, s.branches[1].residue, 'the second branch is 1+5');
  assertEquals(-1, s.getFocus(), 'the focus is on the second branch with index -1');
  assertEquals(6, s.residue(), 'the default residue should be 6');

  s.add(5)
  assertEquals(2, s.branches.length);
  assertEquals(4, s.branches[0].residue);
  assertEquals(11, s.branches[1].residue, 'only this residue changed');
  assertEquals(-1, s.getFocus());
  assertEquals(11, s.residue(), 'the default residue is correct');

  // First argument is the value, second is the (node) focus
  // This will create a new row
  s.add(3, 2);
  assertEquals(3, s.branches.length, 'there are now 3 branches');
  assertEquals(4, s.branches[0].residue);
  assertEquals(11, s.branches[1].residue);
  assertEquals(7, s.branches[2].residue, 'the new branch has residue 7');
  assertEquals(-2, s.getFocus());
  assertEquals(7, s.residue());
  ```
## STree over `Object.assign()`
You can create a group of related objects using `Object.assign()`, which is a weaker form of [combine](/combine.md).
```js
   import { stree } from './stree.js';

  const s = stree({}, (a,b) => Object.assign({},a,b))
  assertEquals(1, s.branches.length)
  assertEquals({}, s.branches[0].residue)
  assertEquals(0, s.getFocus())
  assertEquals({}, s.residue())

  s.add({a:1})
  assertEquals(1,       s.branches.length)
  assertEquals({a:1},   s.branches[0].residue)
  assertEquals(0,       s.getFocus())
  assertEquals({a:1},   s.residue())

  s.add({a:2})
  assertEquals(1,       s.branches.length)
  assertEquals({a:2},   s.branches[0].residue)
  assertEquals(0,       s.getFocus())
  assertEquals({a:2},   s.residue())

  s.add({b:3}, 1)
  assertEquals(2,           s.branches.length, 'new branch')
  assertEquals({a:2},       s.branches[0].residue, 'old branch unchanged')
  assertEquals({a:1, b:3},  s.branches[1].residue, 'new branch')
  assertEquals(-1,          s.getFocus())
  assertEquals({a:1, b:3},  s.residue())

```

