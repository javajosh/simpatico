<!--<!DOCTYPE html>
<head>
<title>Simpatico Kata: Proximity Coherence</title>
<link rel="stylesheet" href="/style.css">
<link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
    <rect width='1' height='1' fill='DodgerBlue' />
  </svg>"
/>
<link rel="stylesheet" href="./highlight.github.css">
<script type="module">
  import hljs from '/kata/highlight.min.js';
  import javascript from '/kata/highlight.javascript.min.js';
  hljs.registerLanguage('javascript', javascript);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el);
    });
  });
</script>
</head>-->

# Simpatico Kata: Proximity Coherence
"Proximity coherence" is a quality of a site that many web technologies are attempting to satisfy.
It is the quality of *consistency between resources*.

We often want to make two html files look similar, but allow them to differ in some way.
Most websites are like this: a repeated navigation (and hidden header) and unique content below.
One parent and many children "blend" to form the output.

Most of my career has been spent doing this blending at request time, on the server. It is done N times for N requests.
An SSG moves this blending to build time, on the server. It is done 1 time for N requests.
This is quite appealing!
In my view, the less power your templating system has, the better.
This is where I begin to differ with Hugo and Next.js (which btw I recommended only because it is the closest thing to a javascript SSG).


Let parent.html and child.html be pages that need to be *blended*.
We load the two strings from disk, call them parent and child.
Parsing html into DOM is a very common need in node, so I would add a parsing library.
Then I would write a function like this:

```html
<div id="foo">
  <p>This is a section</p>
  <p>It is a very nice section</p>
  <div id="bar">
    <p>This is a subsection</p>
  </div>
</div>
```

```js
const foo = document.getElementById('foo');
const obj = eltToObj(foo);
console.log(window.title, 'foo', foo, 'obj', obj);

function eltToObj(elt){
  const obj = {
    tagName: elt.tagName.toLowerCase(),
    children: [],
  };

  // Recurse through children
  for(var i = 0; i < elt.children.length; i++){
    obj.children.push(eltToObj(elt.children[i]))
  }

  // add the values of all attributes, prepending @
  for(var i = 0; i < elt.attributes.length; i++){
    var attr = elt.attributes[i]
    obj['@' + attr.name] = attr.value
  }

  return obj
}
```

