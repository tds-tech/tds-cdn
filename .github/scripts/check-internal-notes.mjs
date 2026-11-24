#!/usr/bin/env node
// Fails when a file ADDED or MODIFIED between two commits has a code comment with an internal note:
// a team first name, a task-tracker name, id or link, or a screen-recording / chat tool name.
// This repo is public. Only files changed in the given range are read, so older files are not re-judged.
// No dependencies: Node standard library only.
//   node check-internal-notes.mjs <base-sha> <head-sha>
//   node check-internal-notes.mjs --self-test
//   node check-internal-notes.mjs --files <path>...      (check working-tree files, for local use)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Team first names are matched by hash so this public file does not list them:
// sha256(lowercase word), first 12 hex chars.
const NAME_HASHES = new Set(['d105f3487561', 'ff06535ac102', '4c5f790f58d4', 'ba2d0830e65e', 'f527721c5455', '076a89c23179', '0a92efb1b91a', '8cf3cfc378bc', 'd7863884b7de', '7b85175b4550', 'ce65fa41b16c']);
const TOOLS = /click\s?up|\bloom\b|loom\.com|\bslack\b/i;
const IDS = /\b86e[0-9a-z]{6}\b|\b1dfevgg[0-9a-z]{4}\b/;
const seen = new Map();
const isName = (w) => { w = w.toLowerCase(); if (!seen.has(w)) seen.set(w, NAME_HASHES.has(createHash('sha256').update(w).digest('hex').slice(0, 12))); return seen.get(w); };
export function bannedTerm(text) {
  const m = TOOLS.exec(text) || IDS.exec(text); if (m) return m[0];
  for (const w of text.match(/[A-Za-z]+/g) || []) if (isName(w)) return w;
  return null;
}
const CODE_EXT = { js: 'js', mjs: 'js', cjs: 'js', css: 'css', html: 'html', htm: 'html' };

