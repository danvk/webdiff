from setuptools import setup, find_packages

setup(name='git-webdiff',
      version='0.2',
      description='Two-column web-based git difftool',
      author='Dan Vanderkam',
      author_email='danvdk@gmail.com',
      url='https://github.com/danvk/webdiff/',
      py_modules=['app'],
      entry_points={
          'console_scripts': [
              'git-webdiff = app:run',
          ],
      },
      packages=find_packages(),
      install_requires=['flask'],
      include_package_data=True,
      classifiers=[
          'Environment :: Console'
      ],
)
