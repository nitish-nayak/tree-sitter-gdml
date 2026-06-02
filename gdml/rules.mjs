/**
 * @file GDML rule library — shared rules plus per-tag rule builders.
 * grammar.js wires GDML_TAGS through `gdml_tag`. Containers in gdml_ordered get
 * a strict ordered content model; those in gdml_children get a restricted child
 * set (any order); `*ref`-style tags get templates; everything else is a
 * permissive both-forms `any_tag`. Spread `gdml_rules` for shared rules.
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
// seq/choice/field/optional/prec/alias/token/repeat1 are tree-sitter DSL globals, as in common.mjs.
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";

// <element>'s node is renamed (clashes with the inherited `element` rule); shared with grammar.js.
export const node_renames = { element: 'gdml_element' };

// Expression operator precedence (higher binds tighter).
const precedence = { add: 1, mul: 2, pow: 3, unary: 4, call: 5 };

// Attribute names carrying ExpressionOrIDREFType values (parsed as expressions).
// Sourced from the GDML schema; everything else stays a plain string AttValue.
const value_attrs = [
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

// The Solid substitution group (gdml_solids.xsd): every concrete element usable where a solid fits.
const solid_tags = ['box', 'cone', 'cutTube', 'elcone', 'ellipsoid', 'eltube', 'hype', 'orb',
  'para', 'paraboloid', 'polycone', 'genericPolycone', 'polyhedra', 'genericPolyhedra', 'sphere',
  'torus', 'trap', 'trd', 'tet', 'arb8', 'xtru', 'tessellated', 'twistedbox', 'twistedtrap',
  'twistedtrd', 'twistedtubs', 'tube', 'union', 'subtraction', 'intersection', 'multiUnion',
  'scaledSolid', 'reflectedSolid'];

// Ordered content models: each child slot is { one | opt | some | many : [allowed tags] }
// in order (one = exactly 1, opt = 0-1, some = 1+, many = 0+); inline-or-ref via multi-tag lists.
const gdml_ordered = {
  gdml: [{ opt: ['define'] }, { opt: ['materials'] }, { opt: ['solids'] },
    { one: ['structure'] }, { some: ['setup'] }],
  define: [{ many: ['constant', 'variable', 'quantity', 'expression', 'matrix', 'position', 'rotation', 'scale'] }],
  materials: [{ many: ['define', 'isotope', 'element', 'material'] }],
  solids: [{ many: ['define', ...solid_tags, 'opticalsurface'] }],
  scaledSolid: [{ one: ['solidref'] }, { one: ['scale', 'scaleref'] }],
  physvol: [{ one: ['volumeref', 'file'] }, { opt: ['position', 'positionref'] },
    { opt: ['rotation', 'rotationref'] }, { many: ['scale', 'scaleref'] }],
  volume: [{ one: ['materialref'] }, { one: ['solidref'] },
    { many: ['physvol', 'divisionvol', 'replicavol', 'paramvol', 'loop', 'auxiliary'] }],
  divisionvol: [{ one: ['volumeref'] }],
  replicavol: [{ one: ['volumeref'] }, { one: ['replicate_along_axis'] }],
  bordersurface: [{ one: ['physvolref'] }, { one: ['physvolref'] }],
  skinsurface: [{ one: ['volumeref'] }],
  structure: [{ many: ['volume', 'assembly', 'bordersurface', 'skinsurface', 'loop'] }],
  setup: [{ one: ['world'] }],
  userinfo: [{ many: ['auxiliary'] }],
};

// Restricted child sets (any order): a flat list of allowed child tags.
const gdml_children = {
  union: ['first', 'second', 'position', 'positionref', 'rotation', 'rotationref',
    'firstposition', 'firstpositionref', 'firstrotation', 'firstrotationref'],
  subtraction: ['first', 'second', 'position', 'positionref', 'rotation', 'rotationref',
    'firstposition', 'firstpositionref', 'firstrotation', 'firstrotationref'],
  intersection: ['first', 'second', 'position', 'positionref', 'rotation', 'rotationref',
    'firstposition', 'firstpositionref', 'firstrotation', 'firstrotationref'],
  multiUnion: ['multiUnionNode'],
  multiUnionNode: ['solid', 'position', 'positionref', 'rotation', 'rotationref'],
  polycone: ['zplane'], polyhedra: ['zplane'],
  genericPolycone: ['rzpoint'], genericPolyhedra: ['rzpoint'],
  xtru: ['twoDimVertex', 'section'],
  tessellated: ['triangular', 'quadrangular'],
  assembly: ['physvol', 'replicavol', 'paramvol', 'auxiliary'],
  material: ['D', 'Dref', 'atom', 'fraction', 'composite', 'property',
    'RL', 'RLref', 'AL', 'ALref', 'T', 'Tref', 'P', 'Pref', 'MEE', 'MEEref'],
  element: ['D', 'Dref', 'atom', 'fraction'],
  isotope: ['D', 'Dref', 'atom'],
  opticalsurface: ['property'],
  auxiliary: ['auxiliary'],
  loop: ['volume', 'physvol', 'loop', ...solid_tags],
  replicate_along_axis: ['position', 'positionref', 'rotation', 'rotationref',
    'direction', 'directionref', 'width', 'offset'],
};

// Shared rules, spread into the grammar like common.mjs's `rules`.
export const gdml_rules = {
  // ref="…" / name="…" → hoisted to the element's `ref` / `name` field
  _ref: $ => seq('ref', $._Eq, field('ref', $.AttValue)),
  _name: $ => seq('name', $._Eq, field('name', $.AttValue)),

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

  // x="pi/2." — value is an expression; _attribute routes by name (value-kind vs generic).
  value_attribute: $ => seq(alias(choice(...value_attrs), $.Name), $._Eq, field('value', $.gdml_value)),
  _attribute: $ => choice($._name, $.value_attribute, $.Attribute),

  // XML trivia allowed between element children (whitespace, comments, refs, CDATA)
  _misc: $ => choice($.CharData, $.Comment, $.PI, $.CDSect, $._Reference),
};

// reference tags: exactly one attribute, `ref`
function ref_tag($, tag) {
  return seq('<', $._gdml_open, tag, $._S, $._ref, optional($._S), '/>');
}

// default: <tag …/> or <tag>…</tag>, any children
function any_tag($, tag) {
  return choice(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '/>'),
    seq(
      seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
      optional($.content),
      seq('</', $._gdml_close, tag, optional($._S), '>'),
    ),
  );
}

// a child tag's rule, honoring node renames (e.g. element → gdml_element).
function rule_ref($, tag) {
  return $[node_renames[tag] || tag];
}

// the allowed tags of one slot, as a single rule (a choice when there are several).
function gdml_one_of($, tags) {
  if (tags.length > 1) return choice(...tags.map(t => rule_ref($, t)));
  return rule_ref($, tags[0]);
}

// one child occurrence of a content model. Trivia trails each child (no leading-trivia ambiguity).
function gdml_child($, slot) {
  if (slot.one) return seq(gdml_one_of($, slot.one), repeat($._misc));
  if (slot.opt) return optional(seq(gdml_one_of($, slot.opt), repeat($._misc)));
  if (slot.some) return repeat1(seq(gdml_one_of($, slot.some), repeat($._misc)));
  return repeat(seq(gdml_one_of($, slot.many), repeat($._misc)));
}

// an element with a strict ordered content model (mirrors an XSD complexType).
function gdml_complextype($, tag, content_model) {
  return seq(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
    seq(repeat($._misc), ...content_model.map(slot => gdml_child($, slot))),
    seq('</', $._gdml_close, tag, optional($._S), '>'),
  );
}

// a container restricted to a child set, in any order (a flat repeat — cheap to generate).
function gdml_container($, tag, children) {
  return seq(
    seq('<', $._gdml_open, tag, c.rseq($._S, $._attribute), optional($._S), '>'),
    repeat(choice(...children.map(t => rule_ref($, t)), $._misc)),
    seq('</', $._gdml_close, tag, optional($._S), '>'),
  );
}

// [predicate, builder] in priority order; first match wins, else any_tag.
const templates = [
  [tag => /ref$/.test(tag), ref_tag],
  [tag => ['world', 'first', 'second', 'solid'].includes(tag), ref_tag],
];

// Body of one tag's rule; called as `$ => gdml_tag($, tag)`.
export function gdml_tag($, tag) {
  if (gdml_ordered[tag]) return gdml_complextype($, tag, gdml_ordered[tag]);
  if (gdml_children[tag]) return gdml_container($, tag, gdml_children[tag]);
  const match = templates.find(([test]) => test(tag));
  return (match ? match[1] : any_tag)($, tag);
}
