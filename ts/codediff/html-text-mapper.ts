export class htmlTextMapper {
  text_: string;
  html_: string;
  constructor(text: string, html: string) {
    this.text_ = text;
    this.html_ = html;
  }

  // Get the substring of HTML corresponding to text.substr(start, len).
  // Leading markup is included with index 0, trailing with the last char.
  getHtmlSubstring(start: number, limit: number) {
    const count = limit - start;
    return html_substr(this.html_, start, count);
  }
}

// Returns the HTML corresponding to text in positions [start, start+count).
// This includes any HTML in that character range, or enclosing it.
// cobbled together from:
// http://stackoverflow.com/questions/6003271/substring-text-with-html-tags-in-javascript?rq=1
// http://stackoverflow.com/questions/16856928/substring-text-with-javascript-including-html-tags
function html_substr(html: string, start: number, count: number) {
  const div = document.createElement('div');
  div.innerHTML = html;
  let consumed = 0;

  walk(div, track);

  function track(el: Text) {
    if (count > 0) {
      let len = el.data.length;
      if (start <= len) {
        el.data = el.substringData(start, len);
        start = 0;
      } else {
        start -= len;
        el.data = '';
      }
      len = el.data.length;
      count -= len;
      consumed += len;
      if (count <= 0) {
        el.data = el.substringData(0, el.data.length + count);
      }
    } else {
      el.data = '';
    }
  }

  function walk(el: Node, fn: (node: Text) => void) {
    let node = el.firstChild;
    let oldNode;
    const elsToRemove = [];
    do {
      if (node?.nodeType === 3) {
        fn(node as Text);
      } else if (node?.nodeType === 1 && node.childNodes.length > 0) {
        walk(node, fn);
      }
      if (consumed == 0 && node?.nodeType == 1) {
        elsToRemove.push(node);
      }
    } while ((node = node?.nextSibling ?? null) && count > 0);

    // remove remaining nodes
    while (node) {
      oldNode = node;
      node = node.nextSibling;
      el.removeChild(oldNode);
    }

    for (const el of elsToRemove) {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }
  }

  return div.innerHTML;
}
