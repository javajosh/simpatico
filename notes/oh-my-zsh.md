
The prompt got really slow, turns out because of [git](./git.md) dirty checking on every prompt.
The workaround is to execute this in the affected repo: `git config oh-my-zsh.hide-dirty 1`
This also may be a Windows WSL2 issue. See [oh my zsh issue 5066](https://github.com/ohmyzsh/ohmyzsh/issues/5066)

Really useful hint for looking deeper into what is happening in that prompt script is executing `set -x`, and other tips
like `exec 2>zsh.err` to redirect output to a file for future commands. From this excellent [stackexchange answer](https://unix.stackexchange.com/a/565927)
