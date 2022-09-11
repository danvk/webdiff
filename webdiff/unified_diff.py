from itertools import groupby

from unidiff import PatchSet


def read_codes(p: PatchSet) -> list:
    pf = p[0]  # PatchedFile
    out = []
    last_source = 1
    last_target = 1

    for hunk in pf:
        if hunk.source_start != last_source:
            out.append(
                (
                    "skip",
                    (last_source - 1, hunk.source_start - 1),
                    (last_target - 1, hunk.target_start - 1),
                )
            )
            last_source = hunk.source_start
            last_target = hunk.target_start

        for type, chunk in groupby(hunk, lambda line: line.line_type):
            lines = [*chunk]
            first = lines[0]
            last = lines[-1]
            if type == " ":
                out.append(
                    (
                        "equal",
                        (first.source_line_no - 1, last.source_line_no),
                        (first.target_line_no - 1, last.target_line_no),
                    )
                )
            elif type == "-":
                out.append(
                    (
                        "delete",
                        (first.source_line_no - 1, last.source_line_no),
                        (last_target, last_target),
                    )
                )
            elif type == "+":
                out.append(
                    (
                        "insert",
                        (last_source, last_source),
                        (first.target_line_no - 1, last.target_line_no),
                    )
                )
            last_source = last.source_line_no or last_source
            last_target = last.target_line_no or last_target

    # We don't have enough context to know whether there's a skip at the end
    # (missing the number of lines in the file).
    return out


def add_replaces(codes: list) -> list:
    """Replace paired delete + insert codes with replace."""
    out = []
    i = 0
    while i < len(codes):
        c = codes[i]
        if c[0] == 'delete' and i < len(codes) - 1:
            nc = codes[i + 1]
            if nc[0] == 'insert':
                out.append((
                    'replace',
                    (c[1][0], nc[1][1]),
                    (c[2][0], nc[2][1]),
                ))
                i += 2
                continue
        out.append(c)
        i += 1

    return out


def diff_to_codes(diff: str) -> list:
    """Convert a unified diff to a list of codes for codediff.js.

    This only considers the first file in the diff.
    """
    p = PatchSet.from_string(diff)
    codes = read_codes(p)

    # Go through and combine sequential delete/insert into "replace"
    codes = add_replaces(codes)

    return codes
