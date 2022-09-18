import type { ExecutorContext } from '@nrwl/devkit';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { joinPathFragments } from '@nrwl/devkit';

export interface PhpExecutorOptions {
  hostPath: string;
  hostname: string;
}

export default async function phpExecutor(
  options: PhpExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectRoot = context.workspace.projects[context.projectName].root;
  const hostPath = joinPathFragments(projectRoot, options.hostPath)

  try {
    await promisify(spawn)(
      'php',
      ['-S', options.hostname, hostPath],
      { stdio: 'inherit' }
    );

    return { success: true };
  } catch {
    return { success: false };
  }
}
