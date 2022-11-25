
rem https://developer.chrome.com/blog/headless-chrome/
REM  "c:\Program Files (x86)\Google\Chrome\Application"
chrome \
--headless \                   # Runs Chrome in headless mode.
--disable-gpu \                # Temporarily needed if running on Windows.
--remote-debugging-port=9222 \
http://localhost:8080
echo path
