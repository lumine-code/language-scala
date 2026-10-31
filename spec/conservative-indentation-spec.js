describe("scala conservative indentation", () => {
  let editor;
  beforeEach(async () => {
    editor = null;
    jasmine.useRealClock();
    await lumine.packages.activatePackage("language-scala");
  });
  afterEach(() => editor?.destroy());
  async function start(file, text) {
    if (!editor || !editor.getPath()?.endsWith(file)) {
      editor?.destroy();
      editor = await lumine.workspace.open(file);
    }
    editor.update({ autoIndent: true, tabLength: 2, softTabs: true });
    editor.setText(text);
    expect(await editor.whenGrammarSettled()).toBe(true);
  }
  describe("scala", () => {
    it("indents Enter inside a block", async () => {
      await start("indentation.scala", "object Test {\n}");
      editor.setCursorBufferPosition([0, Infinity]);
      await editor.insertNewline();
      expect(editor.lineTextForBufferRow(1)).toBe("  ");
    });
    it("dedents a typed closing brace", async () => {
      await start("indentation.scala", "object Test {\n  val value = 1\n  ");
      editor.setCursorBufferPosition([2, Infinity]);
      await editor.insertText("}", { autoIndent: true, autoDecreaseIndent: true });
      await editor.whenGrammarSettled();
      expect(editor.lineTextForBufferRow(2)).toBe("}");
    });
    it("reindents a body and its closing delimiter once", async () => {
      await start("indentation.scala", "object Test {\nval value = 1\n}");
      await editor.autoIndentBufferRows(0, 2);
      expect(editor.getText()).toBe("object Test {\n  val value = 1\n}");
    });
    it("does not add indent after a complete one-line block or delimiters in a comment", async () => {
      for (const text of ["object Test { val value = 1 }", "// { [ ("]) {
        await start("indentation.scala", text);
        editor.moveToEndOfLine();
        await editor.insertNewline();
        expect(editor.lineTextForBufferRow(1)).toBe("");
      }
    });
    it("preserves multiline literal whitespace during reindent", async () => {
      const source = 'val value = """first\n      { [ (\n  last"""';
      await start("indentation.scala", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
    it("preserves multiline comment interiors during reindent", async () => {
      const source = "/* first\n      { [ (\n  last */";
      await start("indentation.scala", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
  });

  it("does not infer indentation from an unfinished declaration", async () => {
    await start("declaration.scala", "def value() =");
    editor.setCursorBufferPosition([0, Infinity]);
    await editor.insertNewline();
    expect(editor.lineTextForBufferRow(1)).toBe("");
  });

  it("keeps quoted recovery punctuation from indenting the next row", async () => {
    for (const source of [
      'val value = "{',
      'val value = "(',
      'val value = "[',
      'val value = """{',
      'val value = """has" {',
      'val value = s"{',
      'val value = raw"{',
      'val value = "a\\"{',
    ]) {
      await start("recovery.scala", source);
      editor.setCursorBufferPosition([0, Infinity]);
      await editor.insertNewline();
      expect(editor.lineTextForBufferRow(1)).withContext(source).toBe("");
    }
  });

  it("retains the current margin while entering recovered literal text", async () => {
    await start("recovery.scala", 'object Main {\n  val value = "{');
    editor.setCursorBufferPosition([1, Infinity]);
    await editor.insertNewline();
    expect(editor.lineTextForBufferRow(2)).toBe("  ");
  });

  it("retains indentation for real incomplete containers and interpolation", async () => {
    for (const source of [
      'val value = s"${List(',
      "object Main {",
      "val value = List(",
      'List("done", List(',
    ]) {
      await start("recovery.scala", source);
      editor.setCursorBufferPosition([0, Infinity]);
      await editor.insertNewline();
      expect(editor.indentationForBufferRow(1)).withContext(source).toBe(1);
    }
  });

  it("preserves authored whitespace in recovered multiline literal content", async () => {
    const source = 'val value = """{\n      payload';
    await start("recovery.scala", source);
    await editor.autoIndentBufferRows(1, 1);
    expect(editor.getText()).toBe(source);
  });

  it("reindents a real body after a complete triple-quoted literal", async () => {
    await start("complete.scala", 'val value = """done""" + List(1).map { x =>\nwork()\n}');
    await editor.autoIndentBufferRows(1, 2);
    expect(editor.getText()).toBe('val value = """done""" + List(1).map { x =>\n  work()\n}');
  });
});
