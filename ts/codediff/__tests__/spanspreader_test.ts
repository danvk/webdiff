/** @jest-environment jsdom */
import {distributeSpans} from '../dom-utils';

test('span spreads across lines', () => {
  const html = '<span class=jsdoc>foo\nbar</span>';
  const lines = distributeSpans(html);
  expect(['<span class=jsdoc>foo</span>', '<span class=jsdoc>bar</span>']).toEqual(lines);
});

test('nested spans', () => {
  const html = '<span class=jsdoc>foo\n<span>bar</span> blah</span>';
  const lines = distributeSpans(html);
  expect([
    '<span class=jsdoc>foo</span>',
    '<span class=jsdoc><span>bar</span> blah</span>',
  ]).toEqual(lines);
});

test('multiple multi-line spans', () => {
  const html = '<span class=jsdoc>foo<span>blah\nbar</span>\nbaz</span>';
  const lines = distributeSpans(html);
  expect(lines).toEqual([
    '<span class=jsdoc>foo<span>blah</span></span>',
    '<span class=jsdoc><span>bar</span></span>',
    '<span class=jsdoc>baz</span>',
  ]);
});
