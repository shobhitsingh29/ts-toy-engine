import assert from "assert";
import { Utils } from "./utils";

export enum Unit {
  px,
  em,
  rem,
}

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
}

export namespace CssValue {
  export enum Format {
    Keyword,
    Length,
    ColorValue,
  }

  export class Keyword {
    readonly format = Format.Keyword;
    keyword: string;
    constructor(keyword: string) {
      this.keyword = keyword;
    }
    toPx(): number {
      return 0.0;
    }
  }
  export class Length {
    readonly format = Format.Length;
    length: number;
    unit: Unit;
    constructor(length: number, unit: Unit) {
      this.length = length;
      this.unit = unit;
    }
    toPx(): number {
      switch (this.unit) {
        case Unit.em:
          return 0.0;
        case Unit.px:
          return this.length;
        case Unit.rem:
          return 0.0;
      }
    }
  }
  export class ColorValue {
    readonly format = Format.ColorValue;
    colorValue: Color;
    constructor(colorValue: Color) {
      this.colorValue = colorValue;
    }

    toPx(): number {
      return 0.0;
    }
  }
}
export type CssValue = CssValue.Keyword | CssValue.Length | CssValue.ColorValue;

export type Specificity = [number, number, number];

export class SimpleSelector {
  tagName: string | null;
  id: string | null;
  classValue: string[];

  constructor(tagName: string | null, id: string | null, classValue: string[]) {
    this.id = id;
    this.classValue = classValue;
    this.tagName = tagName;
  }

  specificity(): Specificity {
    // http://www.w3.org/TR/selectors/#specificity
    const a = this.id === null ? 0 : 1;
    const b = this.classValue.length;
    // NOTE: no support for chained selectors now.
    const c = this.tagName === null ? 0 : 1;

    return [a, b, c];
  }
}

export namespace Selector {
  export enum Format {
    Simple,
  }

  export class Simple {
    readonly format = Format.Simple;
    selector: SimpleSelector;
    constructor(selector: SimpleSelector) {
      this.selector = selector;
    }
  }
}
export type Selector = Selector.Simple;

export class Declarations {
  name: string;
  value: CssValue;

  constructor(name: string, value: CssValue) {
    this.name = name;
    this.value = value;
  }
}

export class Rule {
  selectors: Selector[];
  declarations: Declarations[];
  constructor(selectors: Selector[], declarations: Declarations[]) {
    this.selectors = selectors;
    this.declarations = declarations;
  }
}

export class StyleSheet {
  rules: Rule[];
  constructor(rules: Rule[]) {
    this.rules = rules;
  }
}

export class Declaration {
  name: string;
  value: CssValue;
  constructor(name: string, value: CssValue) {
    this.name = name;
    this.value = value;
  }
}

/*___________________________CSS PARSER________________________________*/


export class CssParser extends Utils {

  // Parse a property name or keyword.
  parseIdentifier(): string {
    return this.consumeWhile(cssValidIdentifierChar);
  }

  parseUnit(): Unit {
    const unit = this.parseIdentifier().toLowerCase();
    switch (unit) {
      case "em":
        return Unit.em;
        case "rem":
        return Unit.rem;
      case "px":
        return Unit.px;
      default:
        throw new Error(`unrecognized unit: ${unit}`);
    }
  }

  parseFloat(): number {
    const numberString = this.consumeWhile((s: string) => {
      return /[0-9\.]/.test(s);
    });
    return Number(numberString);
  }

  parseLength(): CssValue {
    return new CssValue.Length(this.parseFloat(), this.parseUnit());
  }


  parseHexPair(): number {
    const s = this.input.slice(this.pos, this.pos + 2);
    this.pos += 2;
    return parseInt(s, 16);
  }

  parseColor(): CssValue {
    assert(this.consumeChar() === "#");
    return new CssValue.ColorValue(
      new Color(this.parseHexPair(), this.parseHexPair(), this.parseHexPair(), 255)
    );
  }

