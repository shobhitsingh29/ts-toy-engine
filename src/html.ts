import { AttrMap, DomNode, Element, Text } from "./dom";
import assert from "assert";
import { Utils } from "./utils";

// Parse an HTML document and return the root element.
export function htmlParse(source: string): DomNode {
  const nodes = new HtmlParser(0, source).parseNodes();

  // If the document contains a root element, just return it. Otherwise, create one with root as html element.
  if (nodes.length === 1) {
    return nodes[0];
  } else {
    return Element("html", new Map(), nodes);
  }
}

export class HtmlParser extends Utils {
  parseText(): DomNode {
    const text = this.consumeWhile((s: string) => s !== "<");

    return Text(text);
  }

  parseTagName(): string {
    return this.consumeWhile((s: string) => {
      //any alphanumeric combination
      return /[0-9a-zA-Z]/.test(s);
    });
  }

  // Parse a quoted value.
  parseAttrValue(): string {
    const openQuote = this.consumeChar();
    assert(openQuote === "'" || openQuote === '"');
    const value = this.consumeWhile((s: string) => {
      return s !== openQuote;
    });
    assert(this.consumeChar() === openQuote);
    return value;
  }

  // Parse a single name="value" pair.
  parseAttr(): [string, string] {
    const name = this.parseTagName();
    assert(this.consumeChar() === "=");
    const value = this.parseAttrValue();
    return [name, value];
  }

  // Parse a list of name="value" pairs, separated by whitespace.
  parseAttributes(): AttrMap {
    const attributes = new Map<string, string>();

    while (true) {
      this.consumeWhitespace();
      if (this.currChar() === ">") {
        break;
      }
      const [name, value] = this.parseAttr();
      attributes.set(name, value);
    }
    return attributes;
  }

  // Parse a single element, including its open tag, contents, and closing tag.
  parseElement(): DomNode {
    // opening tag
    assert(this.consumeChar() === "<");
    const tagName = this.parseTagName();
    const attributes = this.parseAttributes();
    assert(this.consumeChar() === ">");

    // contents
    const children = this.parseNodes();

    // closing tag
    assert(this.consumeChar() === "<");
    assert(this.consumeChar() === "/");
    assert(tagName === this.parseTagName());
    assert(this.consumeChar() === ">");
    return Element(tagName, attributes, children);
  }

  // Parse a single node.
  parseNode(): DomNode {
    switch (this.currChar()) {
      case "<":
        return this.parseElement();
      default:
        return this.parseText();
    }
  }

  // Parse a sequence of sibling nodes.
  parseNodes(): DomNode[] {
    const nodes: DomNode[] = [];
    while (true) {
      this.consumeWhitespace();

      if (this.eof() || this.startsWith("</")) {
        break;
      }
      nodes.push(this.parseNode());
    }
    return nodes;
  }
}
