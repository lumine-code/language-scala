; CREDITS @stumash (stuart.mashaal@gmail.com)

(field_expression field: (identifier) @variable.other.member.scala)
(field_expression value: (identifier) @support.type.scala
 (#match? @support.type.scala "^[A-Z]"))

(type_identifier) @support.type.scala

(class_definition
  name: (identifier) @support.type.scala)

(enum_definition
  name: (identifier) @support.type.scala)

(object_definition
  name: (identifier) @support.type.scala)

(trait_definition
  name: (identifier) @support.type.scala)

(full_enum_case
  name: (identifier) @support.type.scala)

(simple_enum_case
  name: (identifier) @support.type.scala)

;; variables

(class_parameter
  name: (identifier) @variable.parameter.scala)

(self_type (identifier) @variable.parameter.scala)

(interpolation (identifier) @_IGNORE_.none)
(interpolation (block) @_IGNORE_.none)

;; types

(type_definition
  name: (type_identifier) @entity.name.type.scala)

;; val/var definitions/declarations

(val_definition
  pattern: (identifier) @variable.other.scala)

(var_definition
  pattern: (identifier) @variable.other.scala)

(val_declaration
  name: (identifier) @variable.other.scala)

(var_declaration
  name: (identifier) @variable.other.scala)

; imports/exports

(import_declaration
  path: (identifier) @entity.name.namespace.scala)
((stable_identifier (identifier) @entity.name.namespace.scala))

((import_declaration
  path: (identifier) @support.type.scala) (#match? @support.type.scala "^[A-Z]"))
((stable_identifier (identifier) @support.type.scala) (#match? @support.type.scala "^[A-Z]"))

(export_declaration
  path: (identifier) @entity.name.namespace.scala)
((stable_identifier (identifier) @entity.name.namespace.scala))

((export_declaration
  path: (identifier) @support.type.scala) (#match? @support.type.scala "^[A-Z]"))
((stable_identifier (identifier) @support.type.scala) (#match? @support.type.scala "^[A-Z]"))

((namespace_selectors (identifier) @support.type.scala) (#match? @support.type.scala "^[A-Z]"))

; method invocation

(call_expression
  function: (identifier) @support.other.function.scala)

(call_expression
  function: (operator_identifier) @support.other.function.scala)

(call_expression
  function: (field_expression
    field: (identifier) @support.other.function.method.scala))

((call_expression
   function: (identifier) @entity.name.function.constructor.scala)
 (#match? @entity.name.function.constructor.scala "^[A-Z]"))

(generic_function
  function: (identifier) @support.other.function.scala)

(interpolated_string_expression
  interpolator: (identifier) @support.other.function.scala)

; function definitions

(function_definition
  name: (identifier) @entity.name.function.scala)

(parameter
  name: (identifier) @variable.parameter.scala)

(binding
  name: (identifier) @variable.parameter.scala)

; method definition

(function_declaration
      name: (identifier) @entity.name.function.method.scala)

(function_definition
      name: (identifier) @entity.name.function.method.scala)

; expressions

(infix_expression operator: (identifier) @keyword.operator.scala)
(infix_expression operator: (operator_identifier) @keyword.operator.scala)
(infix_type operator: (operator_identifier) @keyword.operator.scala)
(infix_type operator: (operator_identifier) @keyword.operator.scala)

; literals

(boolean_literal) @constant.language.boolean.scala
(integer_literal) @constant.numeric.scala
(floating_point_literal) @constant.numeric.float.scala

[
  (string)
  (character_literal)
  (interpolated_string_expression)
] @string.quoted.double.scala

(interpolation "$" @punctuation.special)

;; keywords

(opaque_modifier) @support.type.qualifier.scala
(infix_modifier) @keyword.control.scala
(transparent_modifier) @support.type.qualifier.scala
(open_modifier) @support.type.qualifier.scala

[
  "case"
  "class"
  "enum"
  "extends"
  "derives"
  "finally"
;; `forSome` existential types not implemented yet
;; `macro` not implemented yet
  "object"
  "override"
  "package"
  "trait"
  "type"
  "val"
  "var"
  "with"
  "given"
  "using"
  "end"
  "implicit"
  "extension"
  "with"
] @keyword.control.scala

[
  "abstract"
  "final"
  "lazy"
  "sealed"
  "private"
  "protected"
] @support.type.qualifier.scala

(inline_modifier) @storage.modifier.scala

(null_literal) @constant.language.scala

(wildcard) @variable.parameter.scala

(annotation) @entity.other.attribute-name.scala

;; special keywords

"new" @keyword.operator.word.scala

[
  "else"
  "if"
  "match"
  "then"
] @keyword.control.conditional.scala

"(" @punctuation.definition.arguments.begin.bracket.round.scala
")" @punctuation.definition.arguments.end.bracket.round.scala
"[" @punctuation.definition.type-arguments.begin.bracket.square.scala
"]" @punctuation.definition.type-arguments.end.bracket.square.scala
"{" @punctuation.definition.block.begin.bracket.curly.scala
"}" @punctuation.definition.block.end.bracket.curly.scala

"." @punctuation.separator.property.scala
"," @punctuation.separator.comma.scala

[
  "do"
  "for"
  "while"
  "yield"
] @keyword.control.loop.scala

"def" @storage.type.function.scala

[
 "=>"
 "<-"
 "@"
] @keyword.operator.scala

["import" "export"] @keyword.control.import.scala

[
  "try"
  "catch"
  "throw"
] @keyword.control.exception.scala

"return" @keyword.control.return.scala

(comment) @_IGNORE_.spell @comment.line.scala
(block_comment) @_IGNORE_.spell @comment.line.scala

;; `case` is a conditional keyword in case_block

(case_block
  (case_clause ("case") @keyword.control.conditional.scala))
(indented_cases
  (case_clause ("case") @keyword.control.conditional.scala))

(operator_identifier) @keyword.operator.scala

((identifier) @support.type.scala (#match? @support.type.scala "^[A-Z]"))
((identifier) @variable.language.scala
 (#match? @variable.language.scala "^this$"))

(
  (identifier) @support.function.builtin.scala
  (#match? @support.function.builtin.scala "^super$")
)

;; Scala CLI using directives
(using_directive_key) @variable.parameter.scala
(using_directive_value) @string.quoted.double.scala
