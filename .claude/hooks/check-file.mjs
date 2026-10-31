import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const { tool_input } = JSON.parse(readFileSync(0, 'utf8'));
const file = tool_input?.file_path;
if (!file || !/\.(jsx?|json|css|md|ya?ml)$/.test(file)) process.exit(0);

execFileSync('npx', ['prettier', '--write', file], { stdio: 'ignore', shell: true });
if (/\.jsx?$/.test(file)) {
  const r = spawnSync('npx', ['eslint', '--max-warnings', '0', file], {
    encoding: 'utf8',
    shell: true,
  });
  if (r.status !== 0) {
    process.stderr.write(r.stdout + r.stderr);
    process.exit(2); // exit 2 feeds the lint errors straight back to Claude
  }
}
