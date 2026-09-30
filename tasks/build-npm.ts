import { build, emptyDir } from "dnt";

const outDir = "./build/npm";

await emptyDir(outDir);

let [version] = Deno.args;
if (!version) {
  throw new Error("a version argument is required to build the npm package");
}

await build({
  entryPoints: ["./mod.ts"],
  outDir,
  shims: {
    deno: false,
  },
  scriptModule: false,
  declarationMap: false,
  test: false,
  typeCheck: false,
  compilerOptions: {
    lib: ["ESNext"],
    target: "ES2022",
    sourceMap: false,
  },
  package: {
    // package.json properties
    name: "@bomb.sh/router",
    version,
    description: "Configuration for programs",
    license: "MIT",
    author: "Bombshell Authors (https://github.com/bombshell-dev)",
    repository: {
      type: "git",
      url: "git+https://github.com/bombshell-dev/router.git",
    },
    bugs: {
      url: "https://github.com/bombshell-dev/router/issues",
    },
    engines: {
      node: ">= 20",
    },
    sideEffects: false,
  },
});

await Deno.copyFile("README.md", `${outDir}/README.md`);
