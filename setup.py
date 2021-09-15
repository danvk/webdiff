from setuptools import setup, find_packages


with open('README.md', encoding='utf8') as fh:
    long_description = fh.read()


setup(name='webdiffForCOI',
      version='0.15.6',
      description='Two-column web-based git difftool',
      long_description=long_description,
      long_description_content_type='text/markdown',
      author='Fangzhen Song',
      author_email='songfangzhen@bytedance.com',
      url='https://github.com/song-fangzhen/webdiff/',
      download_url='https://github.com/song-fangzhen/webdiff/archive/refs/tags/v0.15.0.tar.gz',
      entry_points={
          'console_scripts': [
              'webdiff = webdiff.app:run',
              'git-webdiff = webdiff.gitwebdiff:run'
          ],
      },
      packages=find_packages(exclude=['tests*']),
      install_requires=[
          'binaryornot',
          'flask',
          'pillow',
          'requests',
          'PyGithub==1.25.2'
      ],
      include_package_data=True,
      package_data = {
          'static': ['webdiff/static/*'],
          'templates': ['webdiff/templates/*']
      },
      classifiers=[
          'Environment :: Console',
          'Environment :: Web Environment',
          'Framework :: Flask',
          'Development Status :: 4 - Beta',
          'Intended Audience :: Developers',
          'License :: OSI Approved :: Apache Software License',
          'Topic :: Software Development :: Version Control'
      ],
)
