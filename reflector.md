# Reflector
See: [home](/index.html)

The [reflector](/reflector.js) is the server component of simpatico.
It's a small, almost single file 450 line node program, written in modular, modern style that serves as a:
  1. Static file server
    1. file reads are cached and invalidated with a file watcher.
    1. [Literate Markdown] renderer.
    1. tls

Installation and running is handled in the [readme](readme.md).

## Configuration options
Here are the default config values from [reflector](/reflector.js):
```js
  const baseConfig = {
    http: 8080,
    https: 8443,
    host: 'localhost',
    cert: './fullchain.pem',
    key: './privkey.pem',
    runAsUser: '',
    useCache: false,
    useGzip: true,
    useTls: false,
    password: 's3cret',
    logFileServerRequests: true,
    superCacheEnabled: false,
    debug: false,
    // measured: {},      //added below
  };
```
You can override these on the command line using js literal syntax (differs from JSON because of lack of quotes, which makes it easier to write on the command line):
```bash
"{useCache:true, useTls:true, debug:true, http:8080, https:8443, host:simpatico.local, cert:localhost.crt, key:localhost.key}"
```

## What does "Working" mean?
On my local machine, a working reflector means:
  1. The reflector starts without error (and I can set the noise level)
  1. The home page loads, with sub-resources (cache warm up)
  1. Images show up correctly. (content type and encoding)
  1. Modifications to resources show up in the browser (btd loop, cache invalidation)
  1. Modifications to subresources show up in the browser if url is tagged in the resource. (cache busting links)
  1. All tests pass. (You can have other kinds of tests but they must be labelled as such)

In production it is similar, but one can skip invalidation tests assuming the server is restarted on every push. (However once things get stable we will push more without restarting the server, and then invalidation will need to work in prod, too.)

I would also like to assert that every reasonable combination of configuration options work, but frankly I would not assert that, yet.

# Security and Privacy
No third party anything.
No CD

  <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->

We must start up as root to bind to privileged ports 80 and 443.
So then we must drop privileges after that.

For some reason I'm unable to use `sudo npm run prod` to start the reflector as root.
It tells me "npm not found" even though I can run `npm` as root from the command line. A mystery!
Another small tidbit: I'm now running node under Linux on my Windows machine using WSL1 to test this.
Note that my laptop is native Linux so it was always able to test this functionality.

