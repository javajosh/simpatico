
# Tmux
ctrl+b s to list sessions.

https://superuser.com/questions/209437/how-do-i-scroll-in-tmux
`ctrl+b [` to scroll up.
```text
Function                     vi              emacs
--------                     --              -----
Half page down               C-d             M-Down
Half page up                 C-u             M-Up
Next page                    C-f             Page down
Previous page                C-b             Page up
Scroll down                  C-Down or C-e   C-Down
Scroll up                    C-Up or C-y     C-Up
Search again                 n               n
Search again in reverse      N               N
Search backward              ?               C-r
Search forward               /               C-s

Ctrl+B D — Detach from the current session.
Ctrl+B % — Split the window into two panes horizontally.
Ctrl+B " — Split the window into two panes vertically.
Ctrl+B Arrow Key (Left, Right, Up, Down) — Move between panes.
Ctrl+B X — Close pane.
Ctrl+B C — Create a new window.
Ctrl+B N or P — Move to the next or previous window.
Ctrl+B 0 (1,2...) — Move to a specific window by number.
Ctrl+B : — Enter the command line to type commands. Tab completion is available.
Ctrl+B ? — View all keybindings. Press Q to exit.
Ctrl+B W — Open a panel to navigate across windows in multiple sessions.

```

Q: why are new sessions constantly being added to my persistent tmux session?
