describe("Scala upstream grammar regressions", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-scala");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.scala"));
  });

  afterEach(() => editor?.destroy());

  async function parse(text) {
    editor.setText(text);
    expect(await editor.whenGrammarSettled()).toBe(true);
    const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
    expect(root.hasError).toBe(false);
    return root;
  }

  it("retains stars on expanded infix arguments in both Scala dialects", async () => {
    const root = await parse("foo(a ++ b*)\nbar(a ++ b: _*)\nfoo(xs: _ *)\n");
    expect(root.descendantsOfType("vararg").map((node) => node.text)).toEqual([
      "a ++ b*",
      "a ++ b: _*",
      "xs: _ *",
    ]);
  });

  it("binds a colon argument to the right operand of an operator", async () => {
    const root = await parse("def f =\n  !a || xs.forall: x =>\n    g(x)\n");
    const expression = root.descendantsOfType("infix_expression")[0];
    expect(expression.childForFieldName("right").type).toBe("call_expression");
    expect(expression.childForFieldName("right").descendantsOfType("colon_argument").length).toBe(
      1,
    );
  });

  it("continues word operators and symbolic operators across line breaks", async () => {
    const root = await parse(
      "object O:\n  def a =\n    xs getOrElse\n      fallback\n" +
        "  def b =\n    x\n    ||\n      y\n",
    );
    expect(root.descendantsOfType("function_definition").length).toBe(2);
    expect(
      root
        .descendantsOfType("infix_expression")
        .map((node) => node.childForFieldName("operator").text),
    ).toEqual(["getOrElse", "||"]);
  });

  it("attaches a braced match end marker to its match expression", async () => {
    const root = await parse(
      "object O:\n  def f = g {\n    v match\n    case r =>\n      if a then\n        b\n      else\n        c\n    end match\n  }\n",
    );
    expect(root.descendantsOfType("end_marker")[0].parent.type).toBe("match_expression");
  });

  it("binds multiplication inside addition", async () => {
    editor.setText("val value = a + b * c\n");
    await editor.languageMode.ready;
    const root = editor.languageMode.tree.rootNode;
    expect(root.hasError).toBe(false);
    const expression = root
      .descendantsOfType("infix_expression")
      .find((node) => node.text === "a + b * c");
    expect(expression.childForFieldName("left").text).toBe("a");
    expect(expression.childForFieldName("right").text).toBe("b * c");
  });

  it("parses and scopes XML literals with Scala expressions", async () => {
    editor.setText('val page = <item id="one">{value}</item>\n');
    await editor.languageMode.ready;
    const root = editor.languageMode.tree.rootNode;
    expect(root.hasError).toBe(false);
    expect(root.descendantsOfType("xml_expression").length).toBe(1);
    expect(editor.scopeDescriptorForBufferPosition([0, 12]).getScopesArray()).toContain(
      "entity.name.tag.scala",
    );
    expect(editor.scopeDescriptorForBufferPosition([0, 17]).getScopesArray()).toContain(
      "entity.other.attribute-name.scala",
    );
  });

  it("keeps Scala 2 export identifiers distinct from Scala 3 export clauses", async () => {
    editor.setText("package example.export\nobject A { export B.foo; val export = 1 }\n");
    expect(await editor.whenGrammarSettled()).toBe(true);
    const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
    expect(root.hasError).toBe(false);
    expect(root.descendantsOfType("export_declaration").length).toBe(1);
    const definition = root.descendantsOfType("val_definition")[0];
    expect(definition.childForFieldName("pattern").text).toBe("export");
  });

  it("keeps dedented enumerators inside a braced for comprehension", async () => {
    editor.setText("val result = for {\n    x <- xs\n  y <- ys\n} yield (x, y)\n");
    expect(await editor.whenGrammarSettled()).toBe(true);
    const root = editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
    expect(root.hasError).toBe(false);
    expect(root.descendantsOfType("enumerators")[0].descendantsOfType("enumerator").length).toBe(2);
  });
});
