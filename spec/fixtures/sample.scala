// Assertions live in the comments: `<- scope` checks the marker's own column
// on the previous non-comment line, `^ scope` checks the caret's. Scopes
// match by prefix, so the trailing `.scala` segment is left off.

object Demo {
// <- keyword
//          ^ punctuation.definition.block.begin.bracket.curly

  def go(n: Int) = n + 1
//^ storage.type.function
//      ^ punctuation.definition.arguments.begin.bracket.round
//                     ^ constant.numeric

}
// <- punctuation.definition.block.end.bracket.curly

// a comment
// <- comment
