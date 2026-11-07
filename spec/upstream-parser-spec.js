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

  it("keeps multiple statements inside a braced typed lambda after a dedent", async () => {
    const root = await parse("val f = _.next { x: M.N =>\n    val a = 1\n  val b = 2\n}\n");
    const lambda = root.descendantsOfType("lambda_expression")[0];
    expect(lambda.descendantsOfType("val_definition").map((node) => node.text)).toEqual([
      "val a = 1",
      "val b = 2",
    ]);
  });

  it("recognizes wildcard and nested typed lambda parameters", async () => {
    const root = await parse(
      "xs.foreach { _: Int => println(1) }\nval h = { x: Int => y: Int => x + y }\n",
    );
    expect(root.descendantsOfType("lambda_expression").length).toBe(3);
    expect(root.descendantsOfType("ascription_expression")).toEqual([]);
  });

  it("keeps comma-separated extends parents and their body in the enclosing object", async () => {
    const root = await parse(
      "object O:\n  class C extends A,\n    B:\n      def m = 1\n  val after = 2\n",
    );
    const object = root.descendantsOfType("object_definition")[0];
    const definition = object.descendantsOfType("class_definition")[0];
    expect(definition.descendantsOfType("function_definition")[0].text).toBe("def m = 1");
    expect(object.descendantsOfType("val_definition")[0].text).toBe("val after = 2");
    expect(definition.descendantsOfType("val_definition")).toEqual([]);
  });

  it("binds a match expression to the body of a bracketed for", async () => {
    const root = await parse("for (x <- xs) x match { case _ => () }\n");
    const expression = root.descendantsOfType("for_expression")[0];
    expect(expression.parent.id).toBe(root.id);
    expect(expression.childForFieldName("body").type).toBe("match_expression");
  });

  it("distinguishes Scala 2 given and enum names from Scala 3 definitions and patterns", async () => {
    const legacy = await parse("val given = 1\nval enum = 2\ndef f(given: Int) = given\n");
    expect(
      legacy
        .descendantsOfType("val_definition")
        .map((node) => node.childForFieldName("pattern").type),
    ).toEqual(["identifier", "identifier"]);
    expect(legacy.descendantsOfType("given_pattern")).toEqual([]);
    const modern = await parse(
      "given item: A = value\nenum Color { case Red }\nvalue match { case given (A, B) => () }\n",
    );
    expect(modern.descendantsOfType("given_definition").length).toBe(1);
    expect(modern.descendantsOfType("enum_definition").length).toBe(1);
    expect(modern.descendantsOfType("given_pattern")[0].childForFieldName("type").type).toBe(
      "tuple_type",
    );
  });
});
