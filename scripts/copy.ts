import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function copy(filename: string, from: string, to: string): void {
  copyFileSync(resolve(from, filename), resolve(to, filename));
}

function rewrite(path: string, replacer: (from: string) => string): void {
  const file = readFileSync(path).toString();
  const replaced = replacer(file);
  writeFileSync(path, replaced);
}

const root = resolve(__dirname, '..');
const target = resolve(process.cwd(), 'dist');

copy('README.md', root, target);
copy('LICENSE',  root, target);
copy('package.json', process.cwd(), target);
rewrite(resolve(target, 'package.json'), pkg => pkg.replace(/dist\//g, ''));
