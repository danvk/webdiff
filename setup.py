from setuptools import setup, find_packages

setup(name='webdiff',
      version='0.2',
      description='Two-column web-based git difftool',
      author='Dan Vanderkam',
      author_email='danvdk@gmail.com',
      url='https://github.com/danvk/webdiff/',
      py_modules=['app'],
      entry_points={
          'console_scripts': [
              'webdiff = app:run',
          ],
      },
      packages=find_packages(),
      install_requires=['flask'],
      include_package_data=True,
      package_data = { '': ['static/*', 'templates/*' ] },
      classifiers=[
          'Environment :: Console',
          'Environment :: Web Environment',
          'Framework :: Flask',
          'Development Status :: 3 - Alpha',
          'Intended Audience :: Developers',
          'License :: OSI Approved :: Apache Software License',
          'Topic :: Software Development :: Version Control'
      ],
)
