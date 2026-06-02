/**
 * @file GDML rule library — shared rules plus per-tag rule templates.
 * grammar.js wires GDML_TAGS through `gdml_tag`; specialize a tag family by
 * adding a [predicate, template] entry to TEMPLATES. Spread `gdml_rules` for
 * the shared (hidden) rules.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
// seq/choice/field/optional/prec/alias/token are tree-sitter DSL globals, as in common.mjs.
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";

// Expression operator precedence (higher binds tighter).
const PREC = { add: 1, mul: 2, pow: 3, unary: 4, call: 5 };

// Attribute names carrying ExpressionOrIDREFType values (parsed as expressions).
// Sourced from the GDML schema; everything else stays a plain string AttValue.
const VALUE_ATTRS = [
  'value', 'x', 'y', 'z', 'x1', 'x2', 'x3', 'x4', 'y1', 'y2',
  'r', 'rmin', 'rmax', 'rmax1', 'rmax2', 'rtor', 'rlo', 'rhi',
  'ax', 'by', 'cz', 'dx', 'dy', 'dz', 'zcut', 'zmax',
  'startphi', 'deltaphi', 'deltatheta', 'phi', 'Phi', 'theta', 'Theta',
  'alpha', 'alpha1', 'alpha2', 'Alph', 'twistedangle', 'PhiTwist',
  'number', 'numsides', 'offset', 'width', 'scalingFactor', 'to', 'inst', 'outst',
  'solid', 'surfaceproperty',
  'vertex1', 'vertex2', 'vertex3', 'vertex4',
  'lowX', 'lowY', 'lowZ', 'highX', 'highY', 'highZ',
  'xOffset', 'yOffset', 'zOrder', 'zPosition',
  'v1x', 'v1y', 'v2x', 'v2y', 'v3x', 'v3y', 'v4x', 'v4y',
  'v5x', 'v5y', 'v6x', 'v6y', 'v7x', 'v7y', 'v8x', 'v8y',
];

// Shared rules, spread into the grammar like common.mjs's `rules`.
export const gdml_rules = {
  // ref="…" → exposed as the element's `ref` field
  _ref: $ => seq('ref', $._Eq, field('ref', $.AttValue)),

  // ---- attribute-value expression sub-grammar ----
  // a quoted value parsed as an expression (leading/trailing whitespace tolerated)
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
    prec.left(PREC.add, seq($._expression, field('op', choice('+', '-')), $._expression)),
    prec.left(PREC.mul, seq($._expression, field('op', choice('*', '/')), $._expression)),
    prec.right(PREC.pow, seq($._expression, field('op', '^'), $._expression)),
  ),
  unary_expression: $ => prec(PREC.unary, seq(field('op', choice('-', '+')), $._expression)),
  parenthesized_expression: $ => seq('(', $._expression, ')'),
  call_expression: $ => prec(PREC.call, seq(field('fn', $.identifier), '(', optional($._arguments), ')')),
  _arguments: $ => seq($._expression, repeat(seq(',', $._expression))),
  number: _ => token(/(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/),
  identifier: _ => token(/[A-Za-z_][A-Za-z0-9_]*/),

  // x="pi/2." — value is an expression; _attribute routes by name (value-kind vs generic).
  value_attribute: $ => seq(alias(choice(...VALUE_ATTRS), $.Name), $._Eq, field('value', $.gdml_value)),
  _attribute: $ => choice($.value_attribute, $.Attribute),
};

// reference tags: exactly one attribute, `ref`
const ref_tag = ($, tag) => seq('<', $._gdml_open, tag, $._S, $._ref, optional($._S), '/>');

// default: <tag …/> or <tag>…</tag>, structure only
const any_tag = ($, tag) => choice(
  seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '/>'),
  seq(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
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
