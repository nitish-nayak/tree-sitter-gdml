/** @file GDML rule library */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";
import {
  value_attrs, string_attrs, gdml_complexset, gdml_restrictedset, leaf_tags,
} from "./schema.mjs";

// <element> renamed (clashes with the inherited element rule)
export const node_renames = { element: 'gdml_element' };

// operator precedence (higher binds tighter)
const precedence = { add: 1, mul: 2, pow: 3, unary: 4, call: 5 };

// shared rules, spread into the grammar
export const gdml_attr_rules = {
  _ref: $ => seq('ref', $._Eq, field('ref', $.AttValue)),
  _name: $ => seq('name', $._Eq, field('name', $.AttValue)),

  // expression sub-grammar
  gdml_value: $ => choice(
    seq('"', optional($._S), $._expression, optional($._S), '"'),
    seq("'", optional($._S), $._expression, optional($._S), "'"),
  ),
  _expression: $ => choice(
    $.number,
    $.identifier,
    $.call_expression,
    $.unary_expression,
    $.binary_expression,
    $.parenthesized_expression,
  ),
  binary_expression: $ => choice(
    prec.left(precedence.add, seq($._expression, field('op', choice('+', '-')), $._expression)),
    prec.left(precedence.mul, seq($._expression, field('op', choice('*', '/')), $._expression)),
    prec.right(precedence.pow, seq($._expression, field('op', '^'), $._expression)),
  ),
  unary_expression: $ => prec(precedence.unary, seq(field('op', choice('-', '+')), $._expression)),
  parenthesized_expression: $ => seq('(', $._expression, ')'),
  call_expression: $ => prec(precedence.call, seq(field('fn', $.identifier), '(', optional($._arguments), ')')),
  _arguments: $ => seq($._expression, repeat(seq(',', $._expression))),
  number: _ => token(/(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/),
  identifier: _ => token(/[A-Za-z_][A-Za-z0-9_]*/),

  // value-kind → expression, string-kind → raw AttValue
  value_attribute: $ => seq(alias(choice(...value_attrs), $.Name), $._Eq, field('value', $.gdml_value)),
  string_attribute: $ => seq(alias(choice(...string_attrs), $.Name), $._Eq, field('value', $.AttValue)),
  _attribute: $ => choice($._name, $._ref, $.value_attribute, $.string_attribute, $.Attribute),

  _misc: $ => choice($.CharData, $.Comment, $.PI, $.CDSect, $._Reference),
};

// per-tag rule builders, ($, tag) → rule
const gdml_tag_builders = {
  // one ref attribute
  ref_tag: ($, tag) => seq('<', $._gdml_open, tag, $._S, $._ref, optional($._S), '/>'),
  // permissive fallback
  any_tag: ($, tag) => choice(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '/>'),
    seq(
      seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
      optional($.content),
      seq('</', $._gdml_close, tag, optional($._S), '>'),
    ),
  ),
  // leaf: no element children
  leaf_tag: ($, tag) => choice(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '/>'),
    seq(
      seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
      repeat($._misc),
      seq('</', $._gdml_close, tag, optional($._S), '>'),
    ),
  ),
};

// XSD complexType
function gdml_complextype($, tag, content_model) {
  function one_of(tags) {
    if (tags.length > 1) return choice(...tags.map(t => $[node_renames[t] || t]));
    return $[node_renames[tags[0]] || tags[0]];
  }
  function child(slot) {
    if (slot.ONE) return seq(one_of(slot.ONE), repeat($._misc));
    if (slot.OPT) return optional(seq(one_of(slot.OPT), repeat($._misc)));
    if (slot.SOME) return repeat1(seq(one_of(slot.SOME), repeat($._misc)));
    return repeat(seq(one_of(slot.MANY), repeat($._misc)));
  }
  return seq(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
    seq(repeat($._misc), ...content_model.map(child)),
    seq('</', $._gdml_close, tag, optional($._S), '>'),
  );
}

// restricted child set (any order); also self-closing when there are no children
function gdml_restrictedtype($, tag, children) {
  return choice(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '/>'),
    seq(
      seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
      repeat(choice(...children.map(t => $[node_renames[t] || t]), $._misc)),
      seq('</', $._gdml_close, tag, optional($._S), '>'),
    ),
  );
}

// [predicate, builder]; first match wins, else any_tag
const templates = [
  [tag => /ref$/.test(tag), gdml_tag_builders.ref_tag],
  [tag => ['world', 'first', 'second', 'solid'].includes(tag), gdml_tag_builders.ref_tag],
  [tag => leaf_tags.includes(tag), gdml_tag_builders.leaf_tag],
];

export function gdml_tag($, tag) {
  if (gdml_complexset[tag]) return gdml_complextype($, tag, gdml_complexset[tag]);
  if (gdml_restrictedset[tag]) return gdml_restrictedtype($, tag, gdml_restrictedset[tag]);
  const match = templates.find(([test]) => test(tag));
  return (match ? match[1] : gdml_tag_builders.any_tag)($, tag);
}
