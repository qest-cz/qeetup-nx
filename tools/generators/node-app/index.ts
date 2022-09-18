import { join } from "path"
import {
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readWorkspaceConfiguration,
  Tree,
  updateWorkspaceConfiguration,
} from "@nrwl/devkit"
import { Linter, lintProjectGenerator } from "@nrwl/linter"
import { jestProjectGenerator } from "@nrwl/jest"
import { runTasksInSerial } from "@nrwl/workspace/src/utilities/run-tasks-in-serial"
import { getRelativePathToRootTsConfig } from "@nrwl/workspace/src/utilities/typescript"
import { Schema } from "./schema"
import { getBuildConfig, getServeConfig } from "./utils/config"

export interface NormalizedSchema extends Schema {
  appProjectRoot: string
  parsedTags: string[]
}

function addProject(tree: Tree, options: NormalizedSchema) {
  const project: ProjectConfiguration = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, "src"),
    projectType: "application",
    targets: {},
    tags: options.parsedTags,
  }

  if (project.targets) {
    project.targets.build = getBuildConfig(project, options)
    project.targets.dev = getBuildConfig(project, options, { shouldServe: true })
    project.targets.serve = getServeConfig(options)
  }

  addProjectConfiguration(tree, options.name, project, options.standaloneConfig)

  const workspace = readWorkspaceConfiguration(tree)

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.name
    updateWorkspaceConfiguration(tree, workspace)
  }
}

function addAppFiles(tree: Tree, options: NormalizedSchema) {
  generateFiles(tree, join(__dirname, "./files"), options.appProjectRoot, {
    tmpl: "",
    name: options.name,
    root: options.appProjectRoot,
    offset: offsetFromRoot(options.appProjectRoot),
    rootTsConfigPath: getRelativePathToRootTsConfig(tree, options.appProjectRoot),
  })
}

export async function addLintingToApplication(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  const lintTask = await lintProjectGenerator(tree, {
    linter: Linter.EsLint,
    project: options.name,
    tsConfigPaths: [joinPathFragments(options.appProjectRoot, "tsconfig.app.json")],
    eslintFilePatterns: [`${options.appProjectRoot}/**/*.ts`],
    skipFormat: true,
  })

  return lintTask
}

export async function applicationGenerator(tree: Tree, schema: Schema) {
  const options = normalizeOptions(tree, schema)

  const tasks: GeneratorCallback[] = []

  addAppFiles(tree, options)
  addProject(tree, options)

  const lintingTask = await addLintingToApplication(tree, options)

  const jestTask = await jestProjectGenerator(tree, {
    ...options,
    project: options.name,
    setupFile: "none",
    skipSerializers: true,
    testEnvironment: "node",
    skipFormat: true,
  })

  tasks.push(jestTask)
  tasks.push(lintingTask)

  await formatFiles(tree)

  return runTasksInSerial(...tasks)
}

function normalizeOptions(host: Tree, options: Schema): NormalizedSchema {
  const { appsDir } = getWorkspaceLayout(host)

  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName

  const appProjectName = appDirectory.replace(new RegExp("/", "g"), "-")
  const appProjectRoot = joinPathFragments(appsDir, appDirectory)

  const parsedTags = options.tags ? options.tags.split(",").map((s) => s.trim()) : []

  return {
    ...options,
    name: names(appProjectName).fileName,
    appProjectRoot,
    parsedTags,
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? "jest",
  }
}

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator)
