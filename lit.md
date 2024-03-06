# Literate Markdown
2024

Make markdown come alive as easily authorable, executable, communicative resources you edit with your favorite tools.

See also
[litmd online](https://simpatico.io/litmd.md),
[reflector](/reflector.md),
[other literate programming tools](http://literateprogramming.com)

[![Aperiodic tile with one tile](/img/aperiodic-green.svg =500x500)](https://arxiv.org/abs/2303.10798)

HTML will always be the primary authoring tool.
But it is difficult to write *about* code in HTML.
One needs to HTML escape the code, which makes the code unreadable and unmaintainable.
We need a way to write about code in a way that is readable and maintainable.

To that end I've added basic litmd support to the [reflector](/reflector.js).

  - [x] Custom headers per litmd file (support for <head> in litmd)
  - [x] js code samples execute
  - [x] js code samples render with syntax highlighting, esp for html, js, css
  - [x] do the same for html, esp svg
  - [x] header section doesn't render on github

**WARNING**:
Pages render but do not execute properly on Github.
______________________________________________________________
## Markdown test

```md
~~This is a test strikethrough~~
*This is a test italic*
**This is a test bold**
_____________________________________
| Item         | Price | # In stock |
|--------------|:-----:|-----------:|
| Juicy Apples |  1.99 |        739 |
| Bananas      |  1.89 |          6 |
```

To get images that work on github, either crop the image or use html.

```md
![alt text](img url =widthxheight)

```

## A note about fonts
Only browser built-in fonts, to avoid the download cost, the compute cost, and [minimize surface area for threats](https://news.ycombinator.com/item?id=39612484#39618368).
______________________________________________________________
## Inline code tests

### HTML snippets render
```html
<div id="test-div">
  <p>This is a test div1</p>
</div>
```


### CSS snippets render
CSS rules applied to `test-div` above:

```css
#test-div {
  font-family: sans-serif;
  font-weight: bold;
  font-style: italic;
  border: 1px solid black;
  margin: 50px;
}
```
Note: [CSS is logical!](https://geoffgraham.me/css-is-logical/)

## Javascript 'renders':
```js
console.log('hello world');
```

______________________________________________________________
## Code doesn't execute when you start with a special comment:

Code doesn't execute when they start with special textual signals:
1. html  `<!---`
2. css   `/***`
3. js    `///`
3. md    `###`

### HTML doesn't execute:

```html
<!--- Opening with an html comment prevents the snippet from executing -->
<div id="test-div2">This is a test div2</div>
```
Make sure it didn't execute:
```js
if (document.getElementById('test-div2') !== null) throw 'test-div2 should not exist';
```

### CSS doesn't execute:

```css
/*** Doesn't execute */
#test-div2 {
  font-family: serif;
  font-weight: normal;
  font-style: normal;
}
```
Make sure it didn't execute:
```js
// Check the CSS DOM for the existence of a rule that should not exist
function findCSSRule(predicate, document, defaultResult=null){
  const styleSheets = document.styleSheets;
  for (let i = 0; i < styleSheets.length; i++) {
    let rules = styleSheets[i].cssRules;
    for (let j = 0; j < rules.length; j++) {
      if (predicate(rules[j])) {
        return(rules[j]);
      }
    }
  }
  return defaultResult;
}
const predicate = (rule) => rule.selectorText === '#test-div2';
assertEquals(null, findCSSRule(predicate, window.document),'css rule #test-div2 should not exist');
```

An aside - what do you think of this more functional implementation of the above function:
```js
function findCSSRule(selectorText, document=document) {
  return Array.from(document.styleSheets)
    .flatMap(sheet => Array.from(sheet.cssRules))
    .find((rule) => rule.selectorText === selectorText);
}
```
(I think it looks pretty and sleek and clever.
But the first one is easier to understand and debug.)

### JavaScript doesn't execute:
```js
/// does not execute
window.hello = 1;
```
Make sure it doesn't execute:
```js
assertEquals(undefined, window.hello, 'window.hello should not exist');

```

### Markdown doesn't execute:
```md
### Don't execute this
_____________________________________
| Item         | Price | # In stock |
|--------------|:-----:|-----------:|
| Juicy Apples |  1.99 |        739 |
| Bananas      |  1.89 |          6 |
```
______________________________________________________________
## JavaScript default imports
In this test we have a custom import that conflicts with the default imports.
That itself should fail.

In `litmd.js` you have `markdownDefaultImports` currently set to:

```js
///
import {assertEquals, assertThrows} from "/core.js";
import {combine, assertHandler, logHandler} from "/Users/alber/IdeaProjects/simpatico/combine.js";
import {stree} from "/stree2.js";

const etc = []; // stupid, yes. but funny, [...etc]
```

Note that imports will collide and fail.
This expression will fail, although we can't easily test it in the browser:
```js
///
import {stree} from "/stree2.js";
```

We *can* automatically test the `import()` function:

```js
import('stree').then((module) => {
  throw 'test failed, should not have been able to load stree';
}).catch((e) => {
  console.log('test passed, could not load stree');
});
```

______________________________________________________________
## SVG renders with syntax highlighting:
SVG source render (and authors) correctly:

```html
<svg id="rotating-squares-animation"
class="natural-units example-block"
width="200px" height="200px"
viewBox="-1 -1 2 2"
style="background-color: #eee;"
>
  <desc>Two squares moving around the unit circle and rotating, too, plus constantly changing text.</desc>
  <g transform="scale(1,-1)">
    <g id="green-square"  transform="translate(0,0)"  ><rect width=".2" height=".2" fill="#482" /></g>
    <g id="yellow-square" transform="translate(.1,.1)"><rect width=".2" height=".2" fill="#882" /></g>
    <g id="unit-circle"   transform="translate(0 ,0 )"><circle class='unit-circle' r="1" fill="none" stroke="red" stroke-width=".001 "/></g>
    <g id="some-text"     transform="translate(0,0)scale(.01,-.01)"><text>Scale and (re)flip text</text></g>
  </g>
</svg>
```

```css
.example-block {
  border: 1px solid black;
  margin: 50px;
}
```

______________________________________________________________
# Libraries

## Showdown.js Library
[Showdown.js](https://showdownjs.com/) is a seldom updated, single file 156kb javascript library that converts litmd strings into html strings.
I've imported it manually, and modified slightly, and executes only server-side.
I've had to learn a bit about this library to write an extension that executes javascript code samples.
Note that this library is *only* included on the server side, and it's output is cached until the underlying litmd changes. (Efficient file-watching courtesy of [Chokidar](), a part of the excellent Brunch front-end build system).
Most of the learning curve of the library is selecting options.
The most common thing to change are the default imports inserted as a convenience before code samples.

An alternative to showdown is [marked](https://marked.js.org/), which is a 10kb javascript library that converts markdown strings into html strings. Or even [markdown-it](https://markdown-it.github.io/), which is a 20kb javascript library that converts markdown strings into html strings. Both of these are probably better options.

## Highlight JS Library
[Highlightjs](https://highlightjs.org/) is a (relatively) small 140kb javascript and css library that syntax highlights source code found in the DOM.
It runs on the client side.
It's much smaller and simpler than [prettier](https://github.com/googlearchive/code-prettify) (now archived).

Find styles with the [highlightjs demo](https://highlightjs.org/static/demo/).
Then statically download the assets you want.

```bash
curl -O
```

______________________________________________________________
# Discussion

## Why not HTML?

Writing about program source code is annoying in raw HTML.
The need to use both special tags like `<pre>`.
The need to HTML escape the source, which makes it unreadable.
IntelliJ builds code folding in naturally using only normal headings.
(In HTML you have to separate the source with `<div>`s if you want code folding.)
The convenience of using litmd to specify software components is already proven with the `.mdx` format, which is litmd + jsx.

## Why not Markdown?

The library is very large - Showdown.js is 156KB.
It has no dependencies, but such a large codebase is bound to have issues, and the benefit of using it is, at first glance, not very high.
IntelliJ's litmd editor definitely doesn't like me adding actual javascript or raw html.

Two authoring issues with IntelliJ IDEA, one syntax highlighting issue, only fixed with a [huge dependency](https://highlightjs.readthedocs.io/en/latest/readme.html).
A good reason to reconsider raw html, requiring the reader to view source.


# Literate Markdown
Literate Markdown is dialect of markdown that allows you to embed code snippets in your markdown that execute when the html is rendered.
This is a great way to write documentation that is both human and machine-readable.
The reflector uses this technique to serve up the documentation for simpatico.

## How it works
  1. On the server, in [reflector](/reflector.md) litmd is converted to html and javascript.
  2. The html is served to the client.
  3. The client both displays and executes the javascript in the html.
  4. The javascript is written in an `assert` style that throws exceptions when it fails.
  5. Another library, [testable](/testable.js) catches these exceptions and displays them in the browser using background and favicon colors.

Literate Markdown adds extra support for JavaScript code execution:
  1. custom head
  2. add default imports to executed code snippets (which can be overridden by your own imports)
  3. add syntax highlighting to displayed code snippets with [highlight.js](https://highlightjs.readthedocs.io/en/latest/readme.html#basic-usage).

## Concerns
  - The highlight library is shipped to the client is large (~150KB minified) and does not support [line numbers](https://highlightjs.readthedocs.io/en/latest/line-numbers.html)
  - The line numbers in browser errors no longer line up exactly like they do in raw HTML.
  - The markdown processing requires another 150KB library (showdown.js) ton the server, plus non-trivial code in reflector.js.
  - It is a great nutshell example of the siren allure of using markdown/litmd for everything - but that's 300KB of complexity for functionality you get for 0 with F12!

## About Literate Programming
Literate programming is a programming paradigm introduced by Donald Knuth in 1984. It emphasizes the importance of human-readable explanations alongside the source code. The goal is to treat software programs as works of literature that can be understood by both humans and machines. This approach enables developers to create more understandable, maintainable, and communicative code.

Key concepts in literate programming include:

  - Intermingling code and documentation: Code and explanatory text are interwoven, allowing developers to express their thoughts and reasoning behind the code.
  - Rich formatting: Documentation often includes rich text formatting, diagrams, and mathematical notation to enhance understanding.
  - Code weaving: Extracting code from the combined source, often in the form of compilable source code.
  - Code tangling: Reconstructing the code into a more traditional structure, removing the explanatory text for execution or compilation.

Several tools and platforms have been developed to facilitate literate programming:

  - [CodePen](codepen.io): A social development environment that allows developers to create, share, and modify front-end code snippets (HTML, CSS, and JavaScript). It doesn't strictly follow literate programming principles but enables users to document their code using comments and various markup languages.

  - [Jupyter Notebook](jupyter.org): An interactive web-based environment for creating and sharing documents that contain live code, equations, visualizations, and narrative text. Jupyter Notebooks are widely used in data science and scientific computing for literate programming, allowing users to weave code, data, and text together to create reproducible research and analyses.

  - [Observable](observablehq.com): A platform for creating interactive, data-driven documents using JavaScript. Observable notebooks enable users to write and visualize code, explore data, and create rich, interactive web documents. This platform fully embraces the principles of literate programming, as it allows users to seamlessly intermingle code, data, and explanatory text. Created by @mbostock, creator of [D3](d3js.org).
_________________________________________________
## Footnotes

Footnotes are not supported by showdown.js, but supported by [markdown-it](https://markdown-it.github.io/).
