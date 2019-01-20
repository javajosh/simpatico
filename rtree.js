// Import util.js

function rtree(){
	let currBranchIndex = 0;
	const branches = [[0]];
	const getBranchNodes = (branchIndex = currBranchIndex) => branches[branchIndex];
	const addNode = d => getBranchNodes().push(d);
	const setBranchIndex = i => { between(i, 0, branches.length - 1); currBranchIndex = i };
	return {getBranchNodes, addNode, setBranchIndex}
}
