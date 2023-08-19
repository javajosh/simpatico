Simptico is a collection of three software ideas which form what I hope is an amazing developer experience. Those three ideas are dynamic combination, the world-event tree (or Rehman tree), and collapse. As we go over each of these ideas and then in combination, we'll touch on the values and goals of the overall project.

The audience is either advanced programmers or mathemeticians with an interest in programming.

## Dynamic Combination

### An Aside about my history Data-Modeling
Data-modeling has always been a passion of mine. I know it sounds wierd, but when I got my real start (as opposed to the true start, which was Logo) with programming it was building software for my parents small business with FoxPro. I was a teenager and relational databases impressed me from the very beginning, and I found the challenge of modeling the data problem to be one of my favorites. This interest in databases continued into my early career building applications in Access, which was a wonderful program!

Later, I was lured by the siren call of OOP in general, ORMs and the Domain Model pattern in particular (in the context of Java webapps circa 2005), but this infatuation was very brief. Clearly something was wrong. The "domain model" was often nothing more than an empty shell (I called it the "anemic domain model"). It really bothered me that the architects of the time (and now) felt the need to add so many steps between the screen and the database operation. Each step was not only verbose boilerplate, but it was a place where transformation code could lurk. I'm not against transformation at all, but I am against giving people 10 places to transform!

Of particular concern to me at this time was the simple fact that we'd not only duplicate the data-model in 10 places, but we'd duplicate validation logic in at least 3 places. A very real, persistent and worsening cost of this architecture was the ossification of the data-model. Mind you this was ossification within the context of a single application; and in general multiple applications were written over the database (this was pre-microservices). The first stirrings of what would become Simpatico began with my thoughts about the data-structure/validation duplication problem!

Around 2008 or so I realized that we enterprise programmers weren't modelling the world, we were modelling paperwork. This insight was a bit deflating at first, but because it's truth was obvious, it allowed me to at least exist more comfortably in this world of verbose, frankly bad architecture. I invented a way of modelling and thinking about problems using JSON notation that I still use today. My fondness for nice, simple *chunky* objects was now added to my fondness for sound relation design. It was around this time that my first ideas about generalized collapse began (although at that time I thought of it as UDL, or "Universal Data Language").

### An aside about the browser

It was also around this time I started taking the browser more seriously. I'd been writing Java webapps for sometime, and had done my best to avoid actually learning JavaScript. I'd been a GWT early adopter, and used many JSP libraries liberally to avoid really knowing anything about the DOM. But one day I decided to ditch Eclipse for an afternoon and try hacking a web-page from scratch. MDN didn't exist yet, but I could at least look at the source of good web pages for help. I was still afraid of raw JavaScript, so I used jQuery a lot, but I learned HTML, CSS and jQuery/JS. Although I don't think there was a strong distinction in my mind between JS and jQuery for a couple of years, if I'm being honest.

The thing that impressed me the most about the browser were three-fold. I loved how "low entropy" the data-structures were! Pure functions and object literals were awesome, and totally foreign to me as a VBA/Java programmer. But it was also disorienting, because the entire process of writing code, and learning how to write code, was so different. There were no manuals, no specifications, no IDEs. Just you, your browser, your editor, and the web. The browser was (and is, I think) a wierd combination of very low level tools (functions, the DOM), very high level tools (CSS, layout), and very wierd runtime characteristics (sub resource loading, layout, etc.). And this is true even 10 years later, that the web is a moving target.

In any event, learning the browser opened up several new ways of thinking about software for me. For the first time, I saw an environment in which my most ambitious ideas could actually come to life!

Everyone else seemed to have the same inspiration, and a veritable cambrian explosion of libraries, frameworks, languages, and tools began in the browser universe then and really hasn't stopped since. I've watched both hopefully and anxiously these ideas be released, take hold, and often fade away. The most successful ones, and the most durable ones, deserve mention. Ruby on Rails. Chrome. React. Redux. Bootstrap. WebSockets. Node. Lodash.

Some deserve mention because they aren't really popular, but are very cool. Elm. Flow. Others deserve mention because they failed. Angular. GWT. Meteor.

