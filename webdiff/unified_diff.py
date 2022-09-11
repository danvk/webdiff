from dataclasses import dataclass
from itertools import groupby
from typing import Tuple

from unidiff import PatchSet


@dataclass
class Code:
    """Matches DiffRange in webdiff codes.ts"""
    type: str
    """One of "replace" | "delete" | "insert" | "equal" | "skip"."""
    before: Tuple[int, int]
    """Line range on left side; zero-based, half-open interval."""
    after: Tuple[int, int]
    """Line range on right side; zero-based, half-open interval."""


def read_codes(p: PatchSet) -> list:
    pf = p[0]  # PatchedFile
    out = []
    last_source = 0
    last_target = 0

    for hunk in pf:
        if hunk.source_start != last_source + 1:
            out.append(
                Code(
                    "skip",
                    (last_source, hunk.source_start - 1),
                    (last_target, hunk.target_start - 1),
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
                    Code(
                        "equal",
                        (first.source_line_no - 1, last.source_line_no),
                        (first.target_line_no - 1, last.target_line_no),
                    )
                )
            elif type == "-":
                out.append(
                    Code(
                        "delete",
                        (first.source_line_no - 1, last.source_line_no),
                        (last_target, last_target),
                    )
                )
            elif type == "+":
                out.append(
                    Code(
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
        if c.type == 'delete' and i < len(codes) - 1:
            nc = codes[i + 1]
            if nc.type == 'insert':
                out.append(Code(
                    'replace',
                    (c.before[0], nc.before[1]),
                    (c.after[0], nc.after[1]),
                ))
                i += 2
                continue
        out.append(c)
        i += 1

    return out


def diff_to_codes(diff: str, after_num_lines=None) -> list:
    """Convert a unified diff to a list of codes for codediff.js.

    This only considers the first file in the diff.
    """
    p = PatchSet.from_string(diff)
    codes = read_codes(p)

    # Go through and combine sequential delete/insert into "replace"
    codes = add_replaces(codes)

    if after_num_lines:
        (_, a2) = codes[-1].before
        (_, b2) = codes[-1].after
        end_skip = after_num_lines - b2
        if end_skip:
            codes.append(Code(
                'skip',
                (a2, a2 + end_skip),
                (b2, b2 + end_skip),
            ))

    return codes
