# Trying to make a server that detaches


import os
import threading
import time


def run():
    print('running server...')
    print(f'{os.getpid()=}')
    time.sleep(3)
    print('shutting down.')


def main():
    server_thread = threading.Thread(target=run)
    server_thread.start()


if __name__ == '__main__':
    main()