  parseValue(): CssValue {
    const s = this.currChar();
    if (/[0-9]/.test(s)) {
      return this.parseLength();
    } else if (s === "#") {
      return this.parseColor();
    } else {
      return new CssValue.Keyword(this.parseIdentifier());
    }
  }

// Parse one `<property>: <value>;` declaration.
  parseDeclaration(): Declaration {
    const propertyName = this.parseIdentifier();
    this.consumeWhitespace();
    assert(this.consumeChar() === ":");
    this.consumeWhitespace();
    const value = this.parseValue();
    this.consumeWhitespace();
    assert(this.consumeChar() === ";");
    return new Declaration(propertyName, value);
  }

  // Parse a list of declarations enclosed in `{ ... }`.
  parseDeclarations(): Declaration[] {
    assert(this.consumeChar() === "{");
    const declarations: Declaration[] = [];
    while (true) {
      this.consumeWhitespace();
      if (this.currChar() === "}") {
        this.consumeChar();
        break;
      }
      declarations.push(this.parseDeclaration());
    }
    return declarations;
  }

  // Parse one simple selector, e.g.: `type#id.class1.class2.class3`
  parseSimpleSelector(): SimpleSelector {
    const selector = new SimpleSelector(null, null, []);
    while (!this.eof()) {
      const s = this.currChar();
      if (s === "#") {
        this.consumeChar();
        selector.id = this.parseIdentifier();
      } else if (s === ".") {
        this.consumeChar();
        selector.classValue.push(this.parseIdentifier());
      } else if (s === "*") {
        // universal selector
        this.consumeChar();
      } else if (cssValidIdentifierChar(s)) {
        selector.tagName = this.parseIdentifier();
      } else {
        break;
      }
    }
    return selector;
  }

  // Parse a comma-separated list of selectors.
  parseSelectors(): Selector[] {
    const selectors: Selector[] = [];
    // loop
    while_true: while (true) {
      selectors.push(new Selector.Simple(this.parseSimpleSelector()));
      this.consumeWhitespace();
      const s = this.currChar();
      switch (s) {
        case ",":
          this.consumeChar();
          this.consumeWhitespace();
          break;
        case "{":
          break while_true;
        default:
          throw new Error(`Unexpected character ${s} in selector list`);
      }
    }

    // Return selectors with highest specificity first, for use in matching.
    return selectors.sort((a, b) => {
      const [aSpecificityA, aSpecificityB, aSpecificityC] = a.selector.specificity();
      const [bSpecificityA, bSpecificityB, bSpecificityC] = b.selector.specificity();
      if (bSpecificityA < aSpecificityA) {
        return -1;
      } else if (aSpecificityA < bSpecificityA) {
        return 1;
      }
      if (bSpecificityB < aSpecificityB) {
        return -1;
      } else if (aSpecificityB < bSpecificityB) {
        return 1;
      }
      if (bSpecificityC < aSpecificityC) {
        return -1;
      } else if (aSpecificityC < bSpecificityC) {
        return 1;
      }
      return 1;
    });
  }

  // Parse a rule set: `<selectors> { <declarations> }`.
  parseRule(): Rule {
    return new Rule(this.parseSelectors(), this.parseDeclarations());
  }

  // Parse a list of rule sets, separated by optional whitespace.
  parseRules(): Rule[] {
    const rules: Rule[] = [];
    while (true) {
      this.consumeWhitespace();
      if (this.eof()) {
        break;
      }
      rules.push(this.parseRule());
    }
    return rules;
  }
}

export function cssValidIdentifierChar(s: string): boolean {
  return /[0-9a-zA-Z_\-]/.test(s);// 0-9, a-z, A-Z,_,-
}


// Parse a whole CSS stylesheet.
export function cssParse(s: string): StyleSheet {
  const parser = new CssParser(0, s);
  return new StyleSheet(parser.parseRules());
}
