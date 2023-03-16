<!DOCTYPE html>
<title>Welcome to Markdown!</title>
<link rel="stylesheet" href="/style.css">
<link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
<rect width='1' height='1' fill='purple' />
</svg>"/>

## Markdown: Motivation

Why not HTML?
Because writing about program source code is annoying in raw HTML.
Mostly because of the need to use both special tags like `<pre>`.
But also because you have to HTML escape the source, which makes it unreadable.
Markdown has another nice feature in that IntelliJ builds code folding in naturally using only normal headings.
(In HTML you have to separate the source with `<div>`s if you want code folding.)
The convenience of using markdown to specify software components is already proven with, for example, the `.mdx` format which is markdown + jsx.

Why not Markdown?
The library is very large - Showdown.js is 156KB.
It has no dependencies, but such a large codebase is bound to have issues, and the benefit of using it is, at first glance, not very high.
IntelliJ's markdown editor definitely doesn't like me adding actual javascript or raw html.

## This file is a test

This file is a test of the reflector markdown capabilities.
   - [x] Custom headers take effect (check favicon)
   - [x] Code samples easy to author
   - [x] Code samples render without syntax highlighting
   - [ ] Syntax highlighting, esp for html, js, css, bash
   - [x] Raw html (esp svg) rendering correctly
   - [ ] Raw html (esp svg) authoring good?
   - [x] Raw javascript executing?
   - [ ] Raw javascript authoring good?

Two authoring issues with IntelliJ IDEA.

One syntax highlighting issue, easily fixed with...[huge dependencies](https://highlightjs.readthedocs.io/en/latest/readme.html).
A good reason to reconsider raw html, requiring the reader to view source.

Testing javascript source:
```js
let result = combine({a:1}, {a:2});
```

```html
<p>html <b>source</b></p>
```

SVG renders correctly:

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

HTML (and javascript) snippets work great:
```html
<script id="combine-example" type="module">
  import {combine} from '/combine.js';
  let result = combine({a:1}, {a:2});
  console.log('hello from markdown', result);
</script>
```

However you still have to repeat them in source to run them.
Syntax highlighting requires more css and javascript.

<script id="combine-example" type="module">
  import {combine} from '/combine.js';
  let result = combine({a:1}, {a:2});
  console.log('hello from markdown', result);
</script>

It works, but my editor doesn't seem to recognize JavaScript in markdown as a first class citizen, which is tnroubling.

