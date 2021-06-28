let fail = false;
window.onerror = e => {
  document.getElementById('favicon').href = './img/red.png';
  document.body.style.backgroundColor = 'red';
  fail = true;
};

window.onload = e => {
  if (!fail){
    console.log('Tests succeeded!');
    document.getElementById('favicon').href = './img/green.png';
  }
}

