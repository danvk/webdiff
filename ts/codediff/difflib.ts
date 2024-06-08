export type OpCode = [
  type: 'replace' | 'delete' | 'insert' | 'equal',
  beforeIdx: number,
  beforeEnd: number,
  afterIdx: number,
  afterEnd: number,
];

function stripLinebreaks(str: string) {
  return str.replace(/^[\n\r]*|[\n\r]*$/g, '');
}

export function stringAsLines(str: string) {
  const lfpos = str.indexOf('\n');
  const crpos = str.indexOf('\r');
  const linebreak = (lfpos > -1 && crpos > -1) || crpos < 0 ? '\n' : '\r';

  const lines = str.split(linebreak);
  for (let i = 0; i < lines.length; i++) {
    lines[i] = stripLinebreaks(lines[i]);
  }

  return lines;
}
