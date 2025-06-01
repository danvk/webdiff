# Trying to make a server that detaches
import os
import subprocess
import sys
import time


def run():
    print('running server...')
    print(f'{sys.argv=}')
    print(f'{os.getpid()=}')
    time.sleep(3)
    print('shutting down.')


def main():
    if os.environ.get('SUB'):
        run()
    else:
        os.environ['SUB'] = '1'
        subprocess.Popen((sys.executable, *sys.argv))
        print('terminating parent process')


if __name__ == '__main__':
    main()
