# language-scala

Scala language support.

## Features

- **Grammars**: provides Tree-sitter grammars, built from [tree-sitter-scala](https://github.com/tree-sitter/tree-sitter-scala).
- **Syntax highlighting**: full tree-sitter grammar coverage for Scala files.
- **Folding**: folds blocks from the parse tree rather than by indentation.

## Installation

To install `language-scala` search for _language-scala_ in the Install pane of the Lumine settings or run `lumine --install lumine-code/language-scala`.

## Services

- **hyperlink.injection** (`^1.0.0`): consumed to highlight URLs inside Scala files as clickable links.
- **todo.injection** (`^1.0.0`): consumed to highlight `TODO`-style markers inside comments.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
