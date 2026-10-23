import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

// Parse source and tooling without executing browser code or writing artifacts.
const files = ['build.mjs', 'verify.mjs'];
for (const directory of ['src', 'scripts']) {
  for (const file of fs.readdirSync(directory, {recursive: true})) {
    if (/\.(?:js|mjs)$/.test(file)) files.push(path.join(directory, file));
  }
}

let failures = 0;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
  if (result.error || result.status !== 0) {
    failures++;
    console.error(`FAIL: ${file}\n${result.error?.message || result.stderr}`);
  }
}
if (failures) {
  console.error(`${failures} syntax check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${files.length} JavaScript source/tooling files parsed without execution.`);
}
