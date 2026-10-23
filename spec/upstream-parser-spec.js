describe("Scala upstream grammar regressions", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-scala");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.scala"));
  });

  afterEach(() => editor?.destroy());

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
