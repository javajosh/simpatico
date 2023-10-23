git is pretty straightforward on linux/ubuntu. use `apt` to install and update.

On Windows it is more complicated. [intellij](intellij.md) will use the Windows version, which you can install with chocolatey. But windows/wsl/ubuntu will use the `apt` installed version. Of particular interest to [oh my zsh](oh-my-zsh.md) users is that the linux git command is executed on every prompt.

Another point of complexity is authorization.
Since Aug 2023 github forbids password authentication.
In practice this means that github wants to generate your password (what they call a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)). You then [use it as a password](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#using-a-personal-access-token-on-the-command-line) for subsequent git commands.

# Accounts, organizations and repos.
You have a github account. It's personal, and it's the one you use to fork and star and occasionally create and push to your own repos.

Eventually you want to push packages, and you may want to use an organizational account.
Github's solution is to create an organization with an owner.
This organization can then have other members.
In all other ways it functions like an account, in particular can host it's own repositories separate from any particular user's account.
There may also be other benefits to an organization, as it can be more (mission) focused rather than merely a locus of one person's general activity.

Access to user repos is unqualified. Access to organization repos is qualified by the organization. E.g. `git clone simpatico` vs `git clone simpaticode/simpaticode`.

# Which is better, ssh or https?
Both SSH and HTTPS have their advantages and disadvantages when it comes to using them as Git remotes. The choice between the two depends on your specific needs and preferences. Here are some factors to consider:

**Advantages of using HTTPS:**
- Easier to set up, especially for users who are new to Git[1][2][6].
- Less likely to be blocked by firewalls[1].
- Provides secure connections, just like SSH, as long as the underlying keys are secured[2].

**Advantages of using SSH:**
- More secure, as it uses public-key cryptography and is less vulnerable to man-in-the-middle attacks[3][5].
- Requires a one-time setup, making it more convenient for frequent Git operations[3].
- Allows for more flexibility and control, such as using different keys for different repositories[4].

In general, if you are a beginner or your organization prefers ease of use and interoperability, HTTPS may be the better option. On the other hand, if you prioritize security and have more advanced Git needs, SSH might be the preferred choice. I resist the urge to do the "more secure" [ssh option](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) and just use `https`.

Citations:
[1] https://stackoverflow.com/questions/11041729/git-clone-with-https-or-ssh-remote
[2] https://www.howtogeek.com/devops/should-you-use-https-or-ssh-for-git/
[3] https://phoenixnap.com/kb/git-ssh-vs-https
[4] https://www.reddit.com/r/webdev/comments/wj7i59/noob_question_connecting_to_github_with_https_or/
[5] https://superuser.com/questions/1526712/why-is-ssh-safer-than-https-on-direct-connections-to-a-git-repository-with-crede
[6] https://github.com/cli/cli/discussions/5532