// ---- comment scanners: each returns [{start, text}] ----
const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'instanceof', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'of']);
export function jsComments(src, base = 0) {
  const out = []; const n = src.length; let i = 0; let prev = ''; // prev = last significant token (char or word)
  const tmpl = []; // stack of brace depths for `${ ... }` inside template literals
  let depth = 0;
  const skipString = (q) => { i++; while (i < n && src[i] !== q) { if (src[i] === '\\') i++; else if (src[i] === '\n' && q !== '`') break; i++; } i++; };
  const skipTemplate = () => { // at the char after ` or after the } that closes ${...}
    while (i < n) {
      if (src[i] === '\\') { i += 2; continue; }
      if (src[i] === '`') { i++; return; }
      if (src[i] === '$' && src[i + 1] === '{') { i += 2; tmpl.push(depth); depth++; return; }
      i++;
    }
  };
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { let e = src.indexOf('\n', i); if (e === -1) e = n; out.push({ start: base + i, text: src.slice(i, e) }); i = e; continue; }
    if (c === '/' && d === '*') { let e = src.indexOf('*/', i + 2); e = e === -1 ? n : e + 2; out.push({ start: base + i, text: src.slice(i, e) }); i = e; continue; }
    if (c === '<' && src.startsWith('<!--', i)) { let e = src.indexOf('\n', i); if (e === -1) e = n; out.push({ start: base + i, text: src.slice(i, e) }); i = e; continue; }
    if (c === '"' || c === "'") { skipString(c); prev = 'str'; continue; }
    if (c === '`') { i++; skipTemplate(); prev = 'str'; continue; }
    if (c === '{') { depth++; i++; prev = c; continue; }
    if (c === '}') { depth--; i++; if (tmpl.length && tmpl[tmpl.length - 1] === depth) { tmpl.pop(); skipTemplate(); prev = 'str'; } else prev = c; continue; }
    if (c === '/') {
      const regexAllowed = prev === '' || REGEX_AFTER_WORD.has(prev) || (prev.length === 1 && '(,=:[!&|?{};+-*%<>~^'.includes(prev));
      if (regexAllowed) { i++; let cls = false; while (i < n && src[i] !== '\n') { if (src[i] === '\\') i++; else if (src[i] === '[') cls = true; else if (src[i] === ']') cls = false; else if (src[i] === '/' && !cls) break; i++; } i++; prev = 'str'; continue; }
      i++; prev = c; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[A-Za-z0-9_$]/.test(c)) { let e = i; while (e < n && /[A-Za-z0-9_$]/.test(src[e])) e++; prev = src.slice(i, e); i = e; continue; }
    prev = c; i++;
  }
  return out;
}
export function cssComments(src, base = 0) {
  const out = []; const n = src.length; let i = 0;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { let e = src.indexOf('*/', i + 2); e = e === -1 ? n : e + 2; out.push({ start: base + i, text: src.slice(i, e) }); i = e; continue; }
    if (c === '"' || c === "'") { i++; while (i < n && src[i] !== c && src[i] !== '\n') { if (src[i] === '\\') i++; i++; } i++; continue; }
    if ((c === 'u' || c === 'U') && /^url\(\s*[^"'\s)]/i.test(src.slice(i, i + 12))) { const e = src.indexOf(')', i); i = e === -1 ? n : e + 1; continue; }
    i++;
  }
  return out;
}
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript', 'application/ecmascript']);
export function htmlComments(src) {
  const out = []; const n = src.length; let i = 0;
  const tagEnd = (from) => { let j = from, q = ''; while (j < n) { const ch = src[j]; if (q) { if (ch === q) q = ''; } else if (ch === '"' || ch === "'") q = ch; else if (ch === '>') return j + 1; j++; } return n; };
  while (i < n) {
    const lt = src.indexOf('<', i); if (lt === -1) break; i = lt;
    if (src.startsWith('<!--', i)) { let e = src.indexOf('-->', i + 4); e = e === -1 ? n : e + 3; out.push({ start: i, text: src.slice(i, e) }); i = e; continue; }
    const m = /^<(script|style|textarea|title|xmp|plaintext)\b/i.exec(src.slice(i, i + 12));
    if (m) {
      const tag = m[1].toLowerCase(), open = tagEnd(i), head = src.slice(i, open);
      const closeRe = new RegExp('</' + tag + '[\\s/>]', 'i'); const rest = src.slice(open); const cm = closeRe.exec(rest);
      const body = cm ? rest.slice(0, cm.index) : rest;
      if (tag === 'style') out.push(...cssComments(body, open));
      if (tag === 'script' && !/\ssrc\s*=/i.test(head)) {
        const t = /\stype\s*=\s*["']?([^"'\s>]*)/i.exec(head);
        if (JS_TYPES.has((t ? t[1] : '').toLowerCase())) out.push(...jsComments(body, open));
      }
      i = open + body.length + (cm ? 2 : 0); continue;
    }
    if (/^<[A-Za-z\/!?]/.test(src.slice(i, i + 2))) { i = tagEnd(i + 1); continue; }
    i++;
  }
  return out;
}
export function bannedComments(text, kind) {
  const all = kind === 'js' ? jsComments(text) : kind === 'css' ? cssComments(text) : htmlComments(text);
  return all.map((c) => ({ c, term: bannedTerm(c.text) })).filter((x) => x.term).map(({ c, term }) => ({ line: text.slice(0, c.start).split('\n').length, term, text: c.text.replace(/\s+/g, ' ').slice(0, 140) }));
}

function selfTest() {
  const N = 'Gabriel'; // public: the founder is named on every page
  const cases = [
    ['js', `var a = 1; // ${N} 10-12: "too plain"`, 1],
    ['js', `/* v1.8.0 (${N}, 2026-07-14) */ var a;`, 1],
    ['js', `var u = "https://x.test/a"; var s = "// ${N}"; var r = /\\/\\/ ${N}/; var t = \`/* ${N} */ \${a /* ok */}\`;`, 0],
    ['js', 'var a = b / c; // see ticket 86e1j4d5u', 1],
    ['css', `a{color:red} /* ${N}: brighter */`, 1],
    ['css', `a{background:url(https://x.test/a.png);content:"/* ${N} */"}`, 0],
    ['html', `<p>${N} Segall, CEO</p><a title="<!-- ${N} -->">x</a>`, 0],
    ['html', `<div><!-- ${N}: move this up --></div>`, 1],
    ['html', `<style>/* (${N} 10-12) */ a{}</style><script>var x = 1; // click up task</script><script type="application/ld+json">{"name":"// ${N}"}</script>`, 2],
    ['html', '<textarea><!-- not a comment --></textarea><!-- plain note -->', 0],
  ];
  let bad = 0;
  for (const [kind, text, want] of cases) { const got = bannedComments(text, kind).length; if (got !== want) { bad++; console.error(`self-test FAIL (${kind}) want ${want} got ${got}: ${text.slice(0, 80)}`); } }
  if (bad) process.exit(2);
  console.log(`self-test ok (${cases.length} cases)`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--self-test') return selfTest();
  let files, read;
  if (args[0] === '--files') { files = args.slice(1); read = (f) => readFileSync(f, 'utf8'); }
  else {
    const [base, head] = args;
    if (!base || !head) { console.error('usage: check-internal-notes.mjs <base-sha> <head-sha> | --self-test | --files <path>...'); process.exit(2); }
    const git = (...a) => execFileSync('git', a, { maxBuffer: 1 << 28 });
    files = git('diff', '--name-only', '--diff-filter=AM', '-z', base, head).toString().split('\0').filter(Boolean);
    read = (f) => git('show', `${head}:${f}`).toString('utf8');
  }
  let hits = 0, checked = 0;
  for (const f of files) {
    const kind = CODE_EXT[f.split('.').pop().toLowerCase()]; if (!kind) continue;
    checked++;
    for (const h of bannedComments(read(f), kind)) { hits++; console.log(`::error file=${f},line=${h.line}::internal note in a comment ("${h.term}"): ${h.text}`); }
  }
  console.log(`${files.length} changed file(s), ${checked} checked, ${hits} comment(s) with internal notes`);
  if (hits) { console.log('This repository is public. Remove names, ticket ids/links and tool references from code comments.'); process.exit(1); }
}
if (process.argv[1] && process.argv[1].endsWith('check-internal-notes.mjs')) main();