Of particular importance to the story of modern web development is Node. Node's great value was allowing JavaScript computation to occur out of the browser, and in particular, to pre-process resources. It turns out that a) people really wanted to do compilation-like transforms, and b)it's more efficient to do these transforms once, ahead of time, not in the browser. However, this capability has come at considerable cost! Not only are our development systems harder to setup and understand (with all the requisite risks), but the idea that you can learn anything from a public website is now laughable. The resources have been processed to the point of unreadability. The browser itself has been pushed so far away from it's roots as a renderer of hyperlinked documents that its source is totally unrecognizable, and unusable by newcomers to the platform.

Node also opened up the possibility of the "isomorphic" application, where the same langauge (and the same libraries) could be used both server- and client-side. It's also notable because it comes with a very good module system.

HTML5, CSS3 and ES6 also came out, and were great standards 100% supported everywhere except IE (11).

### An aside about causal chains, and simultaneity of code change.

The importance of computers as physical objects, and software as describing a physical system cannot be overemphasized. One pattern that I identified from my Java days was how you'd have to alter code in several widely seperated locations in order to keep the system running. So you, as a programmer who can only do one thing at a time, are forced to move your program through invalid states! This might seem like a minor thing, since you're commiting the valid state, but I think that's short-sighted. What if you were never put in that position? How cool would that be? Also, I think this is an architecural code smell. If we think about everything as a single simple causal chain it restores to us the ability to slow things down and observe the causal chain directly. It allows the system to be self-describing, rather than relying on developer knowledge to satisfy the demands of intra-system coupling.



### Games and the possibilities of data-modeling.

What lies beyond modeling paperwork? What is paperwork, really? It turns out that the paperwork you get is a kind of passive sensor. Each field wants a value. Part of why paperwork is so painful is that a) you might not want to share those values, and b) you might not know what they are or where to find them! But underneath the paperwork is always some kind of state-machine. In particular, it's a state-machine that you're trying to create, or which  exists in some state of *decay*. So, paperwork is used to create, destroy, and maintain the state-machine. It's interesting to me that modern society exists largely as information encoded in these machines, and that these machines are often tightly coupled, and problems with one can cause problems in others. Because of the scale of the populations managed by these machines, and the impersonal nature of beauruacracy itself, exceptional cases can linger for months or years, and a person caught in such a web is often quite crippled!

Rather than deal with paperwork, lets talk about games. A game is a state-machine that is advanced by moves. Moves can be modelled like paperwork - a move is a filled in form. The form is a set of rules, or patterns, and filling out the form can be thought of as a process of *collapse*.


```js
{
	id: 0,
	name: 'Josh',
	alive: true,
	registered: 1545472168695,
	dog: {
		name: 'Julian',
		born: 1545454000000,
		goodDog: true
	}
}
```


## World-Event Tree (Rehman Tree)

The World-Event Tree, or more generally, Rehman Tree (since it can be used for more than World event), is an interesting data-structure that evolved after generalized combine to deal with the problem of collections. Later I realized it could be used for specialization and instantiation, and in fact provides a profoundly general characterization of "zoom" for an application. Also of interest is that the design of the Rehman Tree happened in combination with it's visualization as part of the coherent Simpatico system.

Imagine you have an array of 10 objects. One Rehman tree might be this:
```
  0 1 2 4 - a
2 3 5 6 8 - b
2 7       - c
0 9       - d*
```

