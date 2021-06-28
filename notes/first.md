# The Simpaticore

## Introduction

Simpatico is a collection of software ideas.

Complexity is the key problem facing any programmer. We should seek the universal truths, a universal understanding of our craft, because as long as technological civilization lasts, there will be computers, and we humans will integrate them with our lives.

To me, a program is a reduction over input. Every state is the reduction of all input up to the last, all the way until back to the last _start_ event.

Now lets describe the most foundational part of Simpatico, the Core. The core is an object that defines the "add" operation that takes one argument, an object. The add operation integrates the new object with the core in the following way:

## Reduction validity

The reduction is well-defined everywhere on the tree. That means we can use this reduction inside the `add` function to determine whether or not to allow the addition. Later we will use reduction as context for integration, in particular to all the triggering of transitions.

The parent is associated with a residue, and this residue should be an object with one fixed part, an `add` function. But we expect this add to be highly parameterized, keeping reference to various transformations.

Now we are going to give ourselves a way to install functions inside residue, and to call them. It is very easy: we define an object calling convention, where the object contains the name of the function and arguments. Let's try it! This convention is enforced by the reducer.

## Functions - names or numbers?
When you're calling a function with this convention, what do you want to write?
You want to write myprogram.add({call: 'doFunAction', funArg1: 'Yeah!", funArg2: 34, });
myprogram.add({call: 'doFunAction', args:{funArg1: 'Yeah!", funArg2: 34}});

Generally, I like the more formal structure. But it does beg the question what, exactly are you wanting to put in that object other than arguments to that function? It seems to me that we need a very simple convention to distinguish between objects which are not function calls, and those that are. The presence of the "call" key is perfectly good, but there might be a better alternative.

The address-ability of a function is very important. We call a function within a residue a *handler*. It's address-ability is by *name* mainly as a nod to programmer usability. It should be a simple name, a short string of lowercase ASCII characters is probably best - I don't wnat to run into UTF8 encoding attacks or VM incompatibilities. The handler's job is to react to new input. That input can be something from the outside world, or a secondary reaction to input from the inside world. There exist *many* patterns of describing the wonderful, intricate dance from fingertip to bitflip. And Simpatico is just one of them, the most beautiful I can conceive of. 

A handler is a pure function that executes in the context in which it is called. We actually have to compute that context (or at least part of the context) in order to compute our output, which are object-diffs and object-calls. That is, a list of objects that can be interpreted either as state changes or function invocation. If we form a tree with these objects, we get what I call a *message cascade* - this is the resolution of call and diff objects, including the recursive processig in particular of call objects. 

Let's deal with a simple case first of a linear call chain. A calls B calls C. What does this look like? Well, you'd need 3 functions in the right place. So:
```js
S = {
						   residue: {value: 0},
	   functions: {
     a:()=>{{call: 'b'}},
     b:()=>{{call: 'c'}},
     c:()=>{{value: 1}}
   },
   add: (o)=>{
   			   if(o.call) {
         f = functions[o.call]; //lookup the function
        const result = f(residue, o); //invoke the function
        for each result{ //for each result process
           add(result);
        }
      } else {
        //this is the non call case
      }
      
   }
}

S.add({call: 'a'});
```


## Thanks

First, thanks to Codepen for putting together a front-end hacking tool that is convenient and pleasant to use.

I also want to thank the Mozilla Firefox team for building an amazing browser, and Google Chrome/Chromium team for building an amazing browser. Same to Apple and Microsoft! There are too many people and organizations to think for the amazing richness of front-end JavaScript development, more than I know about

