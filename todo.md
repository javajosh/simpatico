<!--head>

</head> -->
# Simpatico: TODO
  1. Fix markdown processing and cache.
   1. Fix Stree regression
  1. Write a test to make sure cache invalidation is working.
     A bash script that appends to a file and then wgets it.
     A good use of ChatGPT
  1. Figure out why chokidar is flaking out.
     Already added DEBUG statements, didn't fire on Windows.
     See if they fire on Linux laptop or on the server.
  1. Design and implement a sub-resource caching scheme.
      1. Filter html response data to add a suffix to all found sub-resource links.
        1. Find all links reliably.
           Keep it simple and adjust the author guide as needed - it doesn't have to be general.
        1. Pick a suffix, like the commit id that last changed the resource.
           One should be able to construct a "canonical URL" something like the github raw link.
           This points out that we should a) use gitlab additionally, and b) consider self-hosting gitlab.
           Otherwise we violate the [Rule of Recapitulation](/notes/rules.md#recapitulation).
           Do not go down the "node git library" rabbit hole.

