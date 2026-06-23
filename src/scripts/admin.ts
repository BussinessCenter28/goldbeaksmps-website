/* ====================================================================
   GoldBeak SMPS — /admin panel runtime
   --------------------------------------------------------------------
   A fully client-side editor for staff, rules, and news. It reads and
   writes files directly in the GitHub repo using the GitHub REST API
   and a fine-grained personal access token that YOU paste in (stored
   only in this browser's localStorage). Every save is a commit, which
   triggers the GitHub Pages rebuild — changes go live in ~1–2 minutes.
   ==================================================================== */
import { REPO } from '../config';

type Conn = { token: string; owner: string; repo: string; branch: string };

const STAFF_PATH = 'src/data/staff.json';
const RULES_PATH = 'src/data/rules.json';
const NEWS_DIR = 'src/content/news';
const LS_KEY = 'goldbeak-admin';

const ACCENTS = ['gold', 'red', 'purple', 'blue', 'green', 'gray'];

let conn: Conn | null = null;

/* ----- tiny DOM helpers ----- */
const $ = <T extends HTMLElement = HTMLElement>(sel: string) =>
  document.querySelector(sel) as T | null;
const el = (tag: string, props: Record<string, any> = {}, ...kids: (Node | string)[]) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const kid of kids) node.append(kid as any);
  return node;
};

