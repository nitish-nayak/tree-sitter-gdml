// swift-tools-version:5.3

import Foundation
import PackageDescription

var sources = ["gdml/src/parser.c"]
if FileManager.default.fileExists(atPath: "gdml/src/scanner.c") {
    sources.append("gdml/src/scanner.c")
}

let package = Package(
    name: "TreeSitterGdml",
    products: [
        .library(name: "TreeSitterGdml", targets: ["TreeSitterGdml"]),
    ],
    dependencies: [
        .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterGdml",
            dependencies: [],
            path: ".",
            sources: sources,
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("gdml/src")]
        ),
        .testTarget(
            name: "TreeSitterGdmlTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterGdml",
            ],
            path: "bindings/swift/TreeSitterGdmlTests"
        )
    ],
    cLanguageStandard: .c11
)
