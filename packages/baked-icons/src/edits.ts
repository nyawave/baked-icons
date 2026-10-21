// Mappings are identical to magic-string with `hires: 'boundary'`.

export class SourceMap {
  readonly version = 3 as const;
  file?: string;
  sources: string[];
  sourcesContent: string[] | undefined;
  names: string[] = [];
  mappings: string;

  constructor(source: string, content: string | undefined, mappings: string) {
    this.sources = [source];
    this.sourcesContent = content === undefined ? undefined : [content];
    this.mappings = mappings;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  toUrl(): string {
    return 'data:application/json;charset=utf-8;base64,' + Buffer.from(this.toString()).toString('base64');
  }
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

export class SourceEdits {
  private readonly edits: Edit[] = [];

  constructor(private readonly code: string) {}

  replace(start: number, end: number, text: string): void {
    this.edits.push({ start, end, text });
  }

  insert(index: number, text: string): void {
    this.edits.push({ start: index, end: index, text });
  }

  get size(): number {
    return this.edits.length;
  }

  apply(source: string, includeContent = true): { code: string; map: SourceMap } {
    const code = this.code;
    // inserts go before a replacement at the same index
    const edits = this.edits
      .map((edit, order) => ({ edit, order }))
      .sort((a, b) => a.edit.start - b.edit.start || +(a.edit.end > a.edit.start) - +(b.edit.end > b.edit.start) || a.order - b.order)
      .map(({ edit }) => edit);

    const out: string[] = [];
    const map = new MappingWriter();
    let pos = 0;
    for (const edit of edits) {
      if (edit.start < pos) throw new Error(`[baked-icons] Internal error: overlapping edits at ${edit.start}.`);
      if (edit.start > pos) {
        map.unchanged(code, pos, edit.start);
        out.push(code.slice(pos, edit.start));
      }
      if (edit.end > edit.start) {
        if (edit.text) map.replaced(edit.text);
        map.skip(code, edit.start, edit.end);
      } else {
        map.inserted(edit.text);
      }
      out.push(edit.text);
      pos = edit.end;
    }
    if (pos < code.length) {
      map.unchanged(code, pos, code.length);
      out.push(code.slice(pos));
    }
    return {
      code: out.join(''),
      map: new SourceMap(source.replace(/\\/g, '/'), includeContent ? code : undefined, map.finish()),
    };
  }
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function isWordChar(c: number): boolean {
  return (c >= 97 && c <= 122) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57) || c === 95;
}

class MappingWriter {
  private out = '';
  private genCol = 0;
  private line = 0;
  private col = 0;
  // VLQ fields are deltas from the previous segment
  private prevGenCol = 0;
  private prevLine = 0;
  private prevCol = 0;
  private lineHasSegment = false;

  unchanged(code: string, from: number, to: number): void {
    let inWord = false;
    for (let i = from; i < to; i++) {
      const c = code.charCodeAt(i);
      if (c === 10) {
        this.newLine();
        this.line++;
        this.col = 0;
        inWord = false;
        continue;
      }
      if (isWordChar(c)) {
        if (!inWord) this.segment(this.line, this.col);
        inWord = true;
      } else {
        this.segment(this.line, this.col);
        inWord = false;
      }
      this.col++;
      this.genCol++;
    }
  }

  replaced(text: string): void {
    let start = 0;
    for (let nl = text.indexOf('\n'); nl >= 0 && nl < text.length - 1; nl = text.indexOf('\n', start)) {
      this.segment(this.line, this.col);
      this.newLine();
      start = nl + 1;
    }
    this.segment(this.line, this.col);
    this.inserted(text.slice(start));
  }

  inserted(text: string): void {
    let start = 0;
    for (let nl = text.indexOf('\n'); nl >= 0; nl = text.indexOf('\n', start)) {
      this.newLine();
      start = nl + 1;
    }
    this.genCol += text.length - start;
  }

  skip(code: string, from: number, to: number): void {
    for (let nl = code.indexOf('\n', from); nl >= 0 && nl < to; nl = code.indexOf('\n', nl + 1)) {
      this.line++;
      this.col = 0;
      from = nl + 1;
    }
    this.col += to - from;
  }

  finish(): string {
    return this.out;
  }

  private newLine(): void {
    this.out += ';';
    this.genCol = 0;
    this.prevGenCol = 0;
    this.lineHasSegment = false;
  }

  private segment(line: number, col: number): void {
    if (this.lineHasSegment) this.out += ',';
    this.lineHasSegment = true;
    this.out += vlq(this.genCol - this.prevGenCol) + 'A' + vlq(line - this.prevLine) + vlq(col - this.prevCol);
    this.prevGenCol = this.genCol;
    this.prevLine = line;
    this.prevCol = col;
  }
}

function vlq(value: number): string {
  let n = value < 0 ? (-value << 1) | 1 : value << 1;
  let s = '';
  do {
    let digit = n & 31;
    n >>>= 5;
    if (n) digit |= 32;
    s += BASE64[digit];
  } while (n);
  return s;
}
