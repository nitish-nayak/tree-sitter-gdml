# tree-sitter-gdml

A [tree-sitter](https://tree-sitter.github.io) grammar for GDML, the Geant4 geometry XML dialect.
It extends [`tree-sitter-xml`](https://github.com/tree-sitter-grammars/tree-sitter-xml) so each GDML
element parses to a typed node (`physvol`, `volume`, `box`, `positionref`, …) with
`name`/`ref`/`value` as fields.

## What this is

A static, structure-only parser derived from the GDML XSD. Every element is a typed node; content
models follow the schema (ordered where the parser allows, otherwise a restricted child set), and
attributes are fielded by kind — `name`/`ref`, numeric values via an inline expression sub-grammar,
and string/enum values. Invalid children error. Generic XML (comments, prolog, namespaces, unknown
elements) still parses via the inherited grammar.

## What this is _not_

It captures structure, not semantics. It does not:

- resolve `ref`/IDREFs or evaluate expressions (`pi/2.` stays a tree, not a number);
- compare or validate values, units, or numeric ranges;
- enforce attribute occurrence — required / unique / order (XML attributes are unordered);
- inject schema defaults.

Those belong in the consuming tool.

## Caveats

- `physvol` loosens one cardinality: schema `(volumeref|file), position?, rotation?, scale?` is
  relaxed to `… scale*` (see budget). volumeref-first and position-before-rotation still hold.
- Ordered-content budget — a content model holds at most ~3 optional/choice slots. Beyond that the
  parser silently mis-compiles (no conflict warning); we haven't fully pinned down why, but it looks
  like parsing combinatorics around the zero-width keyword markers. A few models (e.g.
  `replicate_along_axis`) fall back to an unordered child set.
- Substitution groups (`Solid`, `Dimensions`, …) are closed choices of known members; extend
  `gdml/schema.mjs` as the schema grows.

## Layout

```
gdml/
  grammar.js     extends tree-sitter-xml; wires GDML_TAGS → typed nodes
  schema.mjs     tag/attribute name lists + content models (from the XSD)
  rules.mjs      rule builders
  src/scanner.c  emits the zero-width open/close markers; GDML_TAGS[] must match grammar.js
```

## Development

```sh
cd gdml
tree-sitter generate
tree-sitter parse file.gdml
```
