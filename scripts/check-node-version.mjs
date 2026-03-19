import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function readTrimmed(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf8').trim() || null;
}

function readPackageNodeRange() {
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.engines?.node ?? null;
}

function extractMajor(value) {
  const match = value?.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

const currentVersion = process.version;
const currentMajor = extractMajor(currentVersion);
const packageNodeRange = readPackageNodeRange();
const nvmrcVersion = readTrimmed(path.join(rootDir, '.nvmrc'));
const nodeVersionFile = readTrimmed(path.join(rootDir, '.node-version'));

const declaredSources = [
  ['package.json engines.node', packageNodeRange],
  ['.nvmrc', nvmrcVersion],
  ['.node-version', nodeVersionFile],
].filter(([, value]) => value);

const expectedMajor = extractMajor(packageNodeRange ?? nvmrcVersion ?? nodeVersionFile);
const declaredMajors = [...new Set(declaredSources.map(([, value]) => extractMajor(value)).filter(Boolean))];

console.log('Node version parity report');
console.log('=========================');
console.log(`Current Node: ${currentVersion}`);

for (const [label, value] of declaredSources) {
  console.log(`${label}: ${value}`);
}

if (!expectedMajor) {
  console.error('\nUnable to determine the expected Node version from repo metadata.');
  process.exit(1);
}

if (declaredMajors.length > 1) {
  console.error('\nRepository Node version declarations are inconsistent.');
  process.exit(1);
}

if (currentMajor !== expectedMajor) {
  console.error('\nNode version mismatch detected.');
  console.error(`Expected major: ${expectedMajor}.x`);
  console.error(`Current major: ${currentMajor}.x`);
  console.error('\nFormal release validation should run on the declared Node major.');
  console.error('Switch the shell to the repo version, then rerun:');
  console.error('  pnpm check:node');
  console.error('  pnpm check:env');
  console.error('  pnpm build');
  console.error('  pnpm smoke:socrates');
  console.error('  pnpm smoke:study-flow');
  process.exit(1);
}

console.log('\nNode version parity passed.');
