'''Utility code for webdiff'''

textchars = ''.join(map(chr, [7,8,9,10,12,13,27] + range(0x20, 0x100)))
is_binary_string = lambda bytes: bool(bytes.translate(None, textchars))

def is_binary_file(filename):
  return is_binary_string(open(filename, 'rb').read(1024))
