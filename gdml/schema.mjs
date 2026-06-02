/** @file GDML schema vocabulary */

// ExpressionOrIDREFType, or integer counts
export const value_attrs = [
  // coordinates & lengths
  'value', 'x', 'y', 'z', 'rho', 'x1', 'x2', 'x3', 'x4', 'y1', 'y2',
  'dx', 'dy', 'dz', 'ax', 'by', 'cz', 'hz', 'zlen',
  // radii
  'r', 'rmin', 'rmin1', 'rmin2', 'rmax', 'rmax1', 'rmax2', 'rtor', 'rlo', 'rhi',
  'InR', 'OutR', 'endinnerrad', 'endouterrad', 'midinnerrad', 'midouterrad',
  // angles
  'startphi', 'startPhi', 'StartPhi', 'openPhi', 'DeltaPhi', 'deltaphi', 'totphi',
  'starttheta', 'deltatheta', 'phi', 'Phi', 'theta', 'Theta',
  'alpha', 'alpha1', 'alpha2', 'Alph', 'twistedangle', 'PhiTwist', 'inst', 'outst',
  // z-cuts & planes
  'zcut', 'zcut1', 'zcut2', 'zmax', 'negativeEndz', 'positiveEndz',
  'lowX', 'lowY', 'lowZ', 'highX', 'highY', 'highZ',
  // vertices (tet / arb8)
  'vertex1', 'vertex2', 'vertex3', 'vertex4',
  'v1x', 'v1y', 'v2x', 'v2y', 'v3x', 'v3y', 'v4x', 'v4y',
  'v5x', 'v5y', 'v6x', 'v6y', 'v7x', 'v7y', 'v8x', 'v8y',
  // reflectedSolid transform & xtru section
  'sx', 'sy', 'sz', 'rx', 'ry', 'rz',
  'xOffset', 'yOffset', 'zOrder', 'zPosition', 'scalingFactor',
  // expression-typed refs
  'solid', 'surfaceproperty',
  // counts (integers)
  'number', 'numsides', 'numRZ', 'numSide', 'nseg', 'offset', 'width',
  'n', 'Z', 'N', 'copynumber', 'copy_num_start', 'copy_num_step', 'ncopies', 'from', 'to', 'step', 'coldim',
];

// xs:string, or the state NMTOKEN enum
export const string_attrs = [
  'unit', 'lunit', 'aunit', 'type', 'axis', 'state', 'formula', 'volname', 'values',
  'version', 'for', 'model', 'finish', 'auxtype', 'auxvalue', 'auxunit',
];

// The Solid substitution group (gdml_solids.xsd)
const solid_tags = ['box', 'cone', 'cutTube', 'elcone', 'ellipsoid', 'eltube', 'hype', 'orb',
  'para', 'paraboloid', 'polycone', 'genericPolycone', 'polyhedra', 'genericPolyhedra', 'sphere',
  'torus', 'trap', 'trd', 'tet', 'arb8', 'xtru', 'tessellated', 'twistedbox', 'twistedtrap',
  'twistedtrd', 'twistedtubs', 'tube', 'union', 'subtraction', 'intersection', 'multiUnion',
  'scaledSolid', 'reflectedSolid'];

// The Dimensions substitution group (gdml_parameterised.xsd)
const dimension_tags = ['box_dimensions', 'trd_dimensions', 'trap_dimensions', 'tube_dimensions',
  'cone_dimensions', 'sphere_dimensions', 'orb_dimensions', 'torus_dimensions',
  'ellipsoid_dimensions', 'para_dimensions', 'polycone_dimensions', 'polyhedra_dimensions',
  'hype_dimensions'];

// GDML-schema compliant (to a large extent)
// (ONE = exactly 1, OPT = 0-1, SOME = 1+, MANY = 0+)
export const gdml_complexset = {
  gdml: [{ OPT: ['define'] }, { OPT: ['materials'] }, { OPT: ['solids'] },
    { ONE: ['structure'] }, { SOME: ['setup'] }],
  define: [{ MANY: ['constant', 'variable', 'quantity', 'expression', 'matrix', 'position', 'rotation', 'scale'] }],
  materials: [{ MANY: ['define', 'isotope', 'element', 'material'] }],
  solids: [{ MANY: ['define', ...solid_tags, 'opticalsurface'] }],
  scaledSolid: [{ ONE: ['solidref'] }, { ONE: ['scale', 'scaleref'] }],
  physvol: [{ ONE: ['volumeref', 'file'] }, { OPT: ['position', 'positionref'] },
    { OPT: ['rotation', 'rotationref'] }, { MANY: ['scale', 'scaleref'] }],
  volume: [{ ONE: ['materialref'] }, { ONE: ['solidref'] },
    { MANY: ['physvol', 'divisionvol', 'replicavol', 'paramvol', 'loop', 'auxiliary'] }],
  divisionvol: [{ ONE: ['volumeref'] }],
  replicavol: [{ ONE: ['volumeref'] }, { ONE: ['replicate_along_axis'] }],
  paramvol: [{ ONE: ['volumeref'] }, { ONE: ['parameterised_position_size'] }],
  parameterised_position_size: [{ SOME: ['parameters'] }],
  parameters: [{ ONE: ['position'] }, { ONE: dimension_tags }],
  bordersurface: [{ ONE: ['physvolref'] }, { ONE: ['physvolref'] }],
  skinsurface: [{ ONE: ['volumeref'] }],
  structure: [{ MANY: ['volume', 'assembly', 'bordersurface', 'skinsurface', 'loop'] }],
  setup: [{ ONE: ['world'] }],
  userinfo: [{ MANY: ['auxiliary'] }],
};

// Restricted child sets (any order)
export const gdml_restrictedset = {
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
  loop: ['volume', 'physvol', 'loop', ...solid_tags],
  replicate_along_axis: ['position', 'positionref', 'rotation', 'rotationref',
    'direction', 'directionref', 'width', 'offset'],
};

// Leaf elements (attribute- or text-only)
export const leaf_tags = [
  // define
  'constant', 'variable', 'quantity', 'expression', 'matrix', 'position', 'rotation', 'scale',
  // materials
  'atom', 'composite', 'fraction', 'D', 'T', 'P', 'MEE', 'RL', 'AL',
  // solids
  'box', 'cone', 'cutTube', 'elcone', 'ellipsoid', 'eltube', 'hype', 'orb', 'para', 'paraboloid',
  'sphere', 'torus', 'trap', 'trd', 'tet', 'arb8', 'twistedbox', 'twistedtrap', 'twistedtrd',
  'twistedtubs', 'tube', 'reflectedSolid',
  // solid sub-elements
  'property', 'zplane', 'rzpoint', 'firstposition', 'firstrotation', 'section',
  'twoDimVertex', 'triangular', 'quadrangular',
  // structure
  'direction', 'width', 'offset', 'file', 'auxiliary',
  ...dimension_tags,
];
