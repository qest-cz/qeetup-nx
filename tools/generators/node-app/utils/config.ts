import { joinPathFragments, ProjectConfiguration, TargetConfiguration } from "@nrwl/devkit"
import { NormalizedSchema } from ".."

export const getBuildConfig = (
  project: ProjectConfiguration,
  options: NormalizedSchema,
  { shouldServe } = { shouldServe: false }
): TargetConfiguration => {
  const sourceRoot = project.sourceRoot ?? ""
  const entry = joinPathFragments(sourceRoot, "main.ts")
  const outfile = joinPathFragments("dist", options.appProjectRoot, "main.js")

  const executorType = shouldServe ? "serve" : "build"

  return {
    executor: `@wanews/nx-esbuild:${executorType}`,
    options: {
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      target: "node18",
      outfile,
    },
    configurations: {
      production: {},
    },
  }
}

export const getServeConfig = (options: NormalizedSchema): TargetConfiguration => {
  const outfile = joinPathFragments("dist", options.appProjectRoot, "main.js")

  return {
    executor: "nx:run-commands",
    options: {
      command: `node ${outfile}`,
    },
    configurations: {
      production: {},
    },
  }
}
