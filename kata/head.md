<!DOCTYPE html>
<head>
  <meta name="author" content="jbr">
  <meta name="description" content="ChatGPT and generative adversarial networks are the new frontier of scams">
  <meta name="keywords" content="ai,chatgpt,scams,infosec"/>
  <meta name="date" content="2023-03-30">
  <title>ChatGPT and the Golden Age of Scams</title>
  <link rel="stylesheet" href="/style.css">

  <!-- if testable: -->
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>"
  >
  <script class="testable" src="/testable.js" type="module"></script>

  <!-- if syntax highlighting: -->
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>

  <!-- slug generated from meta tags above during authoring. DO NOT MODIFY -->
  <script id="slug" type="application/json">
{
  "date": "2023-03-30",
  "author": "jbr",
  "description": "ChatGPT and generative adversarial networks are the new frontier of scams",
  "tags": [
    "ai",
    "chatgpt",
    "scams",
    "infosec"
  ]
}
  </script>
</head>

[blog](./index.md) | [home](/)
# Preface: making a blog post
A blog post is an ordinary resource, but it is intended to have high [proximity coherence](https://en.wikipedia.org/wiki/Proximity_coherence).

## System of record
Respect to our forebears and use `meta` attributes as the system-of-record for the post meta-data.
It may turn out to be more convenient to use the JSON representation of the slug as the system-of-record.
But for now, we'll use both and keep them consistent.
If we end up picking JSON as the SoR then we can reverse the script below to generate the `meta` tags from the JSON.

## author statically generates the slug
Compute a slug at runtime from DOM `meta` tags:
```js
const extractMetaData = (name, defaultContent='') => {
    const found = document.querySelector(`meta[name="${name}"]`);
    if (found) return found.getAttribute('content');
    return defaultContent;
}
const extractTitle = () => document.getElementsByTagName('title')[0].innerText;

const title = extractTitle();
const author = extractMetaData('author');
const date = extractMetaData('date'); // <= new Date().toISOString().slice(0, 10)
const description = extractMetaData('description');
const tags = extractMetaData('keywords').split(',');

const slug1 = {date, title, author, date, description, tags};
const slug1String = JSON.stringify(slug1, null, 2);

const slug2String = document.getElementById('slug').innerText;
const slug2 = JSON.parse(slug2String);

// assertEquals(slug1String.trim(), slug2String.trim());
```

### Cache slug in source

We run this script statically and add a `slug` attribute to the `head` of the document that is *consistent* with the `meta` tags:
```html
<head>
  <meta name="author" content="jbr">
  <meta name="description" content="ChatGPT and generative adversarial networks are the new frontier of scams">
  <meta name="keywords" content="ai,chatgpt,scams,infosec"/>
  <title>ChatGPT and the Golden Age of Scams</title>
  <script id="slug" type="application/json">
{
  "author": "jbr",
  "date": "2023-03-30",
  "description": "ChatGPT and generative adversarial networks are the new frontier of scams",
  "tags": [
    "ai",
    "chatgpt",
    "scams",
    "infosec"
  ]
}
  </script>
</head>
```

## Extracting the slug in reflector
Reflector sees these posts as strings, not DOM.
We can extract the slug from the `head` of the document using a regular expression:

```js
function extractFirstJSON(text) {
    // Regular expression to match object literals
    // See: https://regex101.com/r/fI3zK9/1
    const regex = /{[^{}]*}/;
    const match = regex.exec(text);
    return match[0];
}

// head innertext will serve as a standin for the entire source of the file.
const headInnerText = document.getElementsByTagName('head')[0].innerText;

const match = extractFirstJSON(headInnerText);

assertEquals(`{
  "date": "2023-03-30",
  "author": "jbr",
  "description": "ChatGPT and generative adversarial networks are the new frontier of scams",
  "tags": [
    "ai",
    "chatgpt",
    "scams",
    "infosec"
  ]
}`, match);
```
This function is ready to be integrated with the [reflector](/reflector.md).

```js
let markdownString = `<!--
<!DOCTYPE html>
<head>
  <title>Simpatico: combine()</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='white' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">
  <link class="hljs" rel="stylesheet" href="/kata/highlight.github.css">
  <script class="testable" src="testable.js" type="module"></script>
  <script class="hljs" type="module">
    import hljs from '/kata/highlight.min.js';
    import javascript from '/kata/highlight.javascript.min.js';
    const d=document, elts = a => d.querySelectorAll(a);
    hljs.registerLanguage('javascript', javascript);
    d.addEventListener('DOMContentLoaded', () =>
      elts('pre code').forEach(block =>
        hljs.highlightElement(block)));
  </script>
</head>
-->`;

// extract everything within the first <!-- --> comment
const regex = /<!--\s*([\s\S]*?)\s*-->/;
const match = regex.exec(markdownString);
const html = match[1];
assertEquals(`<!DOCTYPE html>`, html.trim().split('\n')[0]);
assertEquals(`<!DOCTYPE html>`, removeWrapper(markdownString).trim().split('\n')[0]);

if (markdownString.startsWith('<!--'))
    markdownString = removeWrapper(markdownString);
const regex = new RegExp(`${open}\\s*([\\s\\S]*?)\\s*${close}`);

const headerString = markdownString.match(/^<!--.*-->\s*<html.*>/) ? removeWrapper(markdownString.match(/^<!--.*-->\s*<html.*>/)[0]) : 'defaultHtmlHeader()';
console.log(markdownString.match(/^<!--.*-->\s*<html.*>/));

function removeWrapper(text, open="<!--", close="-->") {
  // Regular expression to strip HTML comments
  // See: https://regex101.com/r/SvRZth/1
  const regex = new RegExp(`${open}\\s*([\\s\\S]*?)\\s*${close}`);
  const match = regex.exec(text);
  const html = match[1];
  return html;
}



```

### Roads not travelled
Note that the reflector might do the extraction more conveniently but it would require instantiation of the DOM. I'm not interested in either making the reflector more complex by adding a server-side-DOM, nor am I interested in parsing meta tags directly as strings (although it probably wouldn't be too terrible especially given the pretty strong conventions around authoring meta tags).




# ChatGPT and the Golden Age of Scams
ChatGPT generates apparently unique and coherent text.
This subverts our intuitions about what is difficult and what is easy.

It goes beyond just "do I know if I'm chatting with a bot."
Consider the *worlds* that a handful of GPUs can generate.
False university websites, professional associations, think tanks.
All done with fractal complexity, with an army of personas interacting with each other in believable and unique ways.

(There are good and bad sides to this. On the good front surveillance capitalism will become far less viable. These scam resources will make email spam look tame. This is all possible because of our intuitions about how hard it is to make a website, or to fill an empty CMS with a tonne of data.

ChatGPT is Saul Goodman - hardworking, clever, and (potentially) a bit of a scumbag.
This will be an industry, I think, both red team and blue team, for some time.
Sadly it will sound the death-knell, probably, of simple web-sites like this one.
(Although this is a good reason to do speaking engagements, and to write books, to attest to the reality of the author of these words. A twitch stream is another path to this proof.)

