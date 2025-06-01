# Trying to make a server that detaches
import os
import subprocess
import sys
import time


def run():
    print('running server...')
    print(f'{os.getpid()=}')
    time.sleep(3)
    print('shutting down.')


def main():
    if len(sys.argv) > 1:
        run()
    else:
        subprocess.Popen((sys.executable, sys.argv[0], 'SUB'))
        print('terminating parent process')


if __name__ == '__main__':
    main()
