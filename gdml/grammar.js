/**
 * @file Parser for GDML
 * @author Nitish Nayak <nitish.nayakb@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
import xml from "@tree-sitter-grammars/tree-sitter-xml/xml/grammar.js";
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";

// Tags emitted as typed nodes. MUST stay in sync with GDML_TAGS[] in src/scanner.c.
const GDML_TAGS = [
  // document structure
  'gdml', 'define', 'materials', 'solids', 'structure', 'setup', 'userinfo',
  // define
  'constant', 'variable', 'quantity', 'expression', 'matrix', 'position', 'rotation', 'scale',
  // materials
  'isotope', 'element', 'material', 'atom', 'composite', 'fraction',
  'D', 'Dref', 'T', 'Tref', 'P', 'Pref', 'MEE', 'MEEref', 'RL', 'RLref', 'AL', 'ALref',
  // solids
  'box', 'cone', 'cutTube', 'elcone', 'ellipsoid', 'eltube', 'hype', 'orb', 'para', 'paraboloid',
  'polycone', 'genericPolycone', 'polyhedra', 'genericPolyhedra', 'sphere', 'torus', 'trap', 'trd',
  'tet', 'arb8', 'xtru', 'tessellated', 'twistedbox', 'twistedtrap', 'twistedtrd', 'twistedtubs',
  'tube', 'union', 'subtraction', 'intersection', 'multiUnion', 'scaledSolid', 'reflectedSolid',
  'opticalsurface', 'property',
  // solid sub-elements
  'zplane', 'rzpoint', 'first', 'second', 'firstposition', 'firstpositionref',
  'firstrotation', 'firstrotationref', 'multiUnionNode', 'solid', 'section',
  'twoDimVertex', 'triangular', 'quadrangular',
  // structure
  'volume', 'assembly', 'physvol', 'volumeref', 'solidref', 'materialref',
  'positionref', 'rotationref', 'scaleref', 'physvolref',
  'divisionvol', 'replicavol', 'paramvol', 'parameters', 'parameterised_position_size',
  'replicate_along_axis', 'direction', 'directionref', 'width', 'offset',
  'bordersurface', 'skinsurface', 'loop', 'auxiliary', 'file', 'world',
];

// <element> would clash with the inherited `element` rule, so its node is renamed.
const NODE_NAME = { element: 'gdml_element' };
const nameOf = tag => NODE_NAME[tag] || tag;

const gdmlRules = {};
for (const tag of GDML_TAGS) {
  // Accept both <tag …/> and <tag>…</tag>; structure only.
  gdmlRules[nameOf(tag)] = $ => choice(
    seq('<', $._gdml_marker, tag, c.rseq($._S, $.Attribute), optional($._S), '/>'),
    seq(
      seq('<', $._gdml_marker, tag, c.rseq($._S, $.Attribute), optional($._S), '>'),
      optional($.content),
      seq('</', $._gdml_marker, tag, optional($._S), '>'),
    ),
  );
}

export default grammar(xml, {
  name: "gdml",

  // Order is positionally coupled to enum TokenType in src/scanner.h — keep in sync.
  externals: $ => [
    // DTD
    $.PITarget,
    $._pi_content,
    $.Comment,

    // XML
    $.CharData,
    $.CData,
    'xml-model',
    'xml-stylesheet',
    $._gdml_marker,
    $._start_tag_name,
    $._end_tag_name,
    $._erroneous_end_name,
    '/>',
  ],

  rules: {
    // Typed GDML elements take priority; unknown tags fall back to generic XML.
    element: ($, original) => choice(
      ...GDML_TAGS.map(tag => $[nameOf(tag)]),
      original,
    ),

    ...gdmlRules,
  },
});
