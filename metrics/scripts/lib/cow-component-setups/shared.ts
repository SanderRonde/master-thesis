import * as path from 'path';

export function getCowComponentsDirs(baseDir: string, framework: string) {
	const demoRepoDir = path.join(baseDir, 'dist/demo-repo');
	const frameworkDemoDir = path.join(demoRepoDir, framework);
	const demoMetricsDir = path.join(frameworkDemoDir, 'metrics');
	const toggleableDir = path.join(demoMetricsDir, 'toggleable');

	return {
		demoRepoDir,
		frameworkDemoDir,
		demoMetricsDir,
		toggleableDir,
	};
}
