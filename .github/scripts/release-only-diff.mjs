// Says whether the change between two commits is only what `changeset version` writes: deleted changesets,
// changelogs, and package.json files that differ in nothing but `version`. Such a change is the same code under a
// new version number, so the tests that passed on the base commit still stand and need not run again.
//
// Turborepo cannot make this call: a package's package.json is always part of its task hash, so a version bump is a
// cache miss for every task of that package (https://github.com/vercel/turborepo/issues/6132).
//
// Usage: node .github/scripts/release-only-diff.mjs <base> <head>
// Prints `release-only=true` or `release-only=false`, with the first file that decided it, and appends the same line
// to $GITHUB_OUTPUT when it is set. Anything it cannot read counts as `false`: the tests then run.

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const [base, head] = process.argv.slice(2);

/**
 * Runs git and returns what it printed.
 * @param {string[]} args - The arguments after `git`
 */
const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/**
 * A package.json at a commit, without its version.
 * @param {string} commit - The commit to read from
 * @param {string} path - The file's path
 */
const withoutVersion = (commit, path) => {
  const manifest = JSON.parse(git(['show', `${commit}:${path}`]));
  delete manifest.version;
  return JSON.stringify(manifest);
};

/**
 * Whether one changed file is something a release writes.
 * @param {string} status - Git's status letter, like `M` or `D`
 * @param {string} path - The file's path
 */
const isReleaseChange = (status, path) => {
  if (/^\.changeset\/[^/]+\.md$/.test(path)) return status === 'D';
  if (/(^|\/)CHANGELOG\.md$/.test(path)) return true;
  if (/(^|\/)package\.json$/.test(path) && status === 'M') {
    return withoutVersion(base, path) === withoutVersion(head, path);
  }
  return false;
};

/** Reads the diff and decides. */
const decide = () => {
  if (!base || !head || /^0+$/.test(base)) {
    return { reason: 'no base commit to compare with', releaseOnly: false };
  }

  // Three dots: what the head changed since it left the base, whatever the base did meanwhile.
  const changes = git([
    'diff',
    '--name-status',
    '--no-renames',
    `${base}...${head}`
  ])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...path] = line.split('\t');
      return { path: path.join('\t'), status };
    });

  if (changes.length === 0) {
    return { reason: 'no files changed', releaseOnly: false };
  }

  const other = changes.find(
    ({ path, status }) => !isReleaseChange(status, path)
  );
  return other
    ? { reason: `${other.status} ${other.path}`, releaseOnly: false }
    : { reason: `${String(changes.length)} release files`, releaseOnly: true };
};

let result;
try {
  result = decide();
} catch (error) {
  result = {
    reason: `could not read the diff: ${String(error)}`,
    releaseOnly: false
  };
}

const line = `release-only=${String(result.releaseOnly)}`;
console.log(`${line} (${result.reason})`);
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `${line}\n`);
