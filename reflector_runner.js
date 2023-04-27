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
const useGzip = true; // --compressed doesn't seem to help
const useTls = true; // -k but how to install ca cert with curl?
// When starting a server, kill it after this many milliseconds, 0 to not kill it
// This is a failsafe because we actually kill the server after a successful test.
const serverProcessTimeOut = 0; // 0 for no timeout
const rerunOnTestFailure = true; // < 0 for no restart
const rerunDelay = 1000; // Throttle restarts. Reflector starts ~10Hz without this.
function serverArgs (useCache, useTls, useGzip) {
  return `{
    useCache:${useCache},
    useTls:${useTls},
    debug:false,
    useGzip:${useGzip},
    host:simpatico.local,
    http:8080,
    https:8443,
    cert:localhost.crt,
    key:localhost.key
  }`.replace('\n', '');
}

const assertCacheWorksTest = {
  setup: testFileExists,
  run: assertCacheWorks,
  name: 'assertCacheWorks',
  serverArgs: serverArgs(useCache, useTls, useGzip),
  serverProcessTimeOut,
  success: false, // will be measured later.
};

runTest(assertCacheWorksTest, skipServer, 0);


/**
 *
 * @param test
 * @param skipServer true if you want to run your own server
 * @param count number of times called
 */
function runTest(test, skipServer, count=0){
  info('runTest()', test.name, ++count);

  if (skipServer){
    test.setup();
    test.run();
    info(test.name, 'test succeeded!', 'skipServer=true');
    return;
  }

  // Run the server with args and wait for it to start
  let server;
  try{
    server = serverIsRunning(test.serverArgs, test.serverProcessTimeOut);
  } catch (ex) {
    info('server failed to start', test.serverArgs, ex);
    return;
  }

  // By the quirky rules of node fork(), this is how we know our server is up.
  server.on('message', (config) => {
    try {
      // assertFailedTest(); // handy for testing the runner restart mode
      test.setup();
      test.run();
      test.success=true;
      info(test.name, 'test succeeded!', 'skipServer=false');
    } catch (ex){
      test.succes=false;
      info('test failed, rerunning test #', count, ex, config);
    } finally {
      server.kill();
    }
  });

  server.on('exit', (code, signal) => {
    // If we expect the server to crash, or not crash here is where to check.
    info('server exited with code', code, 'signal', signal);
    if (!test.success && rerunOnTestFailure) {
      info('rerunning test', count);
      setTimeout(() =>
        runTest(test, skipServer, count),
        rerunDelay
      );
    }
  });
}

// used for internal testing of the runner itself.
function assertFailedTest(){
  info('assertFailedTest()');
  throw new Error('test failed');
}

/**
 * warm the cache
 * invalidate the cache
 * checks the cache.
 *
 * @param path
 */
function assertCacheWorks(path=testFile){
  const numLines = str => str.split('\n').length;

  // Get a baseline and warm the cache by requesting the file
  const read1 = readFileSync(path).toString();
  const get1 = curl(path).toString();
  assertEquals(numLines(read1), numLines(get1), `initial read is bad ${numLines(read1)}, ${get1}`);

  // Invalidate the cache by adding a line to the file.
  appendFileSync(path, '\n<p>hello');

  // Read and get again
  const read2 = readFileSync(path).toString();
  const get2 = curl(path).toString();
  assertEquals(numLines(read2), numLines(get2), 'cache did not invalidate');
}

/**
 * Check if the test file exists, if not create it
 *
 * @param path
 */
function testFileExists(path=testFile){
  const fileExists = existsSync(path);
  if (!fileExists) {
    writeFileSync(path, '<DOCTYPE! html>\n<title>Hello</title>\n<h1>Hello</h1>');
  }
  info('testFileExists(path, fileExists)', path, fileExists);
}

/**
 * Start a server and return the server object.
 * Register for exit and message events from the child process.
 *
 * @param serverArgString Typically the serverArgs object stringified as a js object literal
 * @param serverProcessTimeOut
 * @returns {ChildProcess}
 */
function serverIsRunning(serverArgString, serverProcessTimeOut=serverProcessTimeOut){
  // Run the server. It will close in one second.
  const server = fork(
    forkModule,
    [serverArgString],
    { timeout: serverProcessTimeOut }
  );

  // Keep this around for documentation and a sanity check on the server process.
  // Register for the exit event.
  server.on('exit', (...args) => {
    log('serverIsRunning', 'on exit', args)
  });
  // Register for the message event, which is triggered by process.send(config) in the child.
  server.on('message', (...args) => {
    log('serverIsRunning', 'on message', args)
  });
  return server;
}

function curl(path) {
  // --compressed not supported in my version of libcurl.
  const curlCommand = `curl -s -k https://simpatico.local:8443/${path}`;
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
