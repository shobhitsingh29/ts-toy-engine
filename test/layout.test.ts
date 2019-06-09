import { BoxType, buildLayoutTree, Dimensions, EdgeSizes, LayoutBox, Rect } from "../src/layout";
import { StyledNode } from "../src/style";
import { elem, text } from "../src/dom";
import { CssValue } from "../src/css";

test("rect", () => {
  expect(new Rect(1, 2, 3, 4).height).toBe(4);
});

test("edge sizes", () => {
  expect(new EdgeSizes(1, 2, 3, 4).bottom).toBe(4);
});

test("dimensions", () => {
  const target = new Rect(1, 2, 3, 4);
  const edge = new EdgeSizes(1, 2, 3, 4);
  expect(new Dimensions(target, edge, edge, edge).content).toBe(target);
});

const oneStyledNode = new StyledNode(
  text("no mean"),
  new Map([["key", new CssValue.Keyword("hoge")]]),
  []
);

test("block node", () => {
  expect(new BoxType.BlockNode(oneStyledNode).format).toBe(BoxType.Format.BlockNode);
});

test("inline node", () => {
  expect(new BoxType.InlineNode(oneStyledNode).format).toBe(BoxType.Format.InlineNode);
});

test("anonymous block", () => {
  expect(new BoxType.AnonymousBlock().format).toBe(BoxType.Format.AnonymousBlock);
});

test("layout box", () => {
  expect(
    new LayoutBox(
      new Dimensions(
        new Rect(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0)
      ),
      new BoxType.AnonymousBlock(),
      []
    ).children
  ).toEqual([]);
});

test("expandedBy", () => {
  expect(new Rect(12, 13, 4, 5).expandedBy(new EdgeSizes(1, 2, 3, 4))).toEqual(
    new Rect(11, 10, 7, 12)
  );
});

test("layout box create", () => {
  expect(() => LayoutBox.Create(new BoxType.AnonymousBlock())).not.toThrow();
});

const exampleDimensions = new Dimensions(
  new Rect(20, 30, 5, 5),
  new EdgeSizes(2, 3, 4, 5),
  new EdgeSizes(2, 3, 4, 5),
  new EdgeSizes(2, 3, 4, 5)
);

test("Dimensions#paddingBox", () => {
  expect(exampleDimensions.paddingBox()).toEqual(new Rect(18, 26, 10, 14));
});

test("Dimensions#borderBox", () => {
  expect(exampleDimensions.borderBox()).toEqual(new Rect(16, 22, 15, 23));
});

test("Dimensions#marginBox", () => {
  expect(exampleDimensions.marginBox()).toEqual(new Rect(14, 18, 20, 32));
});

test("LayoutBox#getInlineContainer anonymous block", () => {
  const layoutBoxAnonymousBlock = new LayoutBox(
    new Dimensions(
      new Rect(1, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0)
    ),
    new BoxType.AnonymousBlock(),
    []
  );
  expect(layoutBoxAnonymousBlock.getInlineContainer()).toEqual(layoutBoxAnonymousBlock);
});

test("LayoutBox#getInlineContainer inline node", () => {
  const layoutBoxInlineNode = new LayoutBox(
    new Dimensions(
      new Rect(1, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0)
    ),
    new BoxType.InlineNode(oneStyledNode),
    []
  );
  expect(layoutBoxInlineNode.getInlineContainer()).toEqual(layoutBoxInlineNode);
});

test("LayoutBox#getInlineContainer block node 1", () => {
  const layoutBoxAnonymousBlock = new LayoutBox(
    new Dimensions(
      new Rect(1, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0)
    ),
    new BoxType.AnonymousBlock(),
    []
  );
  const layoutBoxBlockNode = new LayoutBox(
    new Dimensions(
      new Rect(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0)
    ),
    new BoxType.BlockNode(oneStyledNode),
    [layoutBoxAnonymousBlock]
  );
  expect(layoutBoxBlockNode.getInlineContainer()).toEqual(layoutBoxAnonymousBlock);
});

test("LayoutBox#getInlineContainer block node 2", () => {
  const layoutBoxBlockNode = new LayoutBox(
    new Dimensions(
      new Rect(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0),
      new EdgeSizes(0, 0, 0, 0)
    ),
    new BoxType.BlockNode(oneStyledNode),
    []
  );
  expect(layoutBoxBlockNode.getInlineContainer()).toEqual(
    LayoutBox.Create(new BoxType.AnonymousBlock())
  );
});

test("buildLayoutTree 1", () => {
  const displayNone = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("none")]]),
    []
  );
  expect(() => {
    buildLayoutTree(displayNone);
  }).toThrow();
});

test("buildLayoutTree 2", () => {
  const displayBlock = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("block")]]),
    []
  );
  expect(buildLayoutTree(displayBlock)).toEqual(
    LayoutBox.Create(new BoxType.BlockNode(displayBlock))
  );
});

test("buildLayoutTree 3", () => {
  const displayInline = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("no mean")]]),
    []
  );
  expect(buildLayoutTree(displayInline)).toEqual(
    LayoutBox.Create(new BoxType.InlineNode(displayInline))
  );
});

test("buildLayoutTree 4", () => {
  const childDisplayBlock = new StyledNode(
    elem("no mean", new Map([["id", "target2"]]), []),
    new Map([["display", new CssValue.Keyword("block")]]),
    []
  );
  const displayBlock = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("block")]]),
    [childDisplayBlock]
  );
  expect(buildLayoutTree(displayBlock)).toEqual(
    new LayoutBox(
      new Dimensions(
        new Rect(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0)
      ),
      new BoxType.BlockNode(displayBlock),
      [LayoutBox.Create(new BoxType.BlockNode(childDisplayBlock))]
    )
  );
});

test("buildLayoutTree 5", () => {
  const childDisplayInline = new StyledNode(
    elem("no mean", new Map([["id", "target2"]]), []),
    new Map([["display", new CssValue.Keyword("no mean")]]),
    []
  );
  const displayBlock = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("block")]]),
    [childDisplayInline]
  );
  expect(buildLayoutTree(displayBlock)).toEqual(
    new LayoutBox(
      new Dimensions(
        new Rect(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0)
      ),
      new BoxType.BlockNode(displayBlock),
      [
        new LayoutBox(
          new Dimensions(
            new Rect(0, 0, 0, 0),
            new EdgeSizes(0, 0, 0, 0),
            new EdgeSizes(0, 0, 0, 0),
            new EdgeSizes(0, 0, 0, 0)
          ),
          new BoxType.AnonymousBlock(),
          [LayoutBox.Create(new BoxType.InlineNode(childDisplayInline))]
        )
      ]
    )
  );
});

test("buildLayoutTree 6", () => {
  const childDisplayNone = new StyledNode(
    elem("no mean", new Map([["id", "target2"]]), []),
    new Map([["display", new CssValue.Keyword("none")]]),
    []
  );
  const displayBlock = new StyledNode(
    elem("no mean", new Map([["id", "target"]]), []),
    new Map([["display", new CssValue.Keyword("block")]]),
    [childDisplayNone]
  );
  expect(buildLayoutTree(displayBlock)).toEqual(
    new LayoutBox(
      new Dimensions(
        new Rect(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0),
        new EdgeSizes(0, 0, 0, 0)
      ),
      new BoxType.BlockNode(displayBlock),
      []
    )
  );
});
