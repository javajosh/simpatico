/** To make a page "testable"
 1. paste this boilerplate into html head
 2. put this file in the same directory as the html and name it testable.js
 3. write tests as a straightforward inline script that throws on error
 4. enjoy
 */

/*
  const biolerplate = (fill='white', src='testable.js') => `
  <!-- Begin testable.js html boilerplate; testable.js is in the same directory -->
  <link id="favicon" rel="icon" type="image/svg+xml" href="data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='white' />
  </svg>"/>
  <meta id="refresh" http-equiv="refresh" content="2">
  <script src="testable.js" type="module"></script>
  <!-- End testable.js boilerplate  -->
`;
*/

let fail = false;
const favicon = document.getElementById('favicon');
if (!favicon) throw 'testable.js requires a #favicon element in the document';

const svgIcon = fill => `data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='${fill}' />
  </svg>`;

// If the document loads, the tests passed.
window.addEventListener('load', () => {
  // After the whole dom loads, add a "stop refresh" button inside all "makeItStop" elements.
  const makeItStopButton = () => `<button onclick="window.stop()">Stop 2s Refresh</button> (click button or use the spacebar. to restart reload page.)`;
  const makeItStopParents = Array.from(document.getElementsByClassName("makeItStop"));
  makeItStopParents.forEach(parent => parent.innerHTML = makeItStopButton())

  // If the entire page loads without triggering a fail, the tests succeeded!
  if (!fail){
    favicon.href = svgIcon('green');
    console.log('Tests succeeded!');
  }
})

// If an exception was thrown on load, the tests did not pass
window.addEventListener('error', () => {
  fail = true;
  favicon.href = svgIcon('red');
  document.body.style.backgroundColor = 'red';
  const isIframe = window.parent !== null;
  if (isIframe) {
    window.parent.dispatchEvent(new CustomEvent('test-failure'));
  }
})

// Add a convenient way to stop refresh, press space or s.
window.addEventListener('keyup', ({key}) => {
  if (key === ' ') {
    window.stop();
    console.log('Refresh stopped!');
  }
})
