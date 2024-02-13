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
  <meta id="refresh" http-equiv="refresh" content="-1">
  <script src="/testable.js" type="module"></script>
  <!-- End testable.js boilerplate  -->
`;
*/

let fail = false;
const colors = {
  success: 'DodgerBlue',
  failure: 'red',
  neutral: 'white',
}
const isIframe = window.parent !== null;
const favicon = document.getElementById('favicon');
if (!favicon) throw 'testable.js requires a #favicon element in the document';

const log = (...args) => console.log(window.location.pathname, ...args);


const svgIcon = fill => `data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='${fill}' />
  </svg>`;

const makeItStopButton = () => `
  <button onclick="window.stop()">Stop 2s Refresh</button>
  (click button or use the spacebar. to restart reload page.)
`;

// Add a stop refresh button to any elt with class makeItStop.
// Add a convenient way to stop refresh, press space or s.
// If the document loaded without failure, the tests passed!
window.addEventListener('load', () => {
  const makeItStopParents = Array.from(document.getElementsByClassName("makeItStop"));
  makeItStopParents.forEach(parent => parent.innerHTML = makeItStopButton())

  // If the entire page loads without triggering a fail, the tests succeeded!
  if (!fail){
    favicon.href = svgIcon(colors.success);
    log('Tests succeeded!');
    if (isIframe) {
      window.parent.dispatchEvent(new CustomEvent('test-success'));
    }
  }
})

// If an exception was thrown on load, the tests did not pass
window.addEventListener('error', () => {
  fail = true;
  favicon.href = svgIcon(colors.failure);
  document.body.classList.add('error-background');

  if (isIframe) {
    window.parent.dispatchEvent(new CustomEvent('test-failure'));
  }
})

// Add a convenient way to stop refresh, press space.
window.addEventListener('keyup', ({key}) => {
  if (key === ' ') {
    window.stop();
    log('Refresh stopped!');
    favicon.href = svgIcon(colors.neutral);
    document.body.classList.remove('error-background');
  }
})
