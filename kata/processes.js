import { exec, spawn, execFile, fork } from 'child_process';

// 1. exec: Spawns a shell, runs a command within that shell, and buffers the output
exec('echo "1. Hello, World!"', (error, stdout, stderr) => {
  if (error) {
    console.error(`1a exec error: ${error}`);
    return;
  }
  console.log(`1b exec stdout: ${stdout}`);
  if (stderr) console.error(`1c exec stderr: ${stderr}`);
});

// 2. spawn: Spawns a new process without a shell, streams the output
const spawnProcess = spawn('echo', ['2. Hello, World!']);
spawnProcess.stdout.on('data', (data) => {
  console.log(`2a spawn stdout: ${data}`);
});
spawnProcess.stderr.on('data', (data) => {
  console.error(`2b spawn stderr: ${data}`);
});
spawnProcess.on('close', (code) => {
  console.log(`2c spawn process exited with code ${code}`);
});

// 3. execFile: Similar to exec, but runs a file directly without spawning a shell
execFile('echo', ['3. Hello, World!'], (error, stdout, stderr) => {
  if (error) {
    console.error(`3a execFile error: ${error}`);
    return;
  }
  console.log(`3b execFile stdout: ${stdout}`);
  if (stderr) console.error(`3c execFile stderr: ${stderr}`);
});

// 4. fork: Spawns a new Node.js process and invokes a specified module
// Create a new file named 'forkedModule.js' with the following content:
// process.send('Hello from forked module!');
// process.exit();
const forked = fork('./forkedModule.js');
forked.on('message', (message) => {
  console.log(`4a fork message: ${message}`);
});
forked.on('exit', (code) => {
  console.log(`4b fork process exited with code ${code}`);
});
