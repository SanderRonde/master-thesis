const path = require('path');
 
require('ts-node').register({
	transpileOnly: true,
	project: path.join(__dirname, '../../../../tsconfig.json')
});
require(path.resolve(__dirname, './image-compare-worker.ts'));