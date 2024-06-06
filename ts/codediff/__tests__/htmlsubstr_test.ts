/** @jest-environment jsdom */
import $ from 'jquery';
import { htmlTextMapper } from "../html-text-mapper";

(globalThis as any).$ = $;

test('basic functionality', () => {
  var html = 'foo<span>bar</span>baz';
  var text = $('<div>').html(html).text();
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 0)).toEqual('');
  expect(map.getHtmlSubstring(0, 1)).toEqual('f');
  expect(map.getHtmlSubstring(0, 2)).toEqual('fo');
  expect(map.getHtmlSubstring(0, 3)).toEqual('foo');
  expect(map.getHtmlSubstring(0, 4)).toEqual('foo<span>b</span>');
  expect(map.getHtmlSubstring(0, 5)).toEqual('foo<span>ba</span>');
  expect(map.getHtmlSubstring(0, 6)).toEqual('foo<span>bar</span>');
  expect(map.getHtmlSubstring(0, 7)).toEqual('foo<span>bar</span>b');
  expect(map.getHtmlSubstring(0, 8)).toEqual('foo<span>bar</span>ba');
  expect(map.getHtmlSubstring(0, 9)).toEqual('foo<span>bar</span>baz');
});

test('leading/trailing html', () => {
  var html = '<p>foo<span>bar</span>baz</p>';
  var text = $('<div>').html(html).text();
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 0)).toEqual('');
  expect(map.getHtmlSubstring(0, 1)).toEqual('<p>f</p>');
  expect(map.getHtmlSubstring(0, 2)).toEqual('<p>fo</p>');
  expect(map.getHtmlSubstring(0, 3)).toEqual('<p>foo</p>');
  expect(map.getHtmlSubstring(0, 4)).toEqual('<p>foo<span>b</span></p>');
  expect(map.getHtmlSubstring(0, 5)).toEqual('<p>foo<span>ba</span></p>');
  expect(map.getHtmlSubstring(0, 6)).toEqual('<p>foo<span>bar</span></p>');
  expect(map.getHtmlSubstring(0, 7)).toEqual('<p>foo<span>bar</span>b</p>');
  expect(map.getHtmlSubstring(0, 8)).toEqual('<p>foo<span>bar</span>ba</p>');
  expect(map.getHtmlSubstring(0, 9)).toEqual('<p>foo<span>bar</span>baz</p>');
});

test('leading/trailing html, fixed right', () => {
  var html = '<p>foo<span>bar</span>baz</p>';
  var text = $('<div>').html(html).text();
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 9)).toEqual('<p>foo<span>bar</span>baz</p>');
  expect(map.getHtmlSubstring(1, 9)).toEqual( '<p>oo<span>bar</span>baz</p>');
  expect(map.getHtmlSubstring(2, 9)).toEqual(  '<p>o<span>bar</span>baz</p>');
  expect(map.getHtmlSubstring(3, 9)).toEqual(   '<p><span>bar</span>baz</p>');
  expect(map.getHtmlSubstring(4, 9)).toEqual(    '<p><span>ar</span>baz</p>');
  expect(map.getHtmlSubstring(5, 9)).toEqual(     '<p><span>r</span>baz</p>');
  expect(map.getHtmlSubstring(6, 9)).toEqual(                   '<p>baz</p>');
  expect(map.getHtmlSubstring(7, 9)).toEqual(                    '<p>az</p>');
  expect(map.getHtmlSubstring(8, 9)).toEqual(                     '<p>z</p>');
  expect(map.getHtmlSubstring(9, 9)).toEqual(                             '');
});

test('small html, all ranges', () => {
  var html = '<q>xx</q>';
  var text = $('<div>').html(html).text();
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 0)).toEqual('');
  expect(map.getHtmlSubstring(0, 1)).toEqual('<q>x</q>');
  expect(map.getHtmlSubstring(0, 2)).toEqual('<q>xx</q>');
  expect(map.getHtmlSubstring(1, 2)).toEqual('<q>x</q>');
  expect(map.getHtmlSubstring(2, 2)).toEqual('');
});

test('html with entities', () => {
  var html = 'x&lt;y';
  var text = $('<div>').html(html).text();
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 0)).toEqual('');
  expect(map.getHtmlSubstring(0, 1)).toEqual('x');
  expect(map.getHtmlSubstring(0, 2)).toEqual('x&lt;');
  expect(map.getHtmlSubstring(0, 3)).toEqual('x&lt;y');
  expect(map.getHtmlSubstring(1, 1)).toEqual('');
  expect(map.getHtmlSubstring(1, 2)).toEqual('&lt;');
  expect(map.getHtmlSubstring(1, 3)).toEqual('&lt;y');
  expect(map.getHtmlSubstring(2, 2)).toEqual('');
  expect(map.getHtmlSubstring(2, 3)).toEqual('y');
});

test('consecutive tags', () => {
  var html = '<a><b>xx</b></a>';
  var text = $('<div>').html(html).text();
  expect(text.length).toEqual(2);
  var map = new htmlTextMapper(text, html);

  expect(map.getHtmlSubstring(0, 0)).toEqual('');
  expect(map.getHtmlSubstring(0, 1)).toEqual('<a><b>x</b></a>');
  expect(map.getHtmlSubstring(0, 2)).toEqual('<a><b>xx</b></a>');
  expect(map.getHtmlSubstring(1, 1)).toEqual('');
  expect(map.getHtmlSubstring(1, 2)).toEqual('<a><b>x</b></a>');
  expect(map.getHtmlSubstring(2, 2)).toEqual('');
});
