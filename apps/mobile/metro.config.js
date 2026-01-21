const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies from this project's node_modules
//    lowest in the tree (i.e. apps/mobile/node_modules)
//    This prevents "duplicate react" errors when web app uses a different version
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
