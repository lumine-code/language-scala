describe("scala editing settings", () => {
  let editor, pairingWasActive;
  beforeAll(() => {
    pairingWasActive = lumine.packages.isPackageActive("bracket-matcher");
  });
  afterAll(async () => {
    if (!pairingWasActive) await lumine.packages.deactivatePackage("bracket-matcher");
  });
  beforeEach(async () => {
    jasmine.useRealClock();
    editor = null;
    await lumine.packages.activatePackage("language-scala");
    await lumine.packages.activatePackage("bracket-matcher");
  });
  afterEach(() => editor?.destroy());
  async function start(scope, text = "value") {
    editor ??= await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName(scope));
    editor.setText(text);
    expect(await editor.whenGrammarSettled()).toBe(true);
    editor.update({ autoIndent: false });
  }
  for (const [scope, line, block] of [["source.scala", "//", ["/*", "*/"]]]) {
    it("exposes line and block comment metadata in " + scope, async () => {
      await start(scope);
      expect(await editor.getCommentDelimitersForBufferPosition([0, 0])).toEqual({ line, block });
      await editor.toggleLineCommentsForBufferRows(0, 0);
      expect(editor.getText()).toBe(line + " value");
      await editor.toggleLineCommentsForBufferRows(0, 0);
      expect(editor.getText()).toBe("value");
    });
    it("round trips block comments using the advertised delimiters in " + scope, async () => {
      await start(scope);
      const { block } = await editor.getCommentDelimitersForBufferPosition([0, 0]);
      const options = {
        commentStrings: { commentStartString: block[0], commentEndString: block[1] },
      };
      await editor.toggleLineCommentsForBufferRows(0, 0, options);
      expect(editor.getText()).toBe(block[0] + " value " + block[1]);
      await editor.toggleLineCommentsForBufferRows(0, 0, options);
      expect(editor.getText()).toBe("value");
    });
  }
  async function typeExpression(expression) {
    await start("source.scala", "val value = ");
    editor.setCursorBufferPosition([0, Infinity]);
    for (const character of expression) {
      await editor.insertText(character, { autoIndent: false, autoDecreaseIndent: false });
      await editor.whenGrammarSettled();
    }
    expect(editor.getText())
      .withContext(expression)
      .toBe("val value = " + expression);
    const tree = editor.getBuffer().getLanguageMode().tree.rootNode;
    expect(tree.hasError).withContext(expression).toBe(false);
    return tree;
  }
  it("types symbols and quoted types or expressions without a trailing apostrophe", async () => {
    for (const expression of ["'symbol", "'[T]", "'{ value }"]) {
      const tree = await typeExpression(expression);
      expect(tree.descendantsOfType("quote_expression").length).toBe(1);
    }
    expect(
      lumine.config.get("bracket-matcher.autocompleteCharacters", {
        scope: editor.getRootScopeDescriptor(),
      }),
    ).toContain("''");
  });
  it("types complete character literals while apostrophe automatic actions are disabled", async () => {
    for (const expression of ["'a'", "'\\n'"]) {
      const tree = await typeExpression(expression);
      expect(tree.descendantsOfType("character_literal").length).toBe(1);
    }
  });
});
