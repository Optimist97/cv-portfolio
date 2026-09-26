import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('production build publishes the CV, editable login page, and data', async () => {
  const files = await readdir('dist');
  assert.ok(files.includes('index.html'));
  assert.ok(files.includes('cms.html'));
  assert.ok(files.includes('cv-data.json'));
  const html = await readFile('dist/index.html', 'utf8');
  assert.match(html, /Curriculum vitæ/);
  assert.doesNotMatch(html, /githubToken|Connexion à votre CV/);
  const cms = await readFile('dist/cms.html', 'utf8');
  assert.match(cms, /Connexion à votre CV/);
  assert.match(cms, /id="editorApp" hidden/);
  assert.match(cms, /id="githubToken"/);
  assert.doesNotMatch(cms, /id="githubToken"[^>]*value=/);
});

test('published example data has editable CV sections and maintenance settings', async () => {
  const data = JSON.parse(await readFile('dist/cv-data.json', 'utf8'));
  assert.ok(data.general.name);
  assert.ok(data.experiences.length);
  assert.ok(data.educations.length);
  assert.ok(data.skills.length);
  assert.ok(data.projects.length);
  assert.ok(data.languages.length);
  assert.equal(typeof data.general.showPhoto, 'boolean');
  assert.equal(typeof data.maintenance.enabled, 'boolean');
  assert.match(data.general.name, /De Smet/);
  assert.match(data.contact.phone, /^\+32/);
  assert.equal(typeof data.contact.showPhone, 'boolean');
  assert.equal(typeof data.contact.showLinkedin, 'boolean');
  assert.equal(typeof data.contact.showPortfolio, 'boolean');
  assert.ok(data.languages.some(language => language.language === 'Néerlandais'));
  assert.ok(data.maintenance.message);
});

test('online CMS starts on a dedicated GitHub login screen, never pre-fills a token, and is not linked from the CV', async () => {
  const editor = await readFile('src/cms.html', 'utf8');
  const publicPage = await readFile('dist/index.html', 'utf8');
  assert.match(editor, /id="loginView"/);
  assert.match(editor, /id="editorApp" hidden/);
  assert.match(editor, /id="githubToken"/);
  assert.doesNotMatch(editor, /id="githubToken"[^>]*value=/);
  assert.match(editor, /name="robots" content="noindex, nofollow"/);
  assert.match(editor, /id="contactShowPhone"/);
  assert.match(editor, /id="contactShowLinkedin"/);
  assert.match(editor, /id="contactShowPortfolio"/);
  assert.doesNotMatch(publicPage, /cms\.html|githubToken|Connexion à votre CV/);
});
