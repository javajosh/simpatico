# Testing

Unit tests for a js library are written in html with testable.js.
Some integration tests for a server are written in bash/curl.
Test automation is done with bash + curl + headless chrome.

```bash
chromium --headless --dump-dom --virtual-time-budget=2000 https://simpatico.local:8443/acceptance
```

If the tests pass, the body is empty.
If the tests don't pass, the body contains a serialized error.

Here is code to use a regex to test for an empty body in the output string:

  ```bash

output=$(chromium --headless --dump-dom --virtual-time-budget=2000 https://simpatico.local:8443/acceptance)

  if [[ -z "$output" ]]; then
    echo "Tests passed"
  else
    echo "Tests failed"
    echo "$output"
    exit 1
  fi
  ```
  if [[ -z "$output" ]]; then
    echo "Tests passed"
  else
    echo "Tests failed"
    echo "$output"
    exit 1
  fi
  ```