This is the tree you get from the sequence `0 1 2 -2 3 a 4 b 5 6 -2 7 b 8 -0 9`. In this sequence, all positive numbers are ascending. Negative numbers start a new row with the parent set to the abs val of the number, so the number of rows is the number of negatives plus one (since you always have at last one row). Letters *select* a row such that the next number is added to it. Positive numbers are appended to the current row. In the layout above the first and last columns are reserved - the first column for "parent" ids, and the last column for "branch tips". The asterisk indicates the current row (which is easy to compute because it's always the row of the highest integer)

The Rehman tree is based on an n-ary tree. Each node is associated with a list of nodes back to root. This list can be computed by moving left until you reach the first column, then jumping to the parent node, and repeating these two steps you reach root.

Each node is then representative of a unique, but related sequence of nodes. We can then compute a reduction over each node. In general our reduction is not commutative, so we have to reverse the list before computing a reduction An important reduction is associated with the letters - these name the reduction associated with the last node in that row.

Of particular interest in Simpatico is when the reduction is over dynamic combine, and when the reduction is a collapsible pattern.

Another variant is when the reduction is reversible, allowing us to compute nearby points relatively cheaply.

Last but not least, notice that a Rehman tree can be constructed from a sequence. This implies that a Rehman tree can itself be considered to be a single branch of a higher level tree, where it is itslf the product of a particular reduction over that sequence. This is a very powerful and interesting property which Simpatico uses, but very sparingly and with respect since it's a bit mind blowing in my opinion.

What good is this tree, how can it be used to make software? Well, intuitively I think of the Rehman tree as an organizer of input to a program. Input can be targeted to a row, changing the state of the reduction associated with that row (which I call a residue) or to a node forming a new row (and a new residue). One way to interpret this is that every row is a specialization of the empty object at root. It's a subset of the space of all possible objects, where the space is not arbitrary but favors closely related objects (that share history). Although the data structure is quite general, a lot of expressivity is captured in the way you use it, so let's look at some examples.

This is an example dear to me because it describes a fairly general simpaticore:

handlers
	h1 1 2 3 4
	h2 5 6 7 8 9
	h3 10 12 13
types
	t1 h1 h2
	t2 h1 h3
t1
	i1 14 15 17
	i2 16 18 21
t2
	i1 19 20

So in this tree I've used a slightly different, less general notation. This core defines 3 ahndlers, and 2 types, with 2 instances of one type and 1 instance of the other type. An interesting feature of this tree is that I've used the residue of one row as the input to another row, e.g. h1 h2 and h3 are used as inputs to the types. Note that this isn't quite accurate since a 'type' is composed of specific concrete handlers; it's purely a notational convenience, in this case referring to h1 as it appears after message 4, for example. The developer will create the handlers, types, and then the end user will provide the steady-state input. This structure allows for the interleaving of developer and user activity in a way that is, to my knowledge, totally unique, such that a developer can define new type versions at runtime who's instances exist simultaneously with the old versions, and migration is optional.

(It's natural to wonder about whether or not this structure allows for composition in any meaningful way, in other words whether you can have an instance composed of other instances, in some sense.)

Here's a chess game sketched out in this style. These are just types
Instantiate the board. Setup is instantiating each piece in turn and adding them until the board rejects. Other state that might be useful to store with each piece are blocks and pins.

chess
	board
		position
		checkmate
		coin
		clock
		grave
	piece - side
		king
			dir
			no thru check
			castle
			concede
			offer draw
		queen
			dir
		rook
			dir
			castle
		bishop
			dir
		knight
			dir
		pawn
			move 1 - one space
			move 2 - two spaces
			move 3 - capture
			en passant - capture
			promote








## Collapse



## Business

The history of technology can be seen as branches on the largest scale world-event tree. New languages form, projects begin using that language; the developer community learns, and (usually) moves on. This pattern cannot continue forever or else software practice becomes needlessly dynamic, moving according to the whims of technical fashion. Ideally, we will find a global minima of complexity that achieves our software goals, and whoever finds that will become the next tech giant.

Against this backdrop is the obvious problem of growing income inequality. This is the easier problem to solve personally - without throwing out capitalism entirely (which is very good at allocating resources, in normal circumstances) we agree to an "Enough Number" before embarking on a world-changing endeavor. This is the number of dollars which, after we earn them (after taxes) we agree to retire and allow someone else to take our place. Further, we agree to not work for money again (it is, however, okay to work).

The great opporunity I see is the one that displaces the large tech giants to some extent. While their revenue model is advertiser driven surveillence, our revenue model will be something simpler: we make the marketplace, and the tools to produce items in the marketplace, and every thing is free except for transactions. Transactions on the system trigger small fees, like 1% or less. This revenue is used to pay for overhead (which, with the proper architecture, should be minimal). The system depends, then, on high volume to be successful.

Applications are usually composed of third-party libraries, and those libraries automatically get a share of revenue.

Note that revenue for a digital good is proportional to usage. But it's so small that it shouldn't matter to actual usage. Indeed, I'd like to drive toward a model where users pay a small subscription fee to get "all you can eat".

Platform maintainers are special, have a special amount of trust, and there is one small team per continent. Legal and privacy issues may prevent the platform from being deployed in full in certain places (e.g. China, Australia). These would be the primary beneficiaries of profit.

If the product is as good as I believe it would be, it would first spead through the developer community, without marketing. CodePen is a good example of such a business. It would be used as a sandbox, a playground, for building out prototypes. Later, people would start using it for real applications. The easy distributed nature of Simpatico makes it very appealing for people who don't want to be locked into the platform! (Note that the transaction exception would still be in place for the license. I anticipate a great deal of pushback on this, and I'd be happy to have that debate, perhaps on Kialo so that we don't repeat ourselves over time.)

Of particular interest to this business story is Meteor, the Andreseen Horowitz funded SF startup that hasn't done very well.

## The Developer Experience

The best developer experience is grounded in the fundamentals. There are two good starting points: from a text editor, file system, and interpreter (browser), or from CodePen (which should be considered a name for any web-hosted IDE). It might seem surprising to treat CodePen as a system with good fundamentals, but it's power is in it's simplicity. The *idea* that your program is composed of resources combined at runtime is present in CodePen. It's big drawback (which is substantial) is that it's not usable offline, and because it's not really a filesystem, it's not possible to use version control.

### An aside about the proper fundamentals

The idea of *subresource combination at runtime* is present in Java and Node, and also the browser via the rarely used ES6 module system. The original mental model, the imperitive one, is that your program is a sequence of lines, executed in order.

Compilers and interpreters are closely related because they both take text files and make them executable. The compiler does the converion to machine-level binary once. The interpreter does it on every invocation. In the 1+N universe that we live in, your application invocation is also special in that it only sets up for the steady-state N invocations. During this special setup pass, most (if not all) of your requirements should be resolved. (It is possible in some module systems for module load to be deferred for an arbitarily long time.)

So, invoking your application consists of a single function invocation, something like `start()`. But where do you get this function? You will get it from a global object added to the browser by a sub-resource. The global object has a unique name and exposes a `start()` function. The subresource will have import statements making reference to other modules that expose other objects to the module, and these references are resolved transitively (they may even be resolved statically in some cases, I don't know).

(A path not taken. One path that is clever and useful but not the proper one for us, is the exposure of your application as a function where all state is kept as a closure around a set of functions. Let's call this the application factory pattern, and it is quite useful to understand if you're doing "ordinary" JavaScript programming. It offers a lot of benefits, in particular making it hard for users to modify internal state. We will prefer the simpler, immediate, sadly mutable form.)

### Okay lets continue
Let's assume the best case, which is a good programmer whos looking to experiment with Simpatico locally in the minimalist way. It means she has a single HTML file, and she'll be looking to add the Simpatico library, and start using it. So she `wget`s the file, adds a script tag. Knowing the friendly function convention, she would load the page and open a console, and type S.add(). This will return a description of what she can enter. It also has the side effect of *starting* the Simpatico process - it is equivalent to doing S.add(S.START) and then S.add().

At this point it would be useful to explore `combine()`.

What I want to program JavaScript in the browser:
1 - A native ES6 and import statement.
2 - A library for predicates and assertions.
3 - A generalized combine function.
4 - A Rehman tree implementation.
5 - A pattern/collapse library (depends on 1,2)

Moreover, each of these objects should come with a simple HTML file that exercises it's functionality. In fact, we can best express a test as a Rehman tree of inputs, where success is reachability to every part of the tree. In it's simplest form, then, the HTML file is a one-shot program who's tension is hydrating a Rehman tree.




