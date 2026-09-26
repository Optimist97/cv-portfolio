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
  assert.match(html, /id="printCv"/);
  assert.match(html, /@page\{size:A4/);
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
  assert.match(data.contact.phone, /^\+32/);
  assert.equal(typeof data.contact.showPhone, 'boolean');
  assert.equal(typeof data.contact.showLinkedin, 'boolean');
  assert.equal(typeof data.contact.showPortfolio, 'boolean');
  assert.ok(data.languages.some(language => language.language === 'Néerlandais'));
  assert.ok(data.maintenance.message);
});

test('online CMS starts on a dedicated GitHub login screen, never pre-fills a token, and is not linked from the CV', async () => {
  const editor = await readFile('src/cms.html', 'utf8');
  const editorLogic = await readFile('src/pages/editor/app.js', 'utf8');
  const frontendLogic = await readFile('src/resume.js', 'utf8');
  const publicPage = await readFile('dist/index.html', 'utf8');
  assert.match(editor, /id="loginView"/);
  assert.match(editor, /id="editorApp" hidden/);
  assert.match(editor, /id="githubToken"/);
  assert.doesNotMatch(editor, /id="githubToken"[^>]*value=/);
  assert.match(editor, /name="robots" content="noindex, nofollow"/);
  assert.match(editor, /id="contactShowPhone"/);
  assert.match(editor, /id="contactShowLinkedin"/);
  assert.match(editor, /id="contactShowPortfolio"/);
  assert.match(editor, /id="hrAuditToggle" role="switch"/);
  assert.match(editor, /id="hrAuditComments"/);
  assert.match(editor, /Conseils RH · privés au CMS/);
  assert.match(editor, /Montrer les résultats/);
  assert.match(editorLogic, /cv-hr-audit-visible/);
  assert.match(editor, /id="maintenanceEnabled"/);
  assert.match(editor, /ne s’affiche que sur le site public/);
  assert.doesNotMatch(editor, /maintenanceScreen|maintenance-screen/);
  assert.doesNotMatch(editorLogic, /maintenanceScreen/);
  assert.match(frontendLogic, /if \(data\.maintenance\?\.enabled\)/);
  assert.match(frontendLogic, /show\('maintenance', true\)/);
  assert.doesNotMatch(publicPage, /cms\.html|githubToken|Connexion à votre CV/);
  assert.doesNotMatch(publicPage, /Conseils RH|hrAuditToggle|cv-hr-audit-visible/);
});

test('imported profile photos are converted to WebP and cleaned up in public assets', async () => {
  const editor = await readFile('src/pages/editor/app.js', 'utf8');
  const cms = await readFile('src/cms.html', 'utf8');
  assert.match(editor, /async convertProfilePhoto\(file\)/);
  assert.match(editor, /createImageBitmap\(file\)/);
  assert.match(editor, /canvas\.toBlob\(resolve, 'image\/webp', quality\)/);
  assert.match(editor, /file\.size > 15_000_000/);
  assert.match(editor, /async publishProfilePhoto\(headers\)/);
  assert.match(editor, /public\/assets\/\$\{filename\}/);
  assert.match(editor, /async cleanupUnusedPhotos\(headers, profilePhoto\)/);
  assert.match(editor, /method: 'DELETE'/);
  assert.match(editor, /\^profile-\[a-f0-9\]\{16\}\\\.webp\$/);
  assert.match(cms, /public\/assets\//);
  assert.match(cms, /nettoyés/);
  assert.equal(JSON.parse(await readFile('dist/cv-data.json', 'utf8')).general.profilePhoto, 'https://images.unsplash.com/photo-1589154831836-71fa41c229ce?w=480&h=560&fit=crop&crop=faces');
});
