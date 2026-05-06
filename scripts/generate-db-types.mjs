import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUTPUT_FILE_PATH = resolve('lib/types/database.types.ts');
const SUPABASE_COMMAND = 'supabase';
const SUPABASE_ARGS = [
  'gen',
  'types',
  'typescript',
  '--linked',
  '--schema',
  'public',
];
const SUPABASE_UPDATE_NOTICE_PREFIXES = [
  'A new version of Supabase CLI is available:',
  'We recommend updating regularly for new features and bug fixes:',
];

function removeCliUpdateNotice(output) {
  return output
    .split('\n')
    .filter(
      (line) =>
        !SUPABASE_UPDATE_NOTICE_PREFIXES.some((prefix) =>
          line.startsWith(prefix),
        ),
    )
    .join('\n');
}

const generationResult = spawnSync(SUPABASE_COMMAND, SUPABASE_ARGS, {
  encoding: 'utf8',
});

if (generationResult.error) {
  throw generationResult.error;
}

if (generationResult.status !== 0) {
  if (generationResult.stdout) {
    process.stdout.write(generationResult.stdout);
  }

  if (generationResult.stderr) {
    process.stderr.write(generationResult.stderr);
  }

  process.exit(generationResult.status ?? 1);
}

const generatedTypes = removeCliUpdateNotice(generationResult.stdout).trimEnd();

mkdirSync(dirname(OUTPUT_FILE_PATH), { recursive: true });
writeFileSync(OUTPUT_FILE_PATH, `${generatedTypes}\n`);

if (generationResult.stderr) {
  process.stderr.write(generationResult.stderr);
}
