import { fork, exec } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';

const DEBUG = true;
const testFile = 'temp.html';
const forkModule = './reflector.js';
const skipServer = true;
const useCache = false;
let iters = 0;
// set to zero to keep the server running; useful for troubleshooting
const timeout = 1500;

// Run a server every second
setInterval(async () => {
  await runCacheTest(skipServer, useCache);
}, 2000);

// Helper to build server arguments
const serverArgs = (useCache) => `{ useCache:${useCache}, debug:true, useGzip:false, host:simpatico.local, http:8080, https:8443, cert:localhost.crt, key:localhost.key }`;

// This function runs a test which means it starts a server, warms the cache, invalidates the cache, and checks the cache.
async function runCacheTest(skipServer, useCache){
  iters++;
  if (DEBUG) console.log(0, 'runCacheTest()', iters);

  // Check if the text file exists, if not create it
  if (!existsSync(testFile)) {
    writeFileSync(testFile, 'hello\n');
  }

  // Run the server. It will close in one second.
  let server;
  if (!skipServer)
     server = fork(forkModule, [serverArgs(useCache)], { timeout });
  if (DEBUG) console.log(1, 'Server started', iters);


  try {
    // Warm the cache by requesting the file
    const res1 = await curl(testFile);
    if (DEBUG) console.log(2, 'Cache currently contains', res1.split('\n').length);

    // Invalidate the cache by adding a line to the file.
    appendFileSync(testFile, 'hello\n');
    const fileContents = readFileSync(testFile).toString();
    if (DEBUG) console.log(3, 'File contains', fileContents.split('\n').length);

    // Request the file again
    const res2 = await curl(testFile);
    if (DEBUG) console.log(4, 'Cache currently contains', res2.split('\n').length);

    // If the cache is working, the two responses should be different
    const success = res1 !== res2;
    if (DEBUG) console.log(5, 'Success', success);

    // If !success resurrect the server
    if (!skipServer) server.on('exit', () => {
      if (!success) {
        runCacheTest(testFile); //recurse
        console.debug(res1, res2);
      } else {
        console.log('Success!');
      }
    });
  } catch (error) {
    throw error;
  }
}


async function curl(path) {
  const cmd = {
    getFile: (path = testFile) => `curl -s -k --compressed https://simpatico.local:8443/${path}`,
    ls: () => 'ls -l',
  }

  return new Promise((resolve, reject) => {
    exec(cmd.getFile(), (error, stdout, stderr) => {
      if (error) reject(error, stderr);
      resolve(stdout);
    });
  });
}


