/**
 * @file Parser for GDML
 * @author Nitish Nayak <nitish.nayakb@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
import xml from "@tree-sitter-grammars/tree-sitter-xml/xml/grammar.js";
import * as c from "@tree-sitter-grammars/tree-sitter-xml/common/common.mjs";

export default grammar(xml, {
  name: "gdml",

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
    $._define_start_name,
    $._define_end_name,
    $._start_tag_name,
    $._end_tag_name,
    $._erroneous_end_name,
    '/>',
  ],

  rules: {
    STag: ($, original) => choice(prec(5, seq(
      '<',
      alias($._define_start_name,  $.world), optional($._S),
      '>'
    )), original),

    ETag: ($, original) => choice(prec(5, seq(
      '</',
      alias($._define_end_name,  $.world), optional($._S),
      '>'
    )), original),

    EmptyElemTag: ($, original) => choice(prec(5, seq(
      '<',
      alias($._define_start_name, $.world),
      c.rseq($._S, $.Attribute),
      optional($._S),
      '/>'
    )), original),

  },
});
