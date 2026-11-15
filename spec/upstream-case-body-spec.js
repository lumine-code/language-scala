const CASES = require("./fixtures/upstream-case-bodies.json");

describe("Scala upstream case-body regions", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-scala");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.scala"));
  });

  afterEach(() => editor?.destroy());

  const rootNode = () => editor.getSyntaxNodeAtBufferPosition([0, 0], (node) => !node.parent);
  const shape = (node) =>
    "(" + node.type + node.namedChildren.map((child) => " " + shape(child)).join("") + ")";

  for (const test of CASES) {
    it(test.name + " through incremental edits and undo", async () => {
      editor.setText(test.text);
      expect(await editor.whenGrammarSettled()).toBe(true);
      expect(rootNode().hasError).toBe(false);
      expect(shape(rootNode())).toBe(test.tree);
      editor.getBuffer().clearUndoStack();
      editor.getBuffer().append("val upstreamTail = 99\n");
      expect(await editor.whenGrammarSettled()).toBe(true);
      expect(rootNode().hasError).toBe(false);
      expect(rootNode().descendantsOfType("val_definition").at(-1)?.text).toBe(
        "val upstreamTail = 99",
      );
      editor.undo();
      expect(await editor.whenGrammarSettled()).toBe(true);
      expect(editor.getText()).toBe(test.text);
      expect(shape(rootNode())).toBe(test.tree);
    });
  }
});
