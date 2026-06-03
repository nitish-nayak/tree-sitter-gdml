{
  "targets": [
    {
      "target_name": "tree_sitter_gdml_binding",
      "dependencies": [
        "<!(node -p \"require('node-addon-api').targets\"):node_addon_api_except",
      ],
      "include_dirs": [
        "gdml/src",
      ],
      "sources": [
        "bindings/node/binding.cc",
        "gdml/src/parser.c",
      ],
      "variables": {
        "has_scanner": "<!(node -p \"fs.existsSync('gdml/src/scanner.c')\")"
      },
      "conditions": [
        ["has_scanner=='true'", {
          "sources+": ["gdml/src/scanner.c"],
        }],
        ["OS!='win'", {
          "cflags_c": [
            "-std=c11",
          ],
        }, { # OS == "win"
          "cflags_c": [
            "/std:c11",
            "/utf-8",
          ],
        }],
      ],
    }
  ]
}
