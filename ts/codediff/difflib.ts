/***
This is part of jsdifflib v1.0. <http://snowtide.com/jsdifflib>

Copyright (c) 2007, Snowtide Informatics Systems, Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
  * Neither the name of the Snowtide Informatics Systems nor the names of its
    contributors may be used to endorse or promote products derived from this
    software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
***/
/* Author: Chas Emerick <cemerick@snowtide.com> */
const __whitespace = {' ': true, '\t': true, '\n': true, '\f': true, '\r': true};

export type OpCode = [
  type: 'replace' | 'delete' | 'insert' | 'equal',
  beforeIdx: number,
  beforeEnd: number,
  afterIdx: number,
  afterEnd: number,
];

function defaultJunkFunction(c: string) {
  return __whitespace.hasOwnProperty(c);
}

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
