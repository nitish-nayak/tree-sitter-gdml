# tree-sitter-gdml

A [tree-sitter](https://tree-sitter.github.io) grammar for [GDML](https://gdml.web.cern.ch/GDML/), the Geant4 geometry XML dialect.
It extends [`tree-sitter-xml`](https://github.com/tree-sitter-grammars/tree-sitter-xml) so each GDML
element parses to a typed node, i.e `physvol`, `volume`, `box`, `positionref`, … each get their own node type in the parsed tree.
`name`/`ref`/`value` etc are assigned as fields.

## Features

A static, structure-only parser derived from the GDML XSD. Every element is a typed node; content
models follow the schema as much as possible. For example, conforming to the corresponding XSD `complexType` where relevant (internally `gdml_complextype` in the grammar: see `gdml/rules.mjs`). This makes the syntax tree structure-aware. For example :
    - `volume` tags always contain exactly one `materialref` then a `solidref` before placement tags and so on.
Where the parser does not allow a full implementation of the schema (see [Caveats](#caveats)), they are made to be more permissive, not less, which means valid GDMLs get parsed.
The model then is mostly to restrict the list of child nodes, not the sequence and cardinality.
See `gdml/schema.mjs` for details on which is which.


Other important things to note :
- Attributes are fielded by kind — `name`/`ref`, numeric values via an inline expression sub-grammar and string/enum values (similar to the XSD).
- Invalid children are parsed with errors and hence can be used to identify structurally-invalid GDMLs.
- Generic XML (comments, prolog, namespaces, unknown elements) still parses via the inherited grammar.

## What this doesn't do

It captures structure, not semantics. It does not:

- resolve `ref`/IDREFs or evaluate expressions (`pi/2.` stays a tree, not a number);
- compare or validate values, units, or numeric ranges;
- enforce attribute occurrence — required / unique / order (XML attributes are unordered);
- inject schema defaults.

Those belong in whichever downstream tool makes use of the syntax tree.

## Caveats

- `physvol` loosens one cardinality:
    - schema `(volumeref|file), (position|positionref)?, (rotation|rotationref)?, (scale|scaleref)?` is relaxed to `(volumeref|file), (position|positionref)?, (rotation|rotationref)?, (scale|scaleref)*` (see `complexType` budget). volumeref-first and position-before-rotation still hold.
- `complexType` budget — This is kept empirically to at-most 3 optional/choice slots. Beyond that the parser seems to have trouble with the combinatorics (it compiles, but doesn't parse correctly).
  A few models (e.g. `replicate_along_axis`) fall back to a fully-unordered child set (internally `gdml_restrictedtype`).
- Substitution groups (`Solid`, `Dimensions`, …) are closed choices of known members which can be extended in `gdml/schema.mjs` as the XSD schema grows.

## Layout

```
gdml/
  grammar.js     extends tree-sitter-xml; wires GDML_TAGS → typed nodes
  schema.mjs     tag/attribute name lists + content models (from the XSD)
  rules.mjs      rule builders for the actual grammar
  src/scanner.c  emits the zero-width open/close markers to denote a valid GDML tag. These match `GDML_TAGS` in grammar.js
```

## Development

```sh
cd gdml
tree-sitter generate
tree-sitter parse file.gdml
```
