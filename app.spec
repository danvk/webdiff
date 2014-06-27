# -*- mode: python -*-
a = Analysis(['app.py'],
             pathex=['/Users/danvk/github/webdiff'],
             hiddenimports=[],
             hookspath=None,
             runtime_hooks=None)

templates = Tree('templates', 'templates')
statics = Tree('static', 'static')

pyz = PYZ(a.pure)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          templates,
          statics,
          name='app',
          debug=False,
          strip=None,
          upx=True,
          console=True )