/* ----- base64 (UTF-8 safe) ----- */
const b64encode = (str: string) => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const b64decode = (b64: string) => {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/* ----- GitHub API ----- */
const ghHeaders = () => ({
  Authorization: `Bearer ${conn!.token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
});
const apiBase = () => `https://api.github.com/repos/${conn!.owner}/${conn!.repo}`;

async function getFile(path: string): Promise<{ sha: string | null; content: string }> {
  const res = await fetch(`${apiBase()}/contents/${path}?ref=${conn!.branch}`, {
    headers: ghHeaders(),
    cache: 'no-store',
  });
  if (res.status === 404) return { sha: null, content: '' };
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return { sha: data.sha, content: b64decode(data.content) };
}

async function listDir(path: string): Promise<any[]> {
  const res = await fetch(`${apiBase()}/contents/${path}?ref=${conn!.branch}`, {
    headers: ghHeaders(),
    cache: 'no-store',
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

async function putFile(path: string, content: string, sha: string | null, message: string) {
  const body: Record<string, any> = { message, content: b64encode(content), branch: conn!.branch };
  if (sha) body.sha = sha;
  const res = await fetch(`${apiBase()}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

async function deleteFile(path: string, sha: string, message: string) {
  const res = await fetch(`${apiBase()}/contents/${path}`, {
    method: 'DELETE',
    headers: ghHeaders(),
    body: JSON.stringify({ message, sha, branch: conn!.branch }),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

/* ====================================================================
   Auth
   ==================================================================== */
function loadConn(): Conn | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Conn) : null;
  } catch {
    return null;
  }
}

async function connect(c: Conn): Promise<void> {
  conn = c;
  // Validate by reading the repo metadata.
  const res = await fetch(apiBase(), { headers: ghHeaders() });
  if (!res.ok) {
    conn = null;
    throw new Error(
      res.status === 401
        ? 'Invalid token (401). Check the token and try again.'
        : res.status === 404
        ? 'Repo not found (404). Check owner/repo name and that the token can access it.'
        : `GitHub error ${res.status}.`
    );
  }
  localStorage.setItem(LS_KEY, JSON.stringify(c));
}

function disconnect() {
  conn = null;
  localStorage.removeItem(LS_KEY);
  showAuth();
}

/* ====================================================================
   UI state
   ==================================================================== */
function showAuth() {
  $('#auth-panel')!.style.display = '';
  $('#editor')!.style.display = 'none';
}
function showEditor() {
  $('#auth-panel')!.style.display = 'none';
  $('#editor')!.style.display = '';
  $('#conn-label')!.textContent = `${conn!.owner}/${conn!.repo} · ${conn!.branch}`;
  switchTab('staff');
}

function switchTab(name: 'staff' | 'rules' | 'news') {
  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.classList.toggle('active', (b as HTMLElement).dataset.tab === name)
  );
  document.querySelectorAll('[data-panel]').forEach((p) => {
    (p as HTMLElement).style.display = (p as HTMLElement).dataset.panel === name ? '' : 'none';
  });
  if (name === 'staff') loadStaff();
  if (name === 'rules') loadRules();
  if (name === 'news') loadNews();
}

function setMsg(sel: string, text: string, kind: 'ok' | 'err' | '' = '') {
  const node = $(sel);
  if (!node) return;
  node.textContent = text;
  node.className = `admin-msg ${kind}`;
}

/* ====================================================================
   STAFF editor
   ==================================================================== */
let staffSha: string | null = null;

async function loadStaff() {
  const root = $('#staff-list')!;
  root.innerHTML = 'Loading…';
  try {
    const { sha, content } = await getFile(STAFF_PATH);
    staffSha = sha;
    const data = JSON.parse(content || '[]');
    root.innerHTML = '';
    data.forEach((group: any) => root.append(staffRow(group)));
    setMsg('#staff-msg', '');
  } catch (e: any) {
    root.innerHTML = '';
    setMsg('#staff-msg', e.message, 'err');
  }
}

function staffRow(group: { role: string; accent: string; members: string[] }) {
  const members = el('div', { class: 'chip-list' });
  const addMember = (name = '') => {
    const input = el('input', { class: 'admin-input chip-input', value: name, placeholder: 'username' });
    const chip = el('div', { class: 'chip' }, input,
      el('button', { class: 'chip-x', title: 'Remove', onclick: () => chip.remove() }, '✕'));
    members.append(chip);
  };
  group.members.forEach((m) => addMember(m));

  const accentSel = el('select', { class: 'admin-input admin-select' });
  ACCENTS.forEach((a) => {
    const o = el('option', { value: a }, a);
    if (a === group.accent) o.setAttribute('selected', 'true');
    accentSel.append(o);
  });

  const card = el('div', { class: 'admin-card', 'data-role': '' },
    el('div', { class: 'admin-card-head' },
      el('input', { class: 'admin-input', value: group.role, placeholder: 'Role name', 'data-field': 'role' }),
      accentSel,
      el('button', { class: 'btn-mini danger', onclick: () => card.remove() }, 'Delete role')
    ),
    members,
    el('button', { class: 'btn-mini', onclick: () => addMember() }, '+ Add member')
  );
  (card as any)._accentSel = accentSel;
  (card as any)._members = members;
  return card;
}

function collectStaff() {
  const groups: any[] = [];
  $('#staff-list')!.querySelectorAll('.admin-card').forEach((card) => {
    const role = (card.querySelector('[data-field="role"]') as HTMLInputElement).value.trim();
    const accent = (card.querySelector('select') as HTMLSelectElement).value;
    const members: string[] = [];
    card.querySelectorAll('.chip-input').forEach((i) => {
      const v = (i as HTMLInputElement).value.trim();
      if (v) members.push(v);
    });
    if (role) groups.push({ role, accent, members });
  });
  return groups;
}

async function saveStaff() {
  setMsg('#staff-msg', 'Saving…');
  try {
    const json = JSON.stringify(collectStaff(), null, 2) + '\n';
    const res = await putFile(STAFF_PATH, json, staffSha, 'admin: update staff');
    // Use the SHA returned by the write — re-reading immediately can return a
    // stale SHA (the API is eventually-consistent) and cause a 409 next save.
    staffSha = res?.content?.sha ?? staffSha;
    setMsg('#staff-msg', '✓ Saved! The site will rebuild in ~1–2 min.', 'ok');
  } catch (e: any) {
    setMsg('#staff-msg', e.message, 'err');
  }
}

/* ====================================================================
   RULES editor
   ==================================================================== */
let rulesSha: string | null = null;

async function loadRules() {
  const root = $('#rules-list')!;
  root.innerHTML = 'Loading…';
  try {
    const { sha, content } = await getFile(RULES_PATH);
    rulesSha = sha;
    const data = JSON.parse(content || '[]');
    root.innerHTML = '';
    data.forEach((r: any) => root.append(ruleRow(r)));
    setMsg('#rules-msg', '');
  } catch (e: any) {
    root.innerHTML = '';
    setMsg('#rules-msg', e.message, 'err');
  }
}

function ruleRow(rule: { title: string; note: string }) {
  const card = el('div', { class: 'admin-card' },
    el('div', { class: 'admin-card-head' },
      el('input', { class: 'admin-input', value: rule.title, placeholder: 'Rule', 'data-field': 'title' }),
      el('button', { class: 'btn-mini danger', onclick: () => card.remove() }, 'Delete')
    ),
    el('input', { class: 'admin-input', value: rule.note, placeholder: 'Short explanation', 'data-field': 'note' })
  );
  return card;
}

function collectRules() {
  const rules: any[] = [];
  $('#rules-list')!.querySelectorAll('.admin-card').forEach((card) => {
    const title = (card.querySelector('[data-field="title"]') as HTMLInputElement).value.trim();
    const note = (card.querySelector('[data-field="note"]') as HTMLInputElement).value.trim();
    if (title) rules.push({ title, note });
  });
  return rules;
}

async function saveRules() {
  setMsg('#rules-msg', 'Saving…');
  try {
    const json = JSON.stringify(collectRules(), null, 2) + '\n';
    const res = await putFile(RULES_PATH, json, rulesSha, 'admin: update rules');
    rulesSha = res?.content?.sha ?? rulesSha;
    setMsg('#rules-msg', '✓ Saved! The site will rebuild in ~1–2 min.', 'ok');
  } catch (e: any) {
    setMsg('#rules-msg', e.message, 'err');
  }
}

/* ====================================================================
   NEWS editor
   ==================================================================== */
function parseFrontmatter(md: string) {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  const fm: Record<string, string> = {};
  let body = md;
  if (m) {
    body = m[2];
    m[1].split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i === -1) return;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      val = val.replace(/^["']|["']$/g, '');
      fm[key] = val;
    });
  }
  return { fm, body: body.trim() };
}

function buildMarkdown(f: { title: string; date: string; summary: string; author: string; tag: string; body: string }) {
  const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
  const lines = ['---', `title: ${q(f.title)}`, `date: ${f.date}`, `summary: ${q(f.summary)}`, `author: ${q(f.author)}`];
  if (f.tag) lines.push(`tag: ${q(f.tag)}`);
  lines.push('---', '', f.body.trim(), '');
  return lines.join('\n');
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'post';

async function loadNews() {
  const root = $('#news-list')!;
  root.innerHTML = 'Loading…';
  try {
    const files = (await listDir(NEWS_DIR)).filter((f) => f.name.endsWith('.md'));
    root.innerHTML = '';
    if (files.length === 0) root.append(el('p', { class: 'admin-dim' }, 'No posts yet.'));
    files
      .sort((a, b) => b.name.localeCompare(a.name))
      .forEach((f) => {
        root.append(
          el('div', { class: 'admin-row' },
            el('span', { class: 'admin-row-name' }, f.name),
            el('span', {},
              el('button', { class: 'btn-mini', onclick: () => editPost(f.path, f.name) }, 'Edit'),
              el('button', { class: 'btn-mini danger', onclick: () => deletePost(f.path, f.name, f.sha) }, 'Delete')
            )
          )
        );
      });
    setMsg('#news-msg', '');
  } catch (e: any) {
    root.innerHTML = '';
    setMsg('#news-msg', e.message, 'err');
  }
}

let editingPath: string | null = null;
let editingSha: string | null = null;

function fillForm(f: Partial<{ title: string; date: string; summary: string; author: string; tag: string; body: string }>) {
  ($('#np-title') as HTMLInputElement).value = f.title ?? '';
  ($('#np-date') as HTMLInputElement).value = f.date ?? '';
  ($('#np-summary') as HTMLInputElement).value = f.summary ?? '';
  ($('#np-author') as HTMLInputElement).value = f.author ?? 'GoldBeak Staff';
  ($('#np-tag') as HTMLInputElement).value = f.tag ?? '';
  ($('#np-body') as HTMLTextAreaElement).value = f.body ?? '';
}

function newPost() {
  editingPath = null;
  editingSha = null;
  fillForm({ author: 'GetIced_' });
  $('#np-heading')!.textContent = 'New post';
  setMsg('#news-form-msg', '');
}

async function editPost(path: string, name: string) {
  setMsg('#news-form-msg', 'Loading…');
  try {
    const { sha, content } = await getFile(path);
    const { fm, body } = parseFrontmatter(content);
    editingPath = path;
    editingSha = sha;
    fillForm({ title: fm.title, date: fm.date, summary: fm.summary, author: fm.author, tag: fm.tag, body });
    $('#np-heading')!.textContent = `Editing: ${name}`;
    setMsg('#news-form-msg', '');
    $('#news-form')!.scrollIntoView({ behavior: 'smooth' });
  } catch (e: any) {
    setMsg('#news-form-msg', e.message, 'err');
  }
}

async function deletePost(path: string, name: string, sha: string) {
  if (!confirm(`Delete "${name}"? This commits a deletion to the repo.`)) return;
  setMsg('#news-msg', 'Deleting…');
  try {
    await deleteFile(path, sha, `admin: delete news ${name}`);
    setMsg('#news-msg', `✓ Deleted ${name}.`, 'ok');
    await loadNews();
  } catch (e: any) {
    setMsg('#news-msg', e.message, 'err');
  }
}

async function savePost() {
  const f = {
    title: ($('#np-title') as HTMLInputElement).value.trim(),
    date: ($('#np-date') as HTMLInputElement).value.trim(),
    summary: ($('#np-summary') as HTMLInputElement).value.trim(),
    author: ($('#np-author') as HTMLInputElement).value.trim() || 'GoldBeak Staff',
    tag: ($('#np-tag') as HTMLInputElement).value.trim(),
    body: ($('#np-body') as HTMLTextAreaElement).value,
  };
  if (!f.title || !f.date || !f.summary) {
    setMsg('#news-form-msg', 'Title, date and summary are required.', 'err');
    return;
  }
  setMsg('#news-form-msg', 'Saving…');
  try {
    const md = buildMarkdown(f);
    const path = editingPath ?? `${NEWS_DIR}/${slugify(f.title)}.md`;
    const res = await putFile(path, md, editingSha, editingPath ? `admin: update news ${path}` : `admin: add news ${path}`);
    // Stay on this post with the fresh SHA so repeated saves don't 409.
    editingPath = path;
    editingSha = res?.content?.sha ?? null;
    $('#np-heading')!.textContent = `Editing: ${path.split('/').pop()}`;
    setMsg('#news-form-msg', '✓ Saved! The site will rebuild in ~1–2 min.', 'ok');
    await loadNews();
  } catch (e: any) {
    setMsg('#news-form-msg', e.message, 'err');
  }
}

/* ====================================================================
   Boot
   ==================================================================== */
export function initAdmin() {
  // Prefill auth fields from config defaults.
  ($('#gh-owner') as HTMLInputElement).value = REPO.owner;
  ($('#gh-repo') as HTMLInputElement).value = REPO.name;
  ($('#gh-branch') as HTMLInputElement).value = REPO.branch;

  $('#btn-connect')!.addEventListener('click', async () => {
    const c: Conn = {
      token: ($('#gh-token') as HTMLInputElement).value.trim(),
      owner: ($('#gh-owner') as HTMLInputElement).value.trim(),
      repo: ($('#gh-repo') as HTMLInputElement).value.trim(),
      branch: ($('#gh-branch') as HTMLInputElement).value.trim() || 'main',
    };
    if (!c.token || !c.owner || !c.repo) {
      setMsg('#auth-msg', 'Token, owner and repo are all required.', 'err');
      return;
    }
    setMsg('#auth-msg', 'Connecting…');
    try {
      await connect(c);
      setMsg('#auth-msg', '');
      showEditor();
    } catch (e: any) {
      setMsg('#auth-msg', e.message, 'err');
    }
  });

  $('#btn-disconnect')!.addEventListener('click', disconnect);

  document.querySelectorAll('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => switchTab((b as HTMLElement).dataset.tab as any))
  );

  $('#btn-save-staff')!.addEventListener('click', saveStaff);
  $('#btn-add-staff')!.addEventListener('click', () =>
    $('#staff-list')!.append(staffRow({ role: 'New Role', accent: 'gray', members: [] }))
  );
  $('#btn-save-rules')!.addEventListener('click', saveRules);
  $('#btn-add-rule')!.addEventListener('click', () =>
    $('#rules-list')!.append(ruleRow({ title: '', note: '' }))
  );
  $('#btn-save-post')!.addEventListener('click', savePost);
  $('#btn-new-post')!.addEventListener('click', newPost);

  // Auto-reconnect if we have a stored token.
  const saved = loadConn();
  if (saved) {
    connect(saved)
      .then(() => showEditor())
      .catch(() => showAuth());
  } else {
    showAuth();
  }
}
