import hljs from '/kata/highlight.min.js';
import javascript from '/kata/highlight.javascript.min.js';

hljs.registerLanguage('javascript', javascript);
document.addEventListener('DOMContentLoaded', () => {
  // add syntax highlighting
  document.querySelectorAll('pre code').forEach((el) => {
    hljs.highlightElement(el);
  });

  // Support clickable definitions on mobile, which does cannot hover
  document.querySelectorAll('span[title]').forEach(span => {
    span.addEventListener('click', function() {
      const dialog = document.createElement('div');
      dialog.textContent = span.getAttribute('title');
      dialog.classList.add('dialog');
      document.body.appendChild(dialog);
      dialog.addEventListener('click', function(e) {
        dialog.remove();
      });
    });
  });

  // Add a table of contents - but only if there are more than 3 headings
  const headings = document.querySelectorAll('h1, h2, h3');
  if (headings.length > 3) {
    let toc = '<h2>Table of Contents</h2><ul>';
    let level, title, id, indent;
    headings.forEach(function (heading) {
      level = heading.tagName[1];
      title = heading.textContent;
      id = heading.id;
      indent = (level - 1) * 20; // Adjust the foo size as needed
      if (id) toc += `<li style="margin-left: ${indent}px;"><a href="#${id}">${title}</a></li>`;
    });
    toc += '</ul>';

    const tocDiv = document.createElement('div');
    tocDiv.id = 'toc';
    tocDiv.innerHTML = toc;

    // Insert the tocDiv as the 3rd element under main
    const mainTag = document.querySelector('main');
    if (mainTag) {
      const children = mainTag.children;
      if (children.length >= 3) {
        mainTag.insertBefore(tocDiv, children[3]);
      } else {
        mainTag.appendChild(tocDiv);
      }
    }
  }
});
