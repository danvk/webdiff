"""Read webdiff options from the .gitconfig system."""

import json
import subprocess


DEFAULTS = {
    'webdiff': {
        'unified': 8,
        'extraDirDiffArgs': '',
        'extraFileDiffArgs': '',
        'openBrowser': True,
        'port': -1,  # random
        'host': 'localhost',
        'maxDiffWidth': 100,
        'theme': 'googlecode',
        'maxLinesForSyntax': 10_000,
    },
    'webdiff.colors': {
        'insert': '#efe',
        'delete': '#fee',
        'charInsert': '#cfc',
        'charDelete': '#fcc',
    },
    'diff': {
        'algorithm': None,  # aka 'myers'
    }
}


def _get_git_config(key: str, default_value=None):
    is_bool = isinstance(default_value, bool)
    is_int = isinstance(default_value, int)
    try:
        cmd = [
            'git',
            'config',
            *(['--bool-or-int'] if (is_bool or is_int) else []),
            '--get',
            key,
        ]
        result = subprocess.check_output(cmd, universal_newlines=True).strip()
        if is_bool:
            return result == 'true'
        elif is_int:
            return int(result)
        return result
    except subprocess.CalledProcessError as e:
        if e.returncode == 1:
            return default_value
        raise e


def get_config():
    out = {}
    for section_name, section_defaults in DEFAULTS.items():
        section = {}
        for key, default_value in section_defaults.items():
            this_key = f'{section_name}.{key}'
            v = _get_git_config(this_key, default_value)
            section[key] = v
        out[section_name] = section

    return out


if __name__ == '__main__':
    print(json.dumps(get_config(), indent=2))
