"""Parse command line arguments to webdiff."""
import argparse
import os
import re

import github_fetcher

class UsageError(Exception):
    pass

USAGE = (
'''Usage: webdiff <left_dir> <right_dir>
       webdiff <left_file> <right_file>
       webdiff https://github.com/<owner>/<repo>/pull/<num>

Or run "git webdiff" from a git repository.
''')

# e.g. https://github.com/danvk/dygraphs/pull/292
PULL_REQUEST_RE = re.compile(r'http[s]://(?:www.)?github.com\/([^/]+)/([^/]+)/pull/([0-9]+)(?:/.*)?')
PULL_REQUEST_NUM_RE = re.compile(r'^#([0-9]+)$')

def parse(args):
    """Returns {port, dirs: [], files: [], pr: {owner, repo, number}}."""
    parser = argparse.ArgumentParser(description='Run webdiff.', usage=USAGE)
    parser.add_argument('--port', '-p', type=int, help="Port to run webdiff on.", default=-1)
    parser.add_argument('dirs', type=str, nargs='+',
                        help="Directories to diff, or a github pull request URL.")
    args = parser.parse_args(args=args)

    out = {}
    if args.port != -1:
        out['port'] = args.port

    if len(args.dirs) > 2:
        raise UsageError('You must specify two files/dirs (got %d)' % len(args.dirs))

    if len(args.dirs) == 1:
        # must be a github pull request URL
        owner, repo, num = None, None, None
        m = re.match(PULL_REQUEST_RE, args.dirs[0])
        if m:
            owner, repo, num = m.groups()

        # Or perhaps something simpler like '#292'?
        m = re.match(PULL_REQUEST_NUM_RE, args.dirs[0])
        if m:
            num = int(m.group(1))
            owner, repo, num = github_fetcher.get_pr_repo(num)

        if not owner:
            raise UsageError('You must either specify two files, two '
                             'directories or a github pull request URL/#number')
        out['github'] = {'owner': owner, 'repo': repo, 'num': int(num)}

    else:
        a, b = args.dirs
        for x in (a, b):
            if not os.path.exists(x):
                raise UsageError('"%s" does not exist' % x)

        a_dir = os.path.isdir(a)
        b_dir = os.path.isdir(b)
        if a_dir and not b_dir:
            raise UsageError('"%s" is a directory but "%s" is not' % (a, b))
        if not a_dir and b_dir:
            raise UsageError('"%s" is a directory but "%s" is not' % (b, a))

        if a_dir and b_dir:
            out['dirs'] = (a, b)
        else:
            out['files'] = (a, b)

    return out
