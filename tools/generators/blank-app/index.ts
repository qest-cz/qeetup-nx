import {
  Tree,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  joinPathFragments,
  names
} from '@nrwl/devkit';

interface BlankAppGeneratorSchema {
  appName: string;
}

export default async function (tree: Tree, schema: BlankAppGeneratorSchema) {
  // Get apps dir path
  const { appsDir } = getWorkspaceLayout(tree);
  // Generate app directory name
  const appDirectory = names(schema.appName).fileName
  // Get app root
  const appProjectRoot = joinPathFragments(appsDir, appDirectory)

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    appProjectRoot, {
      appName: schema.appName,
    }
  );

  // Format files with prettier
  await formatFiles(tree);
  return () => {
    // Install dependecies which new app needs
    installPackagesTask(tree);
  };
}
