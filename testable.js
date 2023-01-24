// Include as first script in head: <script type="module" src="testable.js"></script>
// Requires a #favicon element like <link id="favicon" rel="icon" type="image/png" href="./img/white.png"/>
// <meta id="refresh" http-equiv="refresh" content="2">
// <button onclick="window.stop()">Stop 2s Refresh</button>
let fail = false;
const favicon = document.getElementById('favicon');
if (!favicon) throw 'testable.js requires a #favicon element in the document';

const svgIcon = fill => `data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='${fill}' />
  </svg>`;

// If the document loads, the tests passed.
window.addEventListener('load', () => {
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
})

// Add a convenient way to stop refresh, press space or s.

window.addEventListener('keyup', ({key}) => {
  if (key === 's' || key === ' ') {
    window.stop();
    console.log('Refresh stopped!');
  }
})
