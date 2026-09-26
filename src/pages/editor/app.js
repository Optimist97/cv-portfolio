import { demoData, defaultData } from './data.js';

const clone = (value) => JSON.parse(JSON.stringify(value));
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const safeExternalUrl = (value = '') => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escapeHtml(url.href) : ''; } catch { return ''; } };

class App {
  constructor() {
    this.data = this.readData();
    this.storageKey = 'cv-data';
    this.githubToken = null;
    this.githubUser = null;
    this.remoteRepo = null;
    this.init();
  }

  readData() {
    try {
      const saved = JSON.parse(localStorage.getItem('cv-data'));
      if (!saved || typeof saved !== 'object') return clone(defaultData);
      return { ...clone(defaultData), ...saved, general: { ...defaultData.general, ...saved.general }, contact: { ...defaultData.contact, ...saved.contact }, profile: { ...defaultData.profile, ...saved.profile }, maintenance: { ...defaultData.maintenance, ...saved.maintenance }, experiences: saved.experiences || [], educations: saved.educations || [], skills: saved.skills || [], projects: saved.projects || [], languages: saved.languages || [] };
    } catch { return clone(defaultData); }
  }

  init() {
    this.bindEvents();
    this.renderAll();
    const auditToggle = document.getElementById('hrAuditToggle');
    if (auditToggle) {
      let visible = true;
      try { visible = localStorage.getItem('cv-hr-audit-visible') !== 'false'; } catch { /* storage may be disabled */ }
      auditToggle.checked = visible;
      document.getElementById('hrAuditComments').hidden = !visible;
    }
    this.updateStatus('Enregistré');
    const localBootstrap = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    document.querySelector('[data-action="bootstrapGitHub"]').hidden = !localBootstrap;
  }