(I'd need to check that this properly deals with head tags but I think it would).

Then I would load the strings from disk and combine the parent and child:

const parent = htmlToJson(parentDiv, {})

const child = htmlToJson(childDiv,{})

const result = jsonToHtml(combine(parent,  child))

Note that the order of parent and child on the last line is a critical design choice. You could go the other way, too.
In this case, though, we pick the case where the child specializes the parent.
This allows us to do very simple, implicit specialization, which is appropriate for head.
"I, being the child, accept all parent's choices, but override these."
(The other way is saying, "I, being the parent, will now modify the child to conform to parental standards.")
Ultimately, the greatest power lies with the last to act on the response, and it is most natural to leave that with the child.

For more complex cases, such as highly configurable navigation component, we can consider the parent as a library of functions that can be called by the child.
You "call" a function by writing html in a particular shape, which we get to specify.
Giving unique ids to all callable components seems reasonable.
Making it easy to call them (for example by simply supplying a structured string argument)
We pick a convention to allow use of combine()'s handler functions.

At the end of the day, this means you'd write your parent.html to include common head tags, and also define html functions that children can call.
A child calls an html function by targeting it by id and providing an argument, usually some JSON-like thing (I personally prefer object literal notation - fewer quotes).



## The simplest way: by hand.

Pros: Copying and pasting really frees you to make local modifications without worry.
This is perfect for rapid prototyping and exploration, especially when you don't yet now how much the front-matter wants to vary between resources.

Cons: If you change the 'standard' you have to go through your old work and update all other front-matter to be consistent.
Resources are no longer "whole" -- you've factored out front-matter which is no longer visible to the author.
This leads to the false impression of what the scope of the resource really is, and a reluctance of the author to modify the front-matter. It's "out-of-control DRY" (where DRY means "don't repeat yourself").
(When unchecked this enterprise software gridlock and lack of agency)


## A novel way: do it in the client with dynamic code.
We pick a very simple, very late-executing method of coherence:
  1. Pick a special resource name, say `site.js`.
  1. Every directory has 0 or 1 of these files.
  1. The DOM reads every `site.js` up to root in reverse order, skipping missing files.
  1. The DOM executes the script(s)

The simplest case is just one `site.js` at root which is executed by all resources.
This setup is mirrored by `style.css`.
Site.js is mostly going to consist of HTML template strings.
Head has already loaded, but it can be modified.
This solution very quickly segues into traditional templating.

Here is a possible design:
```html
<!-- not executed -->
<head></head>            <- reflector.genHead({article.slug}) <- headTemplate
<nav></nav>              <- reflector.genNav({blogSummary}) <- navTemplate
<article></article>      <- article.html -> chakadar -> reflector.extractSlug(articleString) && reflector.blogSummary
```

Here is a simple implementation:
```js
const head = slug => `${slug}`;
const nav = blogSummary => `${blogSummary}`;
const article = fileName => `${fileName}`;
const andSoOn = {};

//Fixtures
const slug = {
  author: 'jbr',
  date: '2023-3-17',
  title: 'Simpatico - What\'s new?',
  tags: ['release', 'reflector'],
};

const fileContentCache = {
  'file1': {content:'', slug:{}},
  'file2': {content:'', slug:{}},
  'file3': {content:'', slug:{}},
  'blog-1': {content:''},
  'blog-2': {content:''},
}
const extractSlugFromContent = (content, contentType='md') => {
  const regex = /\{[^{}]*\}/; // Regular expression to match object literals
  const match = str.match(regex);
};
const isArticleInBlog = (filePath, blogPath) => filePath.dirName() === blogPath.dirName();
const fileName = 'simpatico-whats-new.md';

// Meanwhile...

const result = [head(slug), nav(blogArticleSlugCache), article(fileName)].join('\n');
console.log(result)
```

Article changes invalidate both the fileCache entry and 2 blogCache entries (one for the file, and one for the blog to which it is associated).
The missing resource triggers a recompute.
For a missing blog resource, we reconstruct the whole thing.

Head and nav resource references should be root-relative.
Article references can be resource relative.

Consistency has 3 basic parts: look, behavior, and content.
Shared sub-resources can easily achieve consistency of look (css) and behavior (js).

# Historical Approaches

## Coherence with Server-side rendering (SSR)
Shared content is harder, and many ad hoc solutions have been attempted on the server:

  0. ssi - Server-side includes, a feature provided by httpd.
  1. cgi-bin - Apache httpd provided a way to take a request, put the parameters into the environment, execute an arbitrary process, and return the result to the browser. This is the earliest form of dynamic server-side rendering, and AFAIK is still in use at ebay today!
  2. mod_perl, mod_php - Processes don't scale (or didn't - should probably be looked at again given the Linux kernel's progress with process efficiency), so Apache http defined a module system that allowed in-process dynamic servers.
  3. java (servlet containers) - this ushered in the "thread-per-request" model. Fashion later abandoned the 'container' in preference for applications owning their `main()` (a good change). Note that "dependency injection" was a pattern invented to make up for java's lack of object literals (singletons).
  4. java (golden age: spring/jetty; dropwizard) - requests can share OS threads using virtual threads. Project Loom will allow programming vThreads just like os threads.

Note: similar shapes exist in the other webapp ecosystems in every popular langauge, e.g. python, ruby, and node.

Most of these innovations have to do with *scale*.
The underlying requirement, that of proximity coherence (and in general to reduce repetative tasks), remains unchanged.

## Coherence on the Client with Single-Page Applications: SPA
After the world realized that XHR could be used to construct single page applications (SPA), another method of achieving proximity coherence was discovered!
In this case, we reify the browser, and treat the initial page load as "stateful", and all subsequent page loads as replacing a part of the page.
In theory this is the most efficient, and most flexible/powerful method of achieving proximity coherence because you're deferring processing until very late.
The big drawback is that clients require javascript to construct a usable interface.
It also adds complexity if you ALSO want/need SSR (which was/is the case when web crawlers cannot execute javascript, or you don't want your users to suffer a flash of unstyled content (FOUC)).

## Coherence in a script with Static Site Generators: SSG
People realized that the simplest expression of proximity coherence (and hence the best) is a one-shot script that takes content as input and generates a coherent site.
Examples include Hugo and Jekyll.
This is a local (perhaps global) minima of computational effort for coherence.
The output is extremely cheap to host since it has no dynamism and requires no specialized process.
Works well for infrequently updated content like a blog or a marketing website.

## Future: Coherence with AI

### SSG
AI could be plugged into any of these methods, a conservative use is with SSG.
An AI could *be* your SSG script - here is the psuedo-code:

```html
blogMapper = ai('convert this markdown into html; add enough html to make the output look like part of a very cool looking blog')
inputFileNames = *.md
inputStrings = readFiles(inputFileNames)
outputStrings = inputStrings.map(blogMapper)
outputStrings.each(str => writeFile(str, filename.html)
```
It does however capture the "curry lite" notion of baking in the prompt *once* before mapping.
It's too high-level, I don't think this is enough for an LLM to succeed.

### Late executing coherence
In this scenario, a process is running on the client, with separate state, and imposes its own coherence on the site.
Of particular interest is possibility of decoupling of the coherence from the site itself.
This means that coherence can be imposed on multiple sites.
It's similar to a user style sheet, but more comprehensive.
It becomes *your* web.

This may or may not involve AI. They are orthogonal issues: Where in the stack the process executes; the character of the process.

The three downsides of very late-executing coherence:
   1.

## Coherence with concatenation
Instead of serving the requested resource directly, we prepend the site template first.
If we build the site from scratch, we can pick a convention that is quite minimal.
HTML 5 supports omitting wrapping `head` and `body` tags, meaning we can do simple concatenation.

We could design a preamble for every page in our site: the strings that come before the content.
This string could setup sub-resources, titles, and then the content simply concatenates.
HTML 5 allows omitting both `head` and `body` elements, perhaps anticipating this use-case.
In fact, I wouldn't be surprised if this isn't exactly how SSG's work.

What is a minimal SSG?

We can define a "template.html" file which contains all the coherence.
Our content can be called "1.html", "2.html" and the server will prepend the template.
The only small thing we need is to parameterize the template to take an object derived from the posts.
We need to define a convention to get optional structured data out of our post and into the template function.

```js
const templateNameString = 'template.html';
const templateString = '<head><meta id=slug data-author=jbr data-date=2023-3-27 tags="nice"'
const handle = (req, res) => {
    fileNameString = getFileNameString(req);
    fileString = getFileString(fileNameString);
    res.write
}
function interpolateTemplate(templateString, slug){

}
function extractSlug(postString){

}
```

