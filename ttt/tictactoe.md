# Tic-Tac-Toe in functional ES6

Once upon a time a recruiter asked me to code up tic-tac-toe in some language or another. Maybe python or java. But anyway I really like ES6 and wanted to take a stab at it. Generally, I'm very pleased with this overall code. *The vast majority of complexity is in the winner computation*. So the strategy here is to get all the other computation out of the way, and then play around with winner algorithms.

One way to think about the algorithm is very close to the metal, and compute it in three phases: across, down, and diagonals. This can be computed on any board and doesn't use the last move as an optimization. It even generalizes pretty well over different board sizes.

Another approach is to start with the last move, and then take 'slices' of the board in various directions that include that move, and then analyze those slices.