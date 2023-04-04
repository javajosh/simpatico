<!--<!DOCTYPE html>
<head>
  <title>Simpatico: reflector.js</title>
  <link class="testable" id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
        <rect width='1' height='1' fill='DodgerBlue' />
    </svg>"
  >
  <link rel="stylesheet" href="/style.css">

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
</head>-->

# Reflector
See: [home](/index.html)

The [reflector](/reflector.js) is the server component of simpatico.
It's a small, almost single file 450 line node program, written in modular, modern style that serves as a:
    1. Websocket server.
    1. Static file server.
    1. [Literate Markdown] renderer.
    1. SSL server.
    1. And more.



## Authoring with IntelliJ IDEA
I use IntelliJ IDEA to author my code.
Here is what I see when I open the reflector.js file:

![img.png](img.png)
