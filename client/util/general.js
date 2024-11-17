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
  rgbToHsl() {
    const r = this.r / 255;
    const g = this.g / 255;
    const b = this.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l;

    l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }

      h *= 60; // Convert to degrees
    }

    return { h, s, l };
  }
  hslToRgb(h, s, l) {
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, h / 360 + 1 / 3);
      g = hueToRgb(p, q, h / 360);
      b = hueToRgb(p, q, h / 360 - 1 / 3);
    }
    
    return { r: r * 255, g: g * 255, b: b * 255 };
  }
  modifyHsl(hDelta = 0, sDelta = 0, lDelta = 0) {
    const { h, s, l } = this.rgbToHsl();
    const newH = (h + hDelta) % 360;
    const newS = Math.min(Math.max(s + sDelta, 0), 1); // Clamp between 0 and 1
    const newL = Math.min(Math.max(l + lDelta, 0), 1); // Clamp between 0 and 1

    const { r, g, b } = this.hslToRgb(newH, newS, newL);
    console.log(r, g, b);
    return new Color(r, g, b);
  }
  toString(m=1, s=0) {
    return `${Math.round(Math.pow(this.r,m))-s},${Math.round(Math.pow(this.g,m))-s},${Math.round(Math.pow(this.b,m))-s}`;
  }
}