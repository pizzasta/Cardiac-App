// Load a dependency-free TypeScript module from a Node script by transpiling
// it with the project's own TypeScript. Used by the gen:* scripts so generated
// files come from the same source the app imports.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

export async function loadTs(file) {
  const src = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'circadia-gen-'));
  const out = path.join(dir, path.basename(file).replace(/\.ts$/, '.mjs'));
  fs.writeFileSync(out, outputText);
  try {
    return await import(pathToFileURL(out).href);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
