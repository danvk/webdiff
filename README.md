# git webdiff for COI

Two-column web-based git difftool for [Chromium Open IDE](https://microsoftedge.microsoft.com/addons/detail/chromium-open-ide/ggfoollpnfolfaejalpiihpobcpbegkl)(COI).

**Features include:**
* Side-by-side (two column) diff view.
* Runs in the browser of your choice on any platform.
* Syntax highlighting via `highlight.js`.
* Step back and forth through multiple files in a single diff.

<!-- This is `git webdiff 05157bba^..05157bba`, in this repo -->
![Screenshot of webdiff in action](https://github.com/song-fangzhen/webdiff/blob/master/images/webdiff.png)

*Tips: this project is forked from [danvk/webdiff](https://github.com/danvk/webdiff).*

## Installation

    pip install webdiffForCOI

## Usage

Instead of running "git diff", run:

    git webdiff

You can also start webdiff via:

    git webdiff [args]

You can pass all the same arguments that you would to `git diff`, e.g.
`1234..5678` or `HEAD`.

`webdiff` can also be invoked directly to diff two directories or files:

    webdiff <left_dir> <right_dir>
    webdiff <left_file> <right_file>

You can also use `webdiff` to view GitHub pull requests:

    webdiff https://github.com/owner/repo/pull/123
    webdiff #123  # if you're in a git repo with a github remote

This will download the files relevant to the Pull Request and run `webdiff`.

If you run into GitHub API quota limits or you'd like to use webdiff with
private repos, you can set your credentials in a `.githubrc` file:

```
user.login: yourusername
user.token: your-personal-access-tokens
```

Make sure you chmod this file to only be readable by yourself. You can generate
a personal access token for webdiff via github.com → profile → Settings →
Personal access tokens. Make sure to grant all the "repo" privileges.

**Enjoy!**