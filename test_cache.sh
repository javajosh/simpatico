#!/bin/bash

# This script is used to test the cache functionality of the reflector fserver.
# It is quite helpful to NOT be running the server when testing the cache.
TEXT_FILE="temp.html"
LINE_TO_APPEND='\n'"<p>Unique line: $(date +%s%N)"
HTTPS_PORT=8443
USE_CACHE=true
SERVER="node reflector.js '{useCache:$USE_CACHE, debug:true, http:8080, https:$HTTPS_PORT, host:simpatico.local, cert:localhost.crt, key:localhost.key}'"
URL="https://simpatico.local:$HTTPS_PORT/$TEXT_FILE"

# There is clean a non-empty file
if [ -f "$TEXT_FILE" ]; then
    rm "$TEXT_FILE"
    echo "1. Deleted file: $TEXT_FILE"
else
    echo "1. File does not exist: $TEXT_FILE"
fi
if [ ! -f "$TEXT_FILE" ]; then
    touch "$TEXT_FILE"
    echo "<title>Hello</title>\n<h1>Hello</h1>" > "$TEXT_FILE"
    echo "2. Created file: $TEXT_FILE"
else
    echo "2. File exists: $TEXT_FILE"
fi

# There is a server
if ! nc -z localhost $HTTPS_PORT; then
    echo "3. Starting server with command $SERVER"
    # To get more output replace the mess at the end with a simple ampersand
    "$SERVER" >/dev/null 2>&1 &
    SERVER_PID=$!
    sleep 1
else
    echo "3. Server is already running on port $HTTPS_PORT"
fi

# The server cache is warm
echo "4. Warming the cache with $URL"
FILE_CONTENT=$(curl -s -k --compressed "$URL")
if [ -z "$FILE_CONTENT" ]; then
    >&2 echo "4. ERROR: File content is empty.********************************"
    exit 1
else
    echo "4. Success: Cache is warmed."
fi

# The cache is invalidated
echo "$LINE_TO_APPEND" >> "$TEXT_FILE"
echo "5 Append line to $TEXT_FILE: $LINE_TO_APPEND, sleeping for a sec"
sleep 1
# At this point, the reflector in debug mode will log that the cache was invalidated.
# Check the log
#if grep -q "Cache invalidated" reflector.log; then
#    echo "5. Success: Cache was invalidated."
#else
#    >&2 echo "5. ERROR: Cache was not invalidated.********************************"
#fi

# The cache was refreshed.
# The curl options mean:-s is silent,-k means insecure (self-signed certificate) --compressed means to decompress the response (gzip)
echo "6. Requesting $URL"
FILE_CONTENT=$(curl -s -k --compressed "$URL")
if [[ $FILE_CONTENT == *"$LINE_TO_APPEND"* ]]; then
    echo "7. Success: Unique line found in the file."
else
    >&2 echo "7. ERROR: Unique line not found in the file.********************************"
fi

# Cleanup the server process if we started one.
if [ -n "$SERVER_PID" ]; then
    echo "8. Killing the server process with PID: $SERVER_PID"
    kill $SERVER_PID
else
    echo "8. No server process to kill."
fi
