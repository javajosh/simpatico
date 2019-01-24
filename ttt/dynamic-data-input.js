function parseData(event){
  const dataElt = event ? event.source : document.getElementById('data');
  const rawData = dataElt.value.trim();
  let data = rawData.split('\n').map(strObject => JSON.parse(strObject));
  console.log(data);
}

function add(parent, data){
  const n = {parent, data, children:[]}
  //parent.children.push(n)
  return n;
}

function printWalk(node){
  while(node.parent){
    console.log(node.data);
    node = node.parent;
  }
}

window.onload = ()=>{
  parseData();
}


const root = {data: 'root', children:[]};

const a = add(root, 1);
const b = add(root, 2);
console.log(b);
