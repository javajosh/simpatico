# Simpatico

## Preface

These notes were written in the middle of my journey, trying to describe what it is that I was doing and why it matters. There is some good raw material here, but it's in primordeal form.

## Introduction

There is a certain class of statements and questions which are very easy to recite but which have extraordinarily deep ad important implications. "For every action there is a reaction" (e.g. the law of karma), and "What is a program?".

It is annoying to me when people give pat answers like "Everything is just ones and zeroes". I do not blame Alan Turing for this, but his name is most closely associated with this degenerate answer. For those with an (even more) erudite flare, "Everything is just functions", referencing Church's lamda calculus, is an equivalent statement. This kind of statement is true as far as it goes, but it is only true at the extreme *level of zoom*, which is not particularly useful in describing real programs. In fact, it is precisely as useful to describe a program in this way as it is to describe a living organism as "just a collection of cells", or even worse, "just a collection of atoms". These statements are all greatly improved with the elimination of the arrogant and annoying "just" but they are still pretty useless.

[[Zooming is important enough to me that I suppose it deserves an aside. Zooming in and out is a fundamental operation that one can use both concretely and metaphorically to understand phenomena. Related is E. Wilson's notion of concilience.]]

A far more useful starting point, and one which I'm pleased to say that I stumbled upon myself some years ago, is to recognize that a program is an inert thing that only reacts to input. More succinctly, *a program is state that reacts to input*. This, too, is one of those profound statements, and it is dangerously close to being useless, so let's talk some more about it to drag it back from the precipice.

Ultimately, software is a physical phenomena like anything else. Software operates by moving around electrons, or rather, moving around extremely small quantities of energy that can be measured efficiently. Software is successful not because it is magic (every computation that can be done by a chip can be done by a macroscopic mechanism too!) but because the scale and speed of these utterly ordinary *causal chains* of physical action, writ small in the language of electronics in general, and transistors in particular.

It makes sense, then, to talk about software in the context of a real, physical device. Or, at least, the simplest abstract device that makes sense. (As far as I know, I stumbled on this idea, too.) This is path one.

Another path, one that is more practical and might appeal more to the "show me the code!" type programmer, is the Tiny Architecture path. This is path two.

And because I loved Choose Your Own Adventure books as a kid, you get to choose. (The web is the perfect medium for this style of story-telling. I wonder why it isn't used that way more often?)

## Path One: The Bitmap Computer

The bitmap computer is an abstraction I've found useful over the years. In physical form it is like a tablet that has a single button on it. The display is square grid of, say, 8x8 pixels that can each be turned black wth a touch.

I've never been very good at suspensful story telling, so let me just tell you what all this is. The button is the "start" button. So if you enter in a meaningful binary sequence, you can get some interesting output. For example, if you know the instruction for "add" and know how to represent numbers then you have a calculator! (If you don't know these things then you still have a pretty cool etch-a-sketch).

I'd like to give myself credit for realizing that you can define an instruction set any way you like, including with simple pictographs. So, taking a page out of Knuth and defining a fake, simple, idealized instruction set for pedogical purposes, I did that with 8x8 pictographs.

(One important point, which has surprisingly profound implications (as usual) is that the human finger is really fat, and can only flip one bit at a time. So, our tablet needs to support zooming in and out! This, in turn, adds some (in my view, undesirable) degrees-of-freedom to our abstract tablet. E.g. it would be awesome to imaging a human with a microscope and a needle flipping bits, it would make the device a lot simpler. But instead (and in a way that is more true to life!) we incorporate the microscope into the device itself. This implies some level of virtualization which I wante to avoid for it's complexity. It also brings up uncomfortable questions about size limits. Well, lets just say that the virtual space available is 2^64 per side!)

Anyway, I would think the obvious first thing you'd want to do is build a working virtual keyboard to avoid entering data in binary. This itself is a pretty sophisticated thing to produce, but is itself an interesting exercise. Then you'd work your way up to build analogs to all the other nice things you want (but don't get) like easy access to previously produced programs (while you have plenty of space, finding things on a single sprawling surface is going to get very difficult very fast).

[[Insert working bitmap computer here]]


## Path Two: Architecture-in-the-small

So, full confession, I really like software architectures. "Software architecture" occupies that interesting middle-ground between too abstract (Turing Machines) and too concrete (real apps).

I believe that architure is best explored in code, and with a bare minimum of code. In a way, this kind of code is just like those deep utterances in the introduction: very easy to write, but difficult to understand the implications. But the brevity of representation is useful if we are to compare architectures and their variants, perhaps even inching toward a *comparative taxonomy of software architecture*. (And in fact, a pet peeve of mine is how a simple decision in the primordial code always gets a fancy name. I am not a fan of fancy names, and in fact find that they a) intimidate good-hearted newbies and b) inflate the egos of bad-hearted newbies.)

Let's start with this architectural pattern, one of my favorites:

```
function handle(event) {
	state = combine(state, event);
	render(state);
}
```

I am tempted to justify my use of JavaScript against the haters, but I will resist speaking to that audience. However, it's still worth a small note about it. JavaScript runs on more devices on the planet than anything else; it's got first-class functions; it's dynamic and not static (which is useful for code like this). For brevity, ubiquity and power you can't beat JavaScript! (And I am a real fan of ES6 variant). Anyway this code is simple enough that the language doens't matter that much. (FWIW my second choice would be Python.)) Oh yeah, the fact that JS is used on the front-end, and on the back-end, means that people should be less inclined to think of this as front- or back-end specific code!

`handle()` computes a new state and renders it. Clearly this function will not stand on it's own. It needs a state that survives the function call, it also needs `combine()` and `render()` definitions, and it needs to be "plugged in" to some source of events. (Of course, it also omits the actual event loop, which is hidden in most programming environments anyway.)

The value of this code is that it shows clearly that a) nothing happens unless an event comes in and b) our program state is always computed by combining a new input with our old state. Something that is implied, not universal, but nice to have, is the implied immutability of state. `combine()` doesn't have to modify it's arguments to be effective, it can return an entirely new state, which in turn makes certain operations possible and generally makes the program easier to read about. But immutability is an opinion, and not a universal here.

Note also that `combine()` has the nature of a `reduce()` function, because it takes two inputs and returns just one. The second input is *integrated* and (in the general case) lost. (The input doesn't actually have to be lost, and I think in many applications it shouldn't be lost, but rather tucked away into some handy part of program state).


