const CASES = require("./fixtures/upstream-language-fixes.json");

describe("scala upstream language fixes", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-scala");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.scala"));
  });

  afterEach(() => editor?.destroy());

  const rootNode = () => editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);

  for (const test of CASES) {
    it(test.name + " through incremental edits and undo", async () => {
      editor.setText(test.text);
      expect(await editor.whenGrammarSettled()).toBe(true);
      const root = rootNode();
      expect(root.hasError).toBe(false);
      for (const [type, count] of Object.entries(test.types || {})) {
        expect(root.descendantsOfType(type).filter((node) => node.isNamed).length)
          .withContext(type)
          .toBe(count);
      }
      if (test.field) {
        expect(
          root.descendantsOfType(test.field.type)[0]?.childForFieldName(test.field.field)?.text,
        ).toBe(test.field.text);
      }
      if (test.lastAssignment) {
        expect(root.descendantsOfType("assignment_expression").at(-1)?.text).toBe(
          test.lastAssignment,
        );
      }
      if (test.commentText) {
        expect(root.descendantsOfType("comment")[0]?.text).toBe(test.commentText);
      }
      for (const check of test.scopes || []) {
        const index = test.text.indexOf(check.needle);
        expect(index).withContext(check.needle).toBeGreaterThanOrEqual(0);
        const point = editor.getBuffer().positionForCharacterIndex(index + (check.offset || 0));
        const scopes = editor.scopeDescriptorForBufferPosition(point).getScopesArray();
        expect(scopes).withContext(check.needle).toContain(check.contains);
        if (check.excludes) expect(scopes).withContext(check.needle).not.toContain(check.excludes);
      }

      editor.getBuffer().clearUndoStack();
      const suffix = (test.text.endsWith("\n") ? "" : "\n") + "val upstreamTail = 99\n";
      editor.getBuffer().append(suffix);
      expect(await editor.whenGrammarSettled()).toBe(true);
      expect(rootNode().hasError).toBe(false);
      expect(rootNode().text).toBe(test.text + suffix);
      editor.undo();
      expect(await editor.whenGrammarSettled()).toBe(true);
      expect(editor.getText()).toBe(test.text);
      expect(rootNode().hasError).toBe(false);
    });
  }
});
