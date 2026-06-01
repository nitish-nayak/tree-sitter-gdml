/**
 * @file GDML rule library — shared rules plus per-tag rule templates.
 * grammar.js wires GDML_TAGS through `gdml_tag`; specialize a tag family by
 * adding a [predicate, template] entry to TEMPLATES. Spread `gdml_rules` for
 * the shared (hidden) rules.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
// seq/choice/field/optional are tree-sitter DSL globals, as in common.mjs.
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";

// Shared hidden rules, spread into the grammar like common.mjs's `rules`.
export const gdml_rules = {
  // ref="…" — its value surfaces as the element's `ref` field.
  _ref: $ => seq('ref', $._Eq, field('ref', $.AttValue)),
};

// reference tags: exactly one attribute, `ref`
const ref_tag = ($, tag) => seq('<', $._gdml_open, tag, $._S, $._ref, optional($._S), '/>');

// default: <tag …/> or <tag>…</tag>, structure only
const any_tag = ($, tag) => choice(
  seq('<', $._gdml_open, tag, c.rseq($._S, $.Attribute), optional($._S), '/>'),
  seq(
    seq('<', $._gdml_open, tag, c.rseq($._S, $.Attribute), optional($._S), '>'),
    optional($.content),
    seq('</', $._gdml_close, tag, optional($._S), '>'),
  ),
);

// [predicate, template] in priority order; first match wins, else any_tag.
const TEMPLATES = [
  [tag => /ref$/.test(tag), ref_tag],
  [tag => ['world', 'first', 'second', 'solid'].includes(tag), ref_tag],
];

// Body of one tag's rule; called as `$ => gdml_tag($, tag)`.
export function gdml_tag($, tag) {
  const match = TEMPLATES.find(([test]) => test(tag));
  return (match ? match[1] : any_tag)($, tag);
}
