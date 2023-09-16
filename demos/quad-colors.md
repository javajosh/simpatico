# Simpaticode: quad colors
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md),

A small app that lets the user first create colors.
We divide the screen by four and ask for 4 selections that coorespond, by convention to:
1. Mental state
2. Bodily state
3. Financial state
4. Moral state

Furthermore we subdivide these arbitrarily.
Bodily state doesn't neatly split into 4, so that's a weakness.
Same with mind.
However, we know mathematically we could, if so constrained, divide any long list of things this way.
But is it worth it?
Oddly, i think it's a question that you can't answer without trying.
If it is the work of an afternoon, it sounds rather pleasant and worth doing.

![quadtree](quad.png =200x200)

The body divided into four coorresponds with the limbs.
It would make more sense to divide it into "system".
Divisions of this type are ultimately for convenience of the user.
The other thing is that you can always divide twice and get 16 new cells.
The new cells, but the way, take the place of the parent, adopting its color.
At the very least it would be a novel way to paint.

Parent child relationship like this is "built" from the parent, and in this case 4 covering kids.
Because they are covering, they detect click events and react in the same manner.
We can achieve this effect by:
1. Placing the "children" inside the g of the parent, but after the parent element itself.
2. Each child is a clone of the parent wrapped in a new g that is has one of 4 classes, N,S,E,W or q0, q1, q2, q3 if you prefer classic quadrants, moving counter-clockwise; associated with a common scale and 1 of 4 static transforms.

A click could mean "split" if we want to make it easy to go deep.
Then we need a way to pick new colors.
The simplest case is the monotonic, non-zooming case.
Monotonic in the sense that, once clicked, the color cannot be changed.
We might imagine that the pieces are translucent, hyper-realistic pieces of bakelite.
Stacked on top of the parent.
The scene starts with one parent, white.
You click on it and you get 4 children, all white. All seemless. You might thing nothing has happened.
This is mathematically best but also a usability problem.
So we impose a small border to make it a mosaic.
This border should scale appropriately.

```js

```
