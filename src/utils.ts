const isWhitespace = require("is-whitespace-character");

export class Utils {
  pos: number;
  input: string;

  constructor(pos: number, input: string) {
    this.pos = pos;
    this.input = input;
  }

  eof(): boolean {
    return this.pos >= this.input.length;
  }

  currChar(): string {
    return this.input[this.pos];
  }

  consumeChar(): string {
    const currentPos = this.pos;
    this.pos += 1;
    return this.input[currentPos];
  }

  // Do the next characters start with the given string?
  startsWith(s: string): boolean {
    return this.input.slice(this.pos).startsWith(s);
  }

  // Consume characters until `test` returns false.
  consumeWhile(test: Function): string {
    let result = "";
    while (!this.eof() && test(this.currChar())) {
      result += this.consumeChar();
    }
    return result;
  }

  consumeWhitespace() {
    return this.consumeWhile(isWhitespace);
  }
}
