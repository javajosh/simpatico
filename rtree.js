// Lets start with a simple single-linked list.
install(window, assertions);
install(window, arrays);

const rtree = (val = null)=>{
	const root = {parent: null, val};
	const nodes = [root];
	const tips = [root];
	let tipIndex = 0;

	const tip = () => tips[tipIndex];

	const add = (val, parent = tip()) => {
		contains(nodes, parent);
		const node = {parent, val};
		const i = tips.indexOf(parent);
		if (i !== -1){
			tips[i] = node;
		} else {
			tips.push(node);
			tipIndex = tips.length - 1;
		}
		nodes.push(node);
		return node;
	};

	const setTipIndex = index => {
		between(0, tips.length - 1, index);
		tipIndex = index;
		return tip();
	}

	const path = (node = tip()) => {
		const result = [node];
		while(node.parent) {
			node = node.parent;
			result.push(node);
		}
		return result.reverse();
	}

	const valuePath = (node = tip()) => path(node).map(n => n.val);

	// This is the only place rtree depends on combine!!
	const residue = (node = tip(), base = 0) => 
		valuePath(node).reduce((acc, val) => combine(acc, val), base);

	const paths = () => tips.reduce((acc, tip) => push(acc, path(tip)) , []);
	const residues = (base = 0) => tips.reduce((acc, tip) => push(acc, residue(tip)) , []);

	return {nodes, add, tip, tips, setTipIndex, path, paths, valuePath, residue, residues};
}


// Import util.js

// function rtree(){
// 	let currBranchIndex = 0;
// 	const branches = [[0]];
// 	const getBranchNodes = (branchIndex = currBranchIndex) => branches[branchIndex];
// 	const addNode = d => getBranchNodes().push(d);
// 	const setBranchIndex = i => { between(i, 0, branches.length - 1); currBranchIndex = i };
// 	return {getBranchNodes, addNode, setBranchIndex}
// }

// let count = 0;
// // Form a doubly-linked list where the payload is a reduction over combine since root.
// function S(prev={}, curr={}, print = true){
//   let prev_r = prev.r || {};
//   let r = combine(prev_r, curr);
//   let m = {prev, curr, r};
//   if (print) console.log(count++, curr, r);
//   return m;
// }
// //To get the message list for the current residue, we walk back to the root.
// function msgs(s){
//   let result = [];
//   while(s.prev){
//     result.push(s.curr);
//     s = s.prev;
//   }
//   return result;
// }


// A Core is a collection of related residues, represented by the tip of each branch of messages.
// Branches are created by moving backward up the chain and then adding a new message.
// const Core = (tip={}) => {
//   const tips = [], input = [];
//   let offset = 0;

//   const add = (msg, targetMsg = tip) => {
//     input.push(msg);
//     targetMsg = S(targetMsg, msg, false);
//     if (offset) {
//       tips.push(tip);
//       offset = 0;
//     }
//   };
//   const state = () => tip.r;
//   const back = offset => {
//     offset = offset;
//     while(offset-- && tip.prev)
//       tip = tip.prev;
//   };
//   const select = (tipIndex) => {
//     tip = tips[tipIndex];
//     offset = 0;
//   }
//   const msgs = () => msgs(tip);
//   const test = (core)=>{
//     let tests = this.tips;
//     for (let test of tests){
//       let steps = test.msgs();
//       for (let step of steps){
//         core.add(step); 
//       }
//     }
//   }
//   return {add, state, back, select, msgs, test};
// }