In general you'd want to create a synthetic, limited user to drop privileges to. But for now I've just used my user account for convenience (and because I'm the only one using this machine and only for this).

# Static file server
The static file server's primary job is to get an html file to the browser.
It should serve subresources as well.
However, it turns out that we can do a bit more.

  1. file gets read from disk then
    1. [Literate Markdown](/lit.md) renderer.
    1. gzipped based on mime-type/extension.
    1. cached
    1. invalidated with a file watcher.
  1. sub-resource headers instruct the browser to cache forever
    1. Q: is this a memory leak? How does the browser handle this?
    1. sub-resources are updated by the containing resource via a unique link (see below)
  1. resource response
    1. headers tell browser to cache but check for updates with a 301 redirect
    1. interpolated with current sub-resource links for cache busting

## Design Notes
### Resources vs. Sub-Resources
Resources are html files, and sub-resources are the files that the html file requires to render as the author expects. (It is sometimes useful to further distinguish between textual and binary resources and sub-resources, and that's relevant for encoding the response, but it's irrelevant for the cache design.)

The cornerstone of the cache design is letting the browser cache sub-resources forever. Resources we cache in the browser, but also check for updates, expecting a 301 most of the time. In this way we can update our immutable sub-resources by providing a new, unique sub-resource URL in an evergreen resource. This mechanism is well-known and called "cache busting".

## Reflector file system cache vs browser cache
The reflector uses a simple in-memory cache to reduce disk reads.
Entries live in a simple object keyed by full file path.
Entries are populated on demand.
Entries are invalidated by a file watcher.

The browser cache is used to reduce network traffic.
Browser caching behavior is controlled by response headers.
Browser caching behavior can also be controlled via new-fangled js APIs with which I am not familiar. (See [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) and [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) for more details about the *explicit* control of the browser cache.)

```js
let isCacheSupported = 'caches' in window;
console.log(`isCacheSupported: ${isCacheSupported}`);
```



In memory, invalidated on file delete or write via chokidar. Turn debug mode on to see cache hits and misses. Data is processed (literate markdown and gzipping) before caching in an attempt to be efficient. For simplicity I gzip all the things even though it's not always necessary and actually is harmful, as with png or jpg images.

Total unique resource size should not exceed 100MB to be on the safe side of my current server who's advertised memory size is 1.0GB but in reality I get 0.5GB usable (to up this would need to switch to Alpine). (it is a very good design constraint to be somewhat limited in size.)

Sadly this command to check worst-case cache pressure in advance is rather slow and takes 1.5s even on a fast machine, otherwise it would be a good `git pre-commit hook`:

```bash
 find . -type f -not -path './.*' -exec du -b {} + | awk '{s+=$1} END {if (s > 100 * 1024 * 1024) print "Total addressable resource size exceeds
100MB"; else print s}'
```

### Cache busting URLs
Given an html string, write a function that finds all the links to sub-resources and replace them with cache-busting urls.
```js
// Note that we confuse showdown.js if we use "real" script tags, so we use made up ascript instead. It doesn't affect the code.

const authoredFileName = 'index.html';
const authoredFileContent = `
<link rel="stylesheet" href="style1.css?###">
<link rel="stylesheet" href='style2.css?###'>
<link rel="stylesheet" href='style3.css'>
<img src="image.png?###">
<ascript src="script.js?###"></ascript>
<ascript type="module">
  import {foo} from './pre-commit.js?###';
</ascript>
`;

const expectedInterpolated = `
<link rel="stylesheet" href="style1.css?123456789">
<link rel="stylesheet" href="style2.css?123456789">
<link rel="stylesheet" href='style3.css'>
<img src="image.png?123456789">
<ascript src="script.js?123456789"></ascript>
<ascript type="module">
  import {foo} from "./pre-commit.js?123456789";
</ascript>

`;

const actualInterpolated = replaceSubResourceLinks(authoredFileContent, authoredFileName, '\?###');
assertEquals(expectedInterpolated.trim(), actualInterpolated.trim())

/**
 * find all the links to sub-resources and replace them with cache-busting urls
 * this is too ambiguous so we rely on the author to signal when to do this.
 *
 * @param maybeHTML
 * @param fileName
 * @returns {*}
 */
function replaceSubResourceLinks (maybeHTML, fileName){
  const isHTML = fileName.endsWith('.html');
  const isMD = fileName.endsWith('.md');
  if (!isHTML && !isMD) return maybeHTML;

  // See https://regex101.com/r/r0XQMV/1
  const re = /(["`'])(.*?)\?\#\#\#\1(.*?)/g;

  // exec updates the lastIndex of the re on each invocation.
  // not how I would design it, but whatever.
  let match;
  while ((match = re.exec(maybeHTML)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === re.lastIndex) {
      re.lastIndex++;
    }

    // The full url including placeholder path is the match itself
    // group 2 contains just the sub-resource path.
    if (match.length === 4) {
      const url = match[0];
      const resource = match[2];
      const hash = r =>'123456789';
      const newUrl = `"${resource}?${hash(resource)}"`;
      maybeHTML = maybeHTML.replace(url, newUrl);
    }
  }
  return maybeHTML;
}

// Another function that I didn't use but is useful to have around.
function extractSubResourceUrls(html) {
  const subResourceUrls = [];

  // Match script and img src attributes
  const srcRegex = /<(?:script|img)[^>]*\ssrc=["']([^"']+)["']/g;
  let match;
  while ((match = srcRegex.exec(html)) !== null) {
    subResourceUrls.push(match[1]);
  }

  // Match link href attributes with rel="stylesheet"
  const stylesheetRegex = /<link[^>]*\srel=["']stylesheet["'][^>]*\shref=["']([^"']+)["']/g;
  while ((match = stylesheetRegex.exec(html)) !== null) {
    subResourceUrls.push(match[1]);
  }

  // Match inline script imports
  const importRegex = /import\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(html)) !== null) {
    subResourceUrls.push(match[1]);
  }

  // Match inline CSS url imports
  const cssUrlRegex = /url\(["']?([^"')]+)["']?\)/g;
  while ((match = cssUrlRegex.exec(html)) !== null) {
    subResourceUrls.push(match[1]);
  }

  return subResourceUrls;
}