  bindEvents() {
    // Bind all input fields to update real-time preview
    const inputs = document.querySelectorAll('input:not(#githubToken):not(#hrAuditToggle), textarea, select');

    inputs.forEach(input => {
      input.addEventListener('input', (e) => this.handleInputChange(e));
    });

    // Save on form submit (Ctrl+S)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveData();
      }
    });

    // Bind specific sections to their inputs
    document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => this[button.dataset.action]()));
    document.getElementById('hrAuditToggle').addEventListener('change', event => {
      const visible = event.target.checked;
      document.getElementById('hrAuditComments').hidden = !visible;
      try { localStorage.setItem('cv-hr-audit-visible', String(visible)); } catch { /* the toggle still works for this session */ }
    });
    document.getElementById('githubToken').addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); this.connectGitHub(); }
    });
    document.getElementById('importFile').addEventListener('change', (event) => this.importJSON(event));
    document.getElementById('photoFile').addEventListener('change', event => this.readPhoto(event));
    document.querySelectorAll('.preview-section').forEach(section => { section.dataset.initialDisplay = getComputedStyle(section).display; });
    window.addEventListener('pagehide', () => this.disconnectGitHub());
  }

  async connectGitHub() {
    const input = document.getElementById('githubToken');
    const token = input.value.trim();
    if (!token) return this.setGitHubStatus('Colle ton jeton finement limité.');
    if (!token.startsWith('github_pat_')) { input.value = ''; return this.setGitHubStatus('Utilise un jeton finement limité GitHub, qui commence par github_pat_.'); }
    this.setGitHubStatus('Vérification du jeton…');
    try {
      const response = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
      if (!response.ok) throw new Error(response.status === 401 ? 'Jeton invalide ou expiré.' : `GitHub a répondu ${response.status}.`);
      const user = await response.json();
      if (user.login?.toLowerCase() !== 'optimist97') throw new Error('Ce jeton doit appartenir au compte Optimist97.');
      const repo = await fetch('https://api.github.com/repos/Optimist97/cv-portfolio', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
      if (!repo.ok) throw new Error('Le dépôt cv-portfolio est absent ou ce jeton n’y a pas accès.');
      this.githubToken = token;
      this.githubUser = user.login;
      this.remoteRepo = await repo.json();
      input.value = '';
      this.renderPreview();
      document.querySelector('[data-action="publishGitHub"]').disabled = false;
      document.querySelector('[data-action="bootstrapGitHub"]').disabled = false;
      document.querySelector('[data-action="disconnectGitHub"]').disabled = false;
      document.getElementById('loginView').hidden = true;
      document.getElementById('editorApp').hidden = false;
      this.setGitHubStatus(`Connecté à GitHub en tant que ${user.login}.`);
    } catch (error) {
      this.githubToken = null; this.githubUser = null; this.remoteRepo = null;
      input.value = '';
      this.setGitHubStatus(error.message);
    }
  }

  disconnectGitHub() {
    this.githubToken = null; this.githubUser = null;
    document.querySelector('[data-action="publishGitHub"]').disabled = true;
    document.querySelector('[data-action="bootstrapGitHub"]').disabled = true;
    document.querySelector('[data-action="disconnectGitHub"]').disabled = true;
    document.getElementById('githubToken').value = '';
    document.getElementById('editorApp').hidden = true;
    document.getElementById('loginView').hidden = false;
    this.renderPreview();
    this.setGitHubStatus('Déconnecté. Le jeton a été retiré de la mémoire de cette page.');
  }

  async publishGitHub() {
    if (!this.githubToken) return this.setGitHubStatus('Connecte-toi avant de publier.');
    const button = document.querySelector('[data-action="publishGitHub"]');
    button.disabled = true; this.setGitHubStatus('Préparation de la publication…');
    const endpoint = 'https://api.github.com/repos/Optimist97/cv-portfolio/contents/public/cv-data.json';
    const headers = { Authorization: `Bearer ${this.githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    try {
      const publishedData = clone(this.data);
      publishedData.general.profilePhoto = await this.publishProfilePhoto(headers);
      const existing = await fetch(endpoint, { headers });
      let sha;
      if (existing.ok) sha = (await existing.json()).sha;
      else if (existing.status !== 404) throw new Error(`Lecture du dépôt impossible (${existing.status}).`);
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(publishedData, null, 2) + '\n')));
      const response = await fetch(endpoint, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Mettre à jour le CV depuis le mini-CMS', content, ...(sha ? { sha } : {}), branch: 'main' }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.message || `Publication refusée (${response.status}). Vérifie les droits Contents et la branche main.`); }
      try {
        const removedPhotos = await this.cleanupUnusedPhotos(headers, publishedData.general.profilePhoto);
        this.setGitHubStatus(`Publié sur GitHub ✓${removedPhotos ? ` ${removedPhotos} ancienne${removedPhotos > 1 ? 's' : ''} photo${removedPhotos > 1 ? 's' : ''} supprimée${removedPhotos > 1 ? 's' : ''}.` : ''} Le déploiement Pages va démarrer.`);
      } catch (error) {
        this.setGitHubStatus(`CV publié, mais le nettoyage des anciennes photos a échoué : ${error.message}`);
      }
    } catch (error) { this.setGitHubStatus(error.message); }
    finally { button.disabled = !this.githubToken; }
  }

  async publishProfilePhoto(headers) {
    const photo = this.data.general.profilePhoto || '';
    const match = photo.match(/^data:image\/webp;base64,([a-z\d+/]+=*)$/i);
    if (!photo.startsWith('data:')) return photo;
    if (!match) throw new Error('La photo importée doit être convertie en WebP avant publication. Réimporte-la depuis ton ordinateur.');

    const [, base64] = match;
    const binary = atob(base64);
    if (binary.length > 1_500_000) throw new Error('La photo WebP optimisée dépasse 1,5 Mo. Réduis ses dimensions puis réessaie.');
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 16);
    const filename = `profile-${hash}.webp`;
    const path = `public/assets/${filename}`;
    const endpoint = `https://api.github.com/repos/Optimist97/cv-portfolio/contents/${path}`;
    const current = await fetch(`${endpoint}?ref=main`, { headers });
    let sha;
    if (current.ok) sha = (await current.json()).sha;
    else if (current.status !== 404) throw new Error(`Lecture de la photo dans GitHub impossible (${current.status}).`);

    const uploaded = await fetch(endpoint, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ajouter la photo du CV dans assets', content: base64, ...(sha ? { sha } : {}), branch: 'main' })
    });
    if (!uploaded.ok) {
      const result = await uploaded.json();
      throw new Error(result.message || `Publication de la photo refusée (${uploaded.status}).`);
    }
    return `./assets/${filename}`;
  }

  async cleanupUnusedPhotos(headers, profilePhoto) {
    const endpoint = 'https://api.github.com/repos/Optimist97/cv-portfolio/contents/public/assets?ref=main';
    const response = await fetch(endpoint, { headers });
    if (response.status === 404) return 0;
    if (!response.ok) throw new Error(`Lecture du dossier assets impossible (${response.status}).`);
    const files = await response.json();
    if (!Array.isArray(files)) return 0;

    const managedPhotos = files.filter(file => file.type === 'file' && /^profile-[a-f0-9]{16}\.webp$/i.test(file.name));
    const currentPhoto = profilePhoto.match(/^\.\/assets\/(profile-[a-f0-9]{16}\.webp)$/i)?.[1];
    let removed = 0;
    for (const file of managedPhotos) {
      if (file.name === currentPhoto) continue;
      const fileEndpoint = `https://api.github.com/repos/Optimist97/cv-portfolio/contents/public/assets/${encodeURIComponent(file.name)}`;
      const deletion = await fetch(fileEndpoint, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Supprimer une ancienne photo inutilisée du CV', sha: file.sha, branch: 'main' })
      });
      if (!deletion.ok) {
        const result = await deletion.json();
        throw new Error(result.message || `Suppression de ${file.name} refusée (${deletion.status}).`);
      }
      removed++;
    }
    return removed;
  }

  async bootstrapGitHub() {
    if (!this.githubToken) return this.setGitHubStatus('Connecte-toi avant d’installer le site.');
    if (!confirm('Cette action va envoyer le code du CV et du mini-CMS dans le dépôt public Optimist97/cv-portfolio. Les données du profil exemple seront publiques. Continuer ?')) return;
    const button = document.querySelector('[data-action="bootstrapGitHub"]'); button.disabled = true;
    const headers = { Authorization: `Bearer ${this.githubToken}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    try {
      for (const path of this.remoteRepoFiles()) {
        const source = await fetch(`/__source/${path}`);
        if (!source.ok) throw new Error(`Fichier local introuvable : ${path}`);
        const bytes = path === 'public/cv-data.json'
          ? new TextEncoder().encode(JSON.stringify(this.data, null, 2) + '\n')
          : new Uint8Array(await source.arrayBuffer());
        let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
        const endpoint = `https://api.github.com/repos/Optimist97/cv-portfolio/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
        const current = await fetch(endpoint, { headers });
        let sha;
        if (current.ok) { const currentFile = await current.json(); sha = currentFile.sha; if (path !== 'public/cv-data.json') continue; }
        else if (current.status !== 404) throw new Error(`Lecture de ${path} refusée (${current.status}).`);
        const uploaded = await fetch(endpoint, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `${sha ? 'Mettre à jour' : 'Ajouter'} ${path}`, content: btoa(binary), ...(sha ? { sha } : {}), ...(this.remoteRepo?.default_branch ? { branch: this.remoteRepo.default_branch } : {}) }) });
        if (!uploaded.ok) { const result = await uploaded.json(); throw new Error(result.message || `Échec sur ${path} (${uploaded.status}).`); }
        this.setGitHubStatus(`Installation du site… ${path}`);
      }
      this.setGitHubStatus('Code installé ✓ Vérifie le workflow Pages dans GitHub.');
    } catch (error) { this.setGitHubStatus(`Installation interrompue : ${error.message}`); }
    finally { button.disabled = !this.githubToken; }
  }

  remoteRepoFiles() {
    return ['.gitignore', 'README.md', 'package.json', 'package-lock.json', 'public/cv-data.json', 'public/favicon.svg', 'src/index.html', 'src/resume.js', 'src/pages/editor/data.js', 'src/pages/editor/app.js', 'src/cms.html', '.github/workflows/pages.yml'];
  }

  setGitHubStatus(message) {
    for (const id of ['loginStatus', 'githubStatus']) {
      const status = document.getElementById(id);
      if (status) status.textContent = message;
    }
  }

  getIdName(id) {
    const map = {
      'contactEmail': 'email',
      'contactPhone': 'phone',
      'contactLinkedin': 'linkedin',
      'contactPortfolio': 'portfolio'
    };
    return map[id];
  }

  handleInputChange(e) {
    if (e.target.classList.contains('skill-input') || e.target.classList.contains('project-input')) {
      return; // Handled separately
    }

    const id = e.target.id;
    if (id === 'generalName') this.data.general.name = e.target.value;
    else if (id === 'generalTitle') this.data.general.title = e.target.value;
    else if (id === 'generalProfilePhoto') this.data.general.profilePhoto = e.target.value;
    else if (id === 'generalFavicon') this.data.general.favicon = e.target.value;
    else if (id === 'generalYear') this.data.general.year = Number(e.target.value) || new Date().getFullYear();
    else if (id === 'generalShowPhoto') this.data.general.showPhoto = e.target.checked;
    else if (id.startsWith('contact')) this.data.contact[this.getIdName(id)] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    else if (id === 'profileSummary') this.data.profile.summary = e.target.value;
    else if (id === 'maintenanceEnabled') this.data.maintenance.enabled = e.target.checked;
    else if (id === 'maintenanceMessage') this.data.maintenance.message = e.target.value;
    this.renderPreview();
    this.scheduleSave();
  }

  scheduleSave() { clearTimeout(this.saveTimer); this.saveTimer = setTimeout(() => this.saveData(), 500); }

  readPhoto(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1_000_000) { this.updateStatus('Choisissez une image de 1 Mo maximum'); event.target.value = ''; return; }
    const reader = new FileReader(); reader.onload = () => { this.data.general.profilePhoto = reader.result; this.syncInputs(); this.renderPreview(); this.saveData(); };
    reader.readAsDataURL(file);
  }

  renderPreview() {
    const g = this.data.general;
    document.getElementById('previewName').textContent = g.name || 'Votre Nom';
    document.getElementById('previewTitle').textContent = g.title || 'Votre Titre';
    document.getElementById('previewPhoto').src = g.profilePhoto || './placeholder.jpg';
    document.getElementById('previewPhoto').hidden = !g.profilePhoto || !g.showPhoto;
    document.getElementById('previewProfile').textContent = this.data.profile.summary || '';
    document.getElementById('previewYear').textContent = g.year || new Date().getFullYear();
    this.renderContactLinks();
    const renderItems = (items, fields) => items.filter(item => fields.some(key => item[key])).map(item => `<div class="timeline-item-preview"><div class="item-header"><div><div class="item-title-preview">${escapeHtml(item[fields[0]])}</div><div class="item-subtitle-preview">${escapeHtml(item[fields[1]])}${item.location ? ` · ${escapeHtml(item.location)}` : ''}</div></div><div class="item-period">${escapeHtml(item.period)}</div></div>${item.description ? `<p>${escapeHtml(item.description).replace(/\n/g, '<br>')}</p>` : ''}</div>`).join('');
    document.getElementById('previewExperience').innerHTML = renderItems(this.data.experiences, ['title', 'company']);
    document.getElementById('previewEducation').innerHTML = renderItems(this.data.educations, ['degree', 'school']);
    document.getElementById('previewSkills').innerHTML = this.data.skills.map(s => `<div class="skill-category"><h3>${escapeHtml(s.category)}</h3><div class="skills-list">${s.items.map(i => `<span class="skill-tag">${escapeHtml(i)}</span>`).join('')}</div></div>`).join('');
    document.getElementById('previewProjects').innerHTML = this.data.projects.filter(p => p.title || p.description).map(p => `<div class="project-card"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>${safeExternalUrl(p.link) ? `<a href="${safeExternalUrl(p.link)}" target="_blank" rel="noopener noreferrer">Voir le projet ↗</a>` : ''}</div>`).join('');
    document.getElementById('previewLanguages').innerHTML = this.data.languages.map(l => `<span class="skill-tag">${escapeHtml(l.language)}${l.level ? ` · ${escapeHtml(l.level)}` : ''}</span>`).join('');
    const maintenance = document.getElementById('maintenanceScreen');
    maintenance.hidden = !this.githubToken || !this.data.maintenance?.enabled;
    maintenance.textContent = this.data.maintenance?.message || 'Ce site est en maintenance.';
    document.querySelectorAll('.preview-section').forEach(section => {
      const content = section.querySelector(':scope > p')?.textContent.trim() || section.querySelector(':scope > div')?.innerHTML.trim();
      section.hidden = !content;
    });
  }

  // Section render methods for dynamic content
  renderExperienceControls() {
    const container = document.getElementById('experienceControlsList');
    container.innerHTML = this.data.experiences.map((exp, index) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${index + 1}. ${escapeHtml(exp.title || '(Titre)')}</span>
          <button onclick="app.removeExperience(${index})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
        <div class="form-group">
          <label>Titre du poste *</label>
          <input type="text" value="${escapeHtml(exp.title || '')}" onchange="app.updateExperience(${index}, 'title', this.value)" class="form-control">
        </div>
        <div class="form-group">
          <label>Entreprise *</label>
          <input type="text" value="${escapeHtml(exp.company || '')}" onchange="app.updateExperience(${index}, 'company', this.value)" class="form-control">
        </div>
        <div class="form-group" style="display: flex; gap: 0.5rem;">
          <input type="text" placeholder="Ville, Pays" value="${escapeHtml(exp.location || '')}" onchange="app.updateExperience(${index}, 'location', this.value)" style="flex:1;" class="form-control">
          <input type="text" placeholder="2020 - Présent" value="${escapeHtml(exp.period || '')}" onchange="app.updateExperience(${index}, 'period', this.value)" class="form-control">
        </div>
        <div class="form-group">
          <label>Description (plusieurs lignes)</label>
          <textarea rows="3" onchange="app.updateExperience(${index}, 'description', this.value)">${escapeHtml(exp.description || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Technologies (séparées par des virgules)</label>
          <input type="text" value="${escapeHtml((exp.technologies || []).join(', '))}" onchange="app.updateExperience(${index}, 'technologies', this.value.split(', ').filter(Boolean))" class="form-control">
        </div>
      </div>
    `).join('');
  }

  renderEducationControls() {
    const container = document.getElementById('educationControlsList');
    container.innerHTML = this.data.educations.map((edu, index) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${index + 1}. ${escapeHtml(edu.degree || '(Diplôme)')}</span>
          <button onclick="app.removeEducation(${index})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
        <div class="form-group">
          <label>Diplôme *</label>
          <input type="text" value="${escapeHtml(edu.degree || '')}" onchange="app.updateEducation(${index}, 'degree', this.value)" class="form-control">
        </div>
        <div class="form-group">
          <label>École / Université *</label>
          <input type="text" value="${escapeHtml(edu.school || '')}" onchange="app.updateEducation(${index}, 'school', this.value)" class="form-control">
        </div>
        <div class="form-group" style="display: flex; gap: 0.5rem;">
          <input type="text" placeholder="Ville, Pays" value="${escapeHtml(edu.location || '')}" onchange="app.updateEducation(${index}, 'location', this.value)" style="flex:1;" class="form-control">
          <input type="text" placeholder="2015 - 2017" value="${escapeHtml(edu.period || '')}" onchange="app.updateEducation(${index}, 'period', this.value)" class="form-control">
        </div>
        <div class="form-group">
          <label>Description (optionnel)</label>
          <input type="text" value="${escapeHtml(edu.description || '')}" onchange="app.updateEducation(${index}, 'description', this.value)" class="form-control">
        </div>
      </div>
    `).join('');
  }

  renderSkillsControls() {
    const container = document.getElementById('skillsList');
    
    if (this.data.skills.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucune compétence ajoutée</div>';
      return;
    }

    container.innerHTML = this.data.skills.map((skill, index) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${escapeHtml(skill.category)}: ${escapeHtml(skill.items.join(', '))}</span>
          <button onclick="app.removeSkill(${index})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
        <div class="form-group"><label>Catégorie</label><input type="text" value="${escapeHtml(skill.category)}" onchange="app.updateSkill(${index}, 'category', this.value)"></div>
        <div class="form-group"><label>Compétences</label><input type="text" value="${escapeHtml(skill.items.join(', '))}" onchange="app.updateSkill(${index}, 'items', this.value)"></div>
      </div>
    `).join('');
  }

  renderProjectsControls() {
    const container = document.getElementById('projectsList');
    
    if (this.data.projects.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun projet ajouté</div>';
      return;
    }

    container.innerHTML = this.data.projects.map((proj, index) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${index + 1}. ${escapeHtml(proj.title || '(Titre)')}</span>
          <button onclick="app.removeProject(${index})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
        <div class="form-group">
          <label>Titre du projet *</label>
          <input type="text" value="${escapeHtml(proj.title || '')}" onchange="app.updateProject(${index}, 'title', this.value)" class="project-input form-control">
        </div>
        <div class="form-group">
          <label>Description *</label>
          <textarea rows="2" onchange="app.updateProject(${index}, 'description', this.value)">${escapeHtml(proj.description || '')}</textarea>
        </div>
        <div class="form-group">
          <input type="text" placeholder="https://..." value="${escapeHtml(proj.link || '')}" onchange="app.updateProject(${index}, 'link', this.value)" class="project-input form-control" style="font-family: monospace;">
        </div>
        <div class="form-group">
          <label>Technologies (séparées par des virgules)</label>
          <input type="text" value="${escapeHtml((proj.technologies || []).join(', '))}" onchange="app.updateProject(${index}, 'technologies', this.value.split(',').map(item => item.trim()).filter(Boolean))" class="project-input form-control">
        </div>
        <div class="form-group"><label>Année / période</label><input type="text" value="${escapeHtml(proj.date || '')}" onchange="app.updateProject(${index}, 'date', this.value)" class="project-input form-control">
        </div>
      </div>
    `).join('');
  }

  renderLanguagesControls() {
    const container = document.getElementById('languagesList');
    
    if (this.data.languages.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucune langue ajoutée</div>';
      return;
    }

    container.innerHTML = this.data.languages.map((lang, index) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${index + 1}. ${escapeHtml(lang.language)}</span>
          <button onclick="app.removeLanguage(${index})" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
        <div class="form-group">
          <label>Langue</label>
          <input type="text" value="${escapeHtml(lang.language)}" onchange="app.updateLanguage(${index}, 'language', this.value)">
        </div>
        <div class="form-group"><label>Niveau</label><input type="text" value="${escapeHtml(lang.level || '')}" onchange="app.updateLanguage(${index}, 'level', this.value)" placeholder="Natif, B2…">
        </div>
      </div>
    `).join('');
  }

  // CRUD Operations
  addExperience() {
    this.data.experiences.push({
      id: Date.now(),
      title: '',
      company: '',
      location: '',
      period: '',
      description: '',
      technologies: []
    });
    this.renderExperienceControls(); this.renderPreview();
    this.saveData();
  }

  removeExperience(index) {
    if (confirm('Voulez-vous vraiment supprimer cette expérience ?')) {
      this.data.experiences.splice(index, 1);
      this.renderExperienceControls(); this.renderPreview();
      this.saveData();
    }
  }

  updateExperience(index, field, value) {
    const exp = this.data.experiences[index];
    
    if (field === 'technologies') {
      exp[field] = typeof value === 'string' ? value.split(', ').filter(Boolean) : value;
    } else if (field === 'description') {
      exp[field] = value;
    } else {
      exp[field] = value;
    }

    this.renderExperienceControls(); this.renderPreview(); this.scheduleSave();
  }

  addEducation() {
    this.data.educations.push({
      id: Date.now(),
      degree: '',
      school: '',
      location: '',
      period: '',
      description: ''
    });
    this.renderEducationControls(); this.renderPreview();
    this.saveData();
  }

  removeEducation(index) {
    if (confirm('Voulez-vous vraiment supprimer cette formation ?')) {
      this.data.educations.splice(index, 1);
      this.renderEducationControls(); this.renderPreview();
      this.saveData();
    }
  }

  updateEducation(index, field, value) {
    const edu = this.data.educations[index];
    
    if (field === 'description') {
      edu[field] = value;
    } else {
      edu[field] = value;
    }

    this.renderEducationControls(); this.renderPreview(); this.scheduleSave();
  }

  addSkill() {
    const category = document.getElementById('skillCategory').value;
    const input = document.getElementById('skillInput');
    
    if (input.value.trim()) {
      this.data.skills.push({
        category,
        items: [input.value.trim()]
      });
      input.value = '';
      this.renderSkillsControls(); this.renderPreview();
      this.saveData();
    }
  }

  removeSkill(index) {
    if (confirm('Voulez-vous vraiment supprimer cette compétence ?')) {
      this.data.skills.splice(index, 1);
      this.renderSkillsControls(); this.renderPreview();
      this.saveData();
    }
  }

  updateSkill(index, field, value) { this.data.skills[index][field] = field === 'items' ? value.split(',').map(item => item.trim()).filter(Boolean) : value; this.renderSkillsControls(); this.renderPreview(); this.scheduleSave(); }

  addProject() {
    this.data.projects.push({
      title: '',
      description: '',
      link: '',
      technologies: []
    });
    this.renderProjectsControls(); this.renderPreview();
    this.saveData();
  }

  removeProject(index) {
    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      this.data.projects.splice(index, 1);
      this.renderProjectsControls(); this.renderPreview();
      this.saveData();
    }
  }

  updateProject(index, field, value) {
    const proj = this.data.projects[index];
    
    if (field === 'technologies') {
      proj[field] = typeof value === 'string' ? value.split(', ').filter(Boolean) : value;
    } else if (field === 'description') {
      proj[field] = value;
    } else {
      proj[field] = value;
    }

    this.renderProjectsControls(); this.renderPreview(); this.scheduleSave();
  }

  addLanguage() {
    const input = document.getElementById('languageInput');
    
    if (input.value.trim()) {
      this.data.languages.push({ language: input.value.trim(), level: document.getElementById('languageLevelInput')?.value.trim() || '' });
      input.value = '';
      document.getElementById('languageLevelInput').value = '';
      this.renderLanguagesControls(); this.renderPreview();
      this.saveData();
    }
  }

  updateLanguage(index, field, value) { this.data.languages[index][field] = value; this.renderLanguagesControls(); this.renderPreview(); this.scheduleSave(); }

  removeLanguage(index) {
    if (confirm('Voulez-vous vraiment supprimer cette langue ?')) {
      this.data.languages.splice(index, 1);
      this.renderLanguagesControls(); this.renderPreview();
      this.saveData();
    }
  }

  // Data Management
  updateSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const temp = section.innerHTML;
      setTimeout(() => {
        section.innerHTML = temp;
      }, 100);
    }
  }

  saveData() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      this.updateStatus('Sauvegardé ✓');
      
      // Update last saved time
      const now = new Date();
      document.getElementById('lastSaved').textContent = 
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
      this.updateStatus('Erreur: Espace stockage local plein');
      console.error(error);
    }
  }

  loadDemoData() {
    if (confirm('Cela remplacera vos données actuelles par un profil fictif. Continuer ?')) {
      this.data = JSON.parse(JSON.stringify(demoData));
    this.renderAll();
      this.saveData();
      this.updateStatus('Données de démo chargées ✓');
    }
  }

  clearData() {
    if (confirm('Attention! Cela effacera toutes vos données. Continuer ?')) {
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.renderAll();
      this.saveData();
      this.updateStatus('Données réinitialisées ✓');
    }
  }

  readPhoto(event) {
    const file = event.target.files?.[0]; if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15_000_000) { this.updateStatus('Choisissez une image JPEG, PNG ou WebP de 15 Mo maximum'); event.target.value = ''; return; }
    this.updateStatus('Conversion de la photo en WebP…');
    this.convertProfilePhoto(file).then(photo => {
      this.data.general.profilePhoto = photo;
      this.syncInputs(); this.renderPreview(); this.saveData();
      this.updateStatus('Photo convertie en WebP et enregistrée ✓');
    }).catch(error => {
      this.updateStatus(`Conversion impossible : ${error.message}`);
    }).finally(() => { event.target.value = ''; });
  }

  async convertProfilePhoto(file) {
    const image = await createImageBitmap(file);
    if (image.width * image.height > 40_000_000) {
      image.close();
      throw new Error('Les dimensions de la photo sont trop élevées. Réduis-la avant de la sélectionner.');
    }
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) { image.close(); throw new Error('Le navigateur ne peut pas préparer cette image.'); }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();

    for (const quality of [0.86, 0.78, 0.70, 0.62]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob || blob.type !== 'image/webp') throw new Error('Ce navigateur ne prend pas en charge la conversion WebP.');
      if (blob.size <= 1_500_000) {
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Lecture de la photo convertie impossible.'));
          reader.readAsDataURL(blob);
        });
      }
    }
    throw new Error('La photo reste trop volumineuse après optimisation. Essaie une image moins grande.');
  }

  exportJSON() {
    const dataStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cv-data.json';
    a.click();
    
    URL.revokeObjectURL(url);
    this.updateStatus('Export JSON ✓');
  }

  async importJSON(event) {
    const file = event.target.files?.[0]; if (!file) return;
    try { const next = JSON.parse(await file.text()); if (!next.general || !next.contact || !Array.isArray(next.experiences)) throw new Error('Fichier CV invalide'); this.data = { ...clone(defaultData), ...next, general: { ...defaultData.general, ...next.general }, contact: { ...defaultData.contact, ...next.contact }, maintenance: { ...defaultData.maintenance, ...next.maintenance }, experiences: next.experiences || [], educations: next.educations || [], skills: next.skills || [], projects: next.projects || [], languages: next.languages || [] }; this.renderAll(); this.saveData(); this.updateStatus('Import terminé ✓'); }
    catch (error) { this.updateStatus(`Import impossible : ${error.message}`); }
    event.target.value = '';
  }

  renderAll() {
    this.syncInputs();
    this.renderExperienceControls(); this.renderEducationControls(); this.renderSkillsControls(); this.renderProjectsControls(); this.renderLanguagesControls();
    this.renderPreview();
  }

  renderContactLinks() {
    const contacts = this.data.contact;
    let html = '';
    
    if (contacts.email) {
      html += `<a href="mailto:${escapeHtml(contacts.email)}">${escapeHtml(contacts.email)}</a>`;
    }
    if (contacts.phone && contacts.showPhone !== false) {
      html += `<a href="tel:${contacts.phone.replace(/\D/g, '')}">${escapeHtml(contacts.phone)}</a>`;
    }
    if (contacts.linkedin && contacts.showLinkedin !== false) {
      if (safeExternalUrl(contacts.linkedin)) html += `<a href="${safeExternalUrl(contacts.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`;
    }
    if (contacts.portfolio && contacts.showPortfolio !== false) {
      if (safeExternalUrl(contacts.portfolio)) html += `<a href="${safeExternalUrl(contacts.portfolio)}" target="_blank" rel="noopener noreferrer">Portfolio ↗</a>`;
    }

    const container = document.getElementById('previewContact');
    if (container) container.innerHTML = html;
  }

  syncInputs() {
    const values = { generalName: this.data.general.name, generalTitle: this.data.general.title, generalProfilePhoto: this.data.general.profilePhoto, generalFavicon: this.data.general.favicon, generalYear: this.data.general.year, generalShowPhoto: this.data.general.showPhoto !== false, contactEmail: this.data.contact.email, contactPhone: this.data.contact.phone, contactShowPhone: this.data.contact.showPhone !== false, contactLinkedin: this.data.contact.linkedin, contactShowLinkedin: this.data.contact.showLinkedin !== false, contactPortfolio: this.data.contact.portfolio, contactShowPortfolio: this.data.contact.showPortfolio !== false, profileSummary: this.data.profile.summary, maintenanceEnabled: this.data.maintenance?.enabled, maintenanceMessage: this.data.maintenance?.message };
    Object.entries(values).forEach(([id, value]) => { const input = document.getElementById(id); if (input) input[input.type === 'checkbox' ? 'checked' : 'value'] = value ?? ''; });
  }

  updateStatus(message) {
    const statusEl = document.getElementById('saveStatus');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.style.color = '#16a34a';
      setTimeout(() => {
        statusEl.style.color = '';
      }, 2000);
    }
  }

  getIdName(id) {
    const map = {
      'generalName': 'name',
      'generalTitle': 'title',
      'generalProfilePhoto': 'profilePhoto',
      'contactEmail': 'email',
      'contactPhone': 'phone',
      'contactShowPhone': 'showPhone',
      'contactLinkedin': 'linkedin',
      'contactShowLinkedin': 'showLinkedin',
      'contactPortfolio': 'portfolio',
      'contactShowPortfolio': 'showPortfolio',
      'generalYear': 'year'
    };
    return map[id];
  }
}

export { App };
