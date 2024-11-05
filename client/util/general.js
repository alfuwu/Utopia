export function distance(a, b) { // used for searching
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++)
    matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++)
    matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + a[i - 1] === b[j - 1] ? 0 : 1
      );

  return matrix[a.length][b.length];
}

function sanitizeHTML(input) {
  return input.replace(/<(?!\/?()>)/g, "&lt;").replace(/>/g, "&gt;");
}

function removeEscapes(text) {
  return text.replace(/\\([\*~_])/g, '$1');
}

export function parseMarkdownToHTML(text) {
  let sanitizedText = sanitizeHTML(text);

  sanitizedText = sanitizedText
    .replace(/(^|[^\\])\*\*(.+?)\*\*/g, '$1<b>$2</b>')
    .replace(/(^|[^\\])\*(.+?)\*/g, '$1<i>$2</i>')
    .replace(/(^|[^\\])~~(.+?)~~/g, '$1<s>$2</s>')
    .replace(/(^|[^\\])__(.+?)__/g, '$1<u>$2</u>')
    .replace(/(^|[^\\])_(.+?)_/g, '$1<i>$2</i>');

  return removeEscapes(sanitizedText);
}

export function parseMarkdownWithVisibleSymbols(text) {
  let sanitizedText = sanitizeHTML(text);

  sanitizedText = sanitizedText
    .replace(/(^|[^\\])\*\*(.+?)\*\*/g, '$1<span style="color:gray;">**</span><b>$2</b><span style="color:gray;">**</span>')
    .replace(/(^|[^\\])\*(.+?)\*/g, '$1<span style="color:gray;">*</span><i>$2</i><span style="color:gray;">*</span>')
    .replace(/(^|[^\\])~~(.+?)~~/g, '$1<span style="color:gray;">~~</span><s>$2</s><span style="color:gray;">~~</span>')
    .replace(/(^|[^\\])__(.+?)__/g, '$1<span style="color:gray;">__</span><u>$2</u><span style="color:gray;">__</span>');

  return removeEscapes(sanitizedText);
}

export class Color {
  r; g; b;
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
  toString(m=1) {
    return `${Math.round(this.r*m)},${Math.round(this.g*m)},${Math.round(this.b*m)}`;
  }
}