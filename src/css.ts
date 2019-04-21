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

export enum Unit {
  Px
}

export namespace CssValue {
  export enum Format {
    Keyword,
    Length,
    ColorValue
  }

  export class Keyword {
    readonly format = Format.Keyword;
    keyword: string;
    constructor(keyword: string) {
      this.keyword = keyword;
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
  }

  export class ColorValue {
    readonly format = Format.ColorValue;
    colorValue: Color;
    constructor(colorValue: Color) {
      this.colorValue = colorValue;
    }
  }
}

export type CssValue = CssValue.Keyword | CssValue.Length | CssValue.ColorValue;
