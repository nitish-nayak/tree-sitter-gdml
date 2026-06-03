package tree_sitter_gdml

// #cgo CFLAGS: -std=c11 -fPIC
// #include "../../gdml/src/parser.c"
// #if __has_include("../../gdml/src/scanner.c")
// #include "../../gdml/src/scanner.c"
// #endif
import "C"

import "unsafe"

// Get the tree-sitter Language for this grammar.
func Language() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_gdml())
}
