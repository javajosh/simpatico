// Include as first script in head: <script type="module" src="testable.js"></script>
const favicon = document.getElementById('favicon');
if (!favicon) throw 'testable.js requires a #favicon element in the document';

const svgIcon = fill => `data:image/svg+xml,
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'>
      <rect width='1' height='1' fill='${fill}' />
  </svg>`;

let fail = false;

window.addEventListener('error', () => {
  fail = true;
  favicon.href = svgIcon('rgb(255,0,0)');
  document.body.style.backgroundColor = 'rgb(255,0,0)';
})

window.addEventListener('load', () => {
  if (!fail){
    favicon.href = svgIcon('rgb(0,255,0)');
    console.log('Tests succeeded!');
  }
})

// <meta id="refresh" http-equiv="refresh" content="2">
// <button onclick="window.stop()">Stop 2s Refresh</button>
window.addEventListener('keyup', ({key}) => {
  if (key === 's' || key === ' ') {
    window.stop();
    console.log('Refresh stopped!');
  }
})