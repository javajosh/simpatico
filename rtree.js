// Import util.js

// function rtree(){
// 	let currBranchIndex = 0;
// 	const branches = [[0]];
// 	const getBranchNodes = (branchIndex = currBranchIndex) => branches[branchIndex];
// 	const addNode = d => getBranchNodes().push(d);
// 	const setBranchIndex = i => { between(i, 0, branches.length - 1); currBranchIndex = i };
// 	return {getBranchNodes, addNode, setBranchIndex}
// }


let count = 0;
// Form a doubly-linked list where the payload is a reduction over combine since root.
function S(prev={}, curr={}, print = true){
  let prev_r = prev.r || {};
  let r = combine(prev_r, curr);
  let m = {prev, curr, r};
  if (print) console.log(count++, curr, r);
  return m;
}
//To get the message list for the current residue, we walk back to the root.
function msgs(s){
  let result = [];
  while(s.prev){
    result.push(s.curr);
    s = s.prev;
  }
  return result;
}


A Core is a collection of related residues, represented by the tip of each branch of messages.
Branches are created by moving backward up the chain and then adding a new message.
function Core(tip={}){
  this.tips = [];
  this.input = [];
  this.tip = tip;
  this.offset = 0;
  this.add = (msg, targetMsg = this.tip) => {
    this.input.push(msg);
    targetMsg = S(targetMsg, msg, false);
    if (this.offset) {
      this.tips.push(this.tip);
      this.offset = 0;
    }
    return this;
  };
  this.state = () => this.tip.r;
  this.back = offset => {
    this.offset = offset;
    while(offset-- && this.tip.prev)
      this.tip = this.tip.prev;
    return this;
  };
  this.select = (tipIndex) => {
    this.tip = this.tips[tipIndex];
    this.offset = 0;
    return this;
  }
  this.msgs = () => msgs(this.tip);
  this.test = (core)=>{
    let tests = this.tips;
    for (let test of tests){
      let steps = test.msgs();
      for (let step of steps){
        core.add(step); //may want to wrap this
        //can either interleave calls and assertions.
        //or combine them.
      }
    }
  }
}
