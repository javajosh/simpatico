<!DOCTYPE html>
<head>
<title>Welcome to Markdown!</title>
<link rel="stylesheet" href="/style.css">
<link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
    <rect width='1' height='1' fill='purple' />
  </svg>"
/>
<link rel="stylesheet" href="./highlight.github-dark.css">
<script type="module">
  import hljs from '/kata/highlight.min.js';
  import javascript from '/kata/highlight.javascript.min.js';
  hljs.registerLanguage('javascript', javascript);
  document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('pre code').forEach((el) => {
      hljs.highlightElement(el);
    });
  });
</script>
</head>

# Markdown
HTML will always be the primary authoring tool.
However, it is difficult to write about code in HTML.

To that end I've added basic markdown support to the reflector:

  - [x] Custom headers per markdown file
  - [x] Code samples easy to author
  - [x] Code samples execute
  - [x] Code samples render with syntax highlighting, esp for html, js, css, bash
  - [x] Raw html (esp inline svg) rendering correctly
  - [ ] Raw html (esp inline svg) authoring

## Showdown Library
Showdown is a seldom updated, single file 156kb javascript library that converts markdown strings into html strings.
I've imported it manually, and modified slightly, and executes only server-side.
I've had to learn a little bit about this library to write an extension that executes javascript code samples.
Note that this library is *only* included on the server side, and it's output is cached until the underlying markdown changes. (Efficient file-watching courtesy of [Chokidar](), a part of the excellent Brunch front-end build system).
Most of the learning curve of the library is selecting options.
The most common thing to change are the default imports inserted as a convenience before code samples.


## Highlight JS Library
[Highlightjs](https://highlightjs.org/) is a (relatively) small 140kb javascript and css library that syntax highlights source code found in the DOM.
It runs on the client side.
It's much smaller and simpler than [prettier](https://github.com/googlearchive/code-prettify) (now archived).

Find styles with the [highlightjs demo](https://highlightjs.org/static/demo/).
Then statically download the assets you want.

```bash
curl -O
```

## Why not HTML?

Writing about program source code is annoying in raw HTML.
The need to use both special tags like `<pre>`.
The need to HTML escape the source, which makes it unreadable.
IntelliJ builds code folding in naturally using only normal headings.
(In HTML you have to separate the source with `<div>`s if you want code folding.)
The convenience of using markdown to specify software components is already proven with the `.mdx` format, which is markdown + jsx.

## Why not Markdown?

The library is very large - Showdown.js is 156KB.
It has no dependencies, but such a large codebase is bound to have issues, and the benefit of using it is, at first glance, not very high.
IntelliJ's markdown editor definitely doesn't like me adding actual javascript or raw html.

Two authoring issues with IntelliJ IDEA, one syntax highlighting issue, only fixed with a [huge dependency](https://highlightjs.readthedocs.io/en/latest/readme.html).
A good reason to reconsider raw html, requiring the reader to view source.

Testing javascript source:
```js
let result = combine({a:1}, {a:2});
console.log('hi josh', 1<2);
```
This is some html source:
```xml
<p>html <b>source</b></p>
```

SVG source render (and authors) correctly:
```svg
<svg id="rotating-squares-animation" class="natural-units"
width="200px" height="200px"
viewBox="-1 -1 2 2"
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
Inline svg renders correctly, but authoring is poor (no syntax highlighting, code completion, emmet, etc)
<svg id="rotating-squares-animation" class="natural-units"
width="200px" height="200px"
viewBox="-1 -1 2 2"
>
  <desc>Two squares moving around the unit circle and rotating, too, plus constantly changing text.</desc>
  <g transform="scale(1,-1)">
    <g id="green-square"  transform="translate(0,0)"  ><rect width=".2" height=".2" fill="#482" /></g>
    <g id="yellow-square" transform="translate(.1,.1)"><rect width=".2" height=".2" fill="#882" /></g>
    <g id="unit-circle"   transform="translate(0 ,0 )"><circle class='unit-circle' r="1" fill="none" stroke="red" stroke-width=".001 "/></g>
    <g id="some-text"     transform="translate(0,0)scale(.01,-.01)"><text>Scale and (re)flip text</text></g>
  </g>
</svg>

HTML source renders fine and author's fine.
```js
  let result = combine({a:1}, {a:2});
  console.log('hello from markdown', result);
```
Inline HTML renders fine, but authoring is poor (code completion sometimes works; syntax highlighting is inconsistent.)


## Idea

One interesting idea is to modify showdown (with an extension) to generate an inline script tag in addition to the source render div.
In this way our scripts will always execute. (I did this and the first example is [combine2.md](/combine2.md))

## Thoughts on using markdown so far
   - Highlight JS is large (~150KB minified) and does not support [line numbers](https://highlightjs.readthedocs.io/en/latest/line-numbers.html)
   - The line numbers in browser errors no longer line up exactly like they do in raw HTML.
   - Instead of splitting the head off using `^<` I split by checking for `</head>` and taking all lines above.
