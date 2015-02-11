from setuptools import setup, find_packages

setup(name='webdiff',
      version='0.9.0',
      description='Two-column web-based git difftool',
      author='Dan Vanderkam',
      author_email='danvdk@gmail.com',
      url='https://github.com/danvk/webdiff/',
      entry_points={
          'console_scripts': [
              'webdiff = webdiff.app:run',
              'git-webdiff = webdiff.gitwebdiff:run'
          ],
      },
      packages=find_packages(exclude=['tests*']),
      install_requires=['flask', 'pillow', 'PyGithub==1.25.2'],
      include_package_data=True,
      package_data = {
          'static': 'webdiff/static/*',
          'templates': 'webdiff/templates/*'
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
