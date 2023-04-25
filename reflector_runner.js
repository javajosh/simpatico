import { fork, execSync } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, readFileSync } from 'node:fs';

import { assertEquals } from './core.js';

const DEBUG = false;
const log = (...args) => {if (DEBUG) console.log('reflector_runner.js:log', args)};
const info = (...args) => {console.log('reflector_runner.js:info', args)};
const testFile = 'temp.html';
const forkModule = './reflector.js';
const skipServer = false;
const useCache = true;
const useGzip = true; // --compressed
const useTls = true; // -k
// When starting a server, kill it after this many milliseconds, 0 to not kill it
// This is a failsafe because we actually kill the server after a successful test.
const serverProcessTimeOut = 1000; // 0 for no timeout
const serverRestartDelay = 1000; // < 0 for no restart
const serverArgs = `{ useCache:${useCache}, useTls:${useTls}, debug:true, useGzip:${useGzip}, host:simpatico.local, http:8080, https:8443, cert:localhost.crt, key:localhost.key }`;

// Run the test once
runTest(skipServer, useCache, testFile, serverArgs, serverProcessTimeOut);


/**
 *
 * @param skipServer true if you want to run your own server
 * @param useCache
 * @param file
 * @param serverArgs
 * @param serverProcessTimeOut
 */
function runTest(skipServer, useCache, file, serverArgs, serverProcessTimeOut){
  // setup the file
  testFileExists(file);
  // Run the test either after the server starts or immediately.
  if (!skipServer){
    const server = serverIsRunning(serverArgs, serverProcessTimeOut);
    server.on('message', config => {
      try{
        assertCacheWorks(testFile, config);
        server.kill();
      } catch (ex){
        info('test failed', ex);
        server.kill();
        if (serverRestartDelay >= 0)
          setTimeout(() => {
            runTest(skipServer, useCache, file, serverArgs, serverProcessTimeOut);
          }, serverRestartDelay);
      }
    });
  } else {
    assertCacheWorks(testFile, {});
  }
}

/**
 * warm the cache
 * invalidate the cache
 * checks the cache.
 *
 * @param testFile - the file we're checking,  .gitignore'd
 * @param serverConfig - the config object from the server, for information
 */
function assertCacheWorks(testFile, serverConfig){
  // Get a baseline and warm the cache by requesting the file
  const read1 = readFileSync(testFile).toString();
  const get1 = curl(testFile);
  assertEquals(read1, get1.toString());

  // Invalidate the cache by adding a line to the file.
  appendFileSync(testFile, 'hello\n');

  // Read and get again
  const read2 = readFileSync(testFile).toString();
  const get2 = curl(testFile);
  assertEquals(read2, get2.toString());

  // If we get here it worked.
  info('assertCacheWorks()', 'test succeeded!', serverConfig);
}

/**
 * Check if the test file exists, if not create it
 * @param path
 */
function testFileExists(path){
  const fileExists = existsSync(path);
  if (!fileExists) {
    writeFileSync(path, 'hello\n');
  }
  info('testFileExists(path, fileExists)', path, fileExists);
}

/**
 * Start a server and return the server object.
 * Register for exit and message events from the child process.
 *
 * @param serverArgString Typically the serverArgs object stringified as a js object literal
 * @param timeout The server will be terminated within this many milliseconds.
 * @returns {ChildProcess}
 */
function serverIsRunning(serverArgString, serverProcessTimeOut){
  // Run the server. It will close in one second.
  const server = fork(
    forkModule,
    [serverArgString],
    { timeout: serverProcessTimeOut }
  );

  // Register for the exit event.
  server.on('exit', (...args) => {
    log('serverIsRunning', 'on exit', args)
  });
  // Register for the message event, which is triggered by process.send() in the child.
  server.on('message', (...args) => {
    log('serverIsRunning', 'on message', args)
  });
  return server;
}

function curl(path) {
  const curlCommand = `curl -s -k --compressed https://simpatico.local:8443/${path}`;
  let result = null;
  try {
    result = execSync(curlCommand);
  } catch (ex){
    log('curlCommand', curlCommand, 'ex', ex);
    result = ex;
  }
  if(result !== null)
    log('curl()', 'path', path, 'curlCommand', curlCommand, 'result.toString()', result.toString())

  return result;
}
