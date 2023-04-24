import { fork, exec } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';

const DEBUG = true;
const testFile = 'temp.html';
const forkModule = './reflector.js';
let iters = 0;
// set to zero to keep the server running; useful for troubleshooting
const timeout = 0;
runServer();

async function runServer(useCache=false){
  iters++;
  if (!existsSync(testFile)) {
    writeFileSync(testFile, 'hello\n');
  }

  // Run the server. It will close in one second.
  const args = (useCache=false) => `{debug:true, host:simpatico.local, http:8080, https:8443, cert:localhost.crt, key:localhost.key, useCache:${useCache} }`;
  const server = fork(forkModule, [args(false)], { timeout });
  if (DEBUG) console.log(1, 'Server started', iters);
  try {
    // Warm the cache by requesting the file
    const res1 = await curl(testFile);
    if (DEBUG) console.log(2, 'Cache currently contains', res1);

    // Invalidate the cache by adding a line to the file.
    appendFileSync(testFile, 'hello\n');
    const fileContents = readFileSync(testFile);
    if (DEBUG) console.log(3, 'File contains', fileContents);

    // Request the file again
    const res2 = await curl(testFile);
    if (DEBUG) console.log(4, 'Cache currently contains', res2);

    // If the cache is working, the two responses should be different
    const success = res1 !== res2;
    if (DEBUG) console.log(5, 'Success', success);

    // If !success resurrect the server
    server.on('exit', () => {
      if (!success) {
        runServer(testFile); //recurse
        console.debug(res1, res2);
      } else {
        console.log('Success!');
      }
    });
  } catch (error) {
    throw error;
  }
}

const cmd = {
  getFile: (path = testFile) => `curl -s -k https://simpatico.local:8443/${path}`,
  ls: () => 'ls -l',
}

async function curl(path) {
  return new Promise((resolve, reject) => {
    exec(cmd.getFile(), (error, stdout, stderr) => {
      if (error) reject(error, stderr);
      resolve(stdout);
    });
  });
}