```

## Reflector Runner
Testing the reflector, particularly the cache functionality, which was giving me trouble, it turned out because of mismatching keys between write and read.
But I started writing a "wrapper script" that can start a server, send messages, check output, modify the file system, send more messages, check output...and then do it again with a different server instance, probably one started with different parameters.

My first approach was to use bash but I abandoned that approach because it clearly needs a "real" programming language.
Given the rest of the project is in javascript, and reflector is in node, for my next approach I picked node.
So far in this project I've destressed asynchronous constructs, preferring the simplest static one-shot callback functions, and the node implementation started pushing against the limits of this approach.
I rethought things and turned back the complexity.
But my work on the runner, which has taken a few days, and has fixed the cache bug, still feels like a waste of time
since I'm paying the price for a radical "NIH" approach.
Mitigating factor is that this may become a good steelman argument for traditional approach to functional testing.
I think the stree has a natural application to functional testing, and I can contrast that implementation with this one.

Enable a BTD loop of the server invocation itself.
Loop through a set of startup configurations.
Interact with the file system, and check the server's response.
A node program that uses fork to start the server, and then uses curl to interact with it.


## URL to filename
Computing an absolute filename from the URL path can be easy if we require complete, explicit files.
E.g. `/simpatico.io/index.md`.
However, it is useful to allow users to access ambiguous URLs like `simpatico.io/` or `simpatico.io/chat`.
The approach is to generate a list of candidate filenames, and then return the first that exists.

Validity is also important since we don't want to allow leading dots in the filename.
And in general we don't want to allow any other problematic characters, like tildes (~).

```js
import {peek} from './core.js';

function candidates(path){
    if (path.endsWith('/')){
        return [path + 'index.md', path + 'index.html'];
    }
    const parts = path.split('/');
    if (parts.some(part => part.startsWith('.'))){
        throw 'invalid path: ' + path;
    }
    const last = peek(parts);
    const isFile = /[^.]{2,}\.[^.]{2,}/.test(last);
    return (isFile) ?  [path] : [path + '.md', path + '.html', path + '/index.md', path + '/index.html'];
}

assertEquals(['/index.md'], candidates('/index.md'));
assertEquals(['/foo/bar/index.md'], candidates('/foo/bar/index.md'));
assertEquals(['/index.md','/index.html'], candidates('/'));
assertEquals(['/chat/index.md', '/chat/index.html'], candidates('/chat/'));
assertEquals(['/chat.md', '/chat.html', '/chat/index.md', '/chat/index.html'], candidates('/chat'));
assertEquals(['/foo/bar/chat.md', '/foo/bar/chat.html', '/foo/bar/chat/index.md', '/foo/bar/chat/index.html'], candidates('/foo/bar/chat'));


assertThrows(() => candidates('/foo/../bar/index.html'));
assertThrows(() => candidates('/.git'));
assertThrows(() => candidates('/foo/bar/.git'));
```

The following goals are currently underspecified and not met:
    1. Do not melt under load,
    1. serve minimal data, efficiently.

The "fast & easy" things we can do are mimic well-known software in this area

The basic strategy is to "reduce what you serve" and "serve things efficiently".

To reduce what we serve, we need to add aggressive client caching:
  1. Add cache headers to cache sub-resources forever
  1. Let clients update sub-resources by modifying the URL at runtime
  1. Consider ways to detect and mitigate badly behaved clients.

Additionally, we can make the resources smaller over the wire by using `gzip` (and perhaps `brotli`) to compress the response. Virtually all clients support this compression scheme, and it would also reduce memory pressure in the file cache, so we might want to just replace the plaintext cache with a compressed cache, and do not support non gzip clients.


## Authoring with IntelliJ IDEA
I use IntelliJ IDEA to author my code.
Here is what I see when I open the reflector.js file:

![img.png](img.png?###)

## Projects
