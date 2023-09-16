# HTMX kata

I really like the idea of htmx, which was recently inducted into the github <strike>hall of fame</strike> accelerator ([link](https://news.ycombinator.com/item?id=37144985)).

I'm going to attempt to use it here by adapting the [fireship 100s video introduction](https://www.youtube.com/watch?v=r-GSGH2RxJs). The main adaptation being that I'll download the library first before using it. `curl -o htmx.js https://unpkg.com/htmx.org@1.9.4/dist/htmx.min.js` and then `<script src='./htmx.js'> in head` (and add a link to the index to make it easier to find in the future). (The other option is to `npm install htmx.org` but I didn't do that)

Once that's done we try some htmx things! We use `hx-get`, `hx-target` attributes on things:

```html
<h3>Press a button to trigger get</h3>
<button
  hx-get="./index.html"
  hx-target="#mydiv">Press me</button>

<div id="mydiv">This is a div before swap</div>
```


```html
<h3>Type something to trigger get</h3>
<input
  hx-get="./index.html"
  hx-target="#mydiv"
  hx-trigger="keyup changed delay:1s"></input>

<div id="mydiv">This is a div before swap</div>
```

## A comment about errors
HTMX is not great about error reporting if you get an attribute name or value wrong.
