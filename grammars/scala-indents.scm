; Recovery sometimes drops the opening quote. Restrict the text check to one
; ERROR row with an unmatched quote, retaining interpolation and real literals.
(["{" "[" "("] @match.next
  (#is? test.childOfType ERROR)
  (#is? test.matchAt "parent (?:^|\\n)[^\"\n]*\"(?:\"\")?(?:[^\"\\\\\n]|\\\\.)*(?:\\r?\\n[ \\t]*)?$")
  (#is-not? test.matchAt "parent \\$\\{")
  (#is-not? test.typeAt "previousSibling string interpolated_string")
  (#set! indent.match startPosition))

; A triple-quoted payload can become a definition body during recovery.
((val_definition (ERROR) @_recovered) @preserve
  (#match? @_recovered "^\"\"\"")
  (#not-match? @_recovered "^\"\"\"[\\s\\S]*\"\"\"")
  (#is? indent.reindent true)
  (#is-not? indent.matchesCurrentRow startPosition)
  (#set! indent.force true))

; Only explicit delimiters change indentation; incomplete expressions do not.
["{" "[" "("] @indent
["}" "]" ")"] @dedent

; Reindent code without rewriting whitespace that belongs to multiline text.
([(string) (interpolated_string) (block_comment)] @preserve
  (#is? indent.reindent true)
  (#is-not? indent.matchesCurrentRow startPosition)
  (#set! indent.force true))
