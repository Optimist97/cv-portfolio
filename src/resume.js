const $ = (id) => document.getElementById(id);
const escape = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const show = (id, visible) => { $(id).hidden = !visible; };
const safeUrl = (value = '') => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? escape(url.href) : ''; } catch { return ''; } };

async function main() {
try {
  const response = await fetch('./cv-data.json');
  if (!response.ok) throw new Error('CV indisponible');
  const data = await response.json();
  if (data.maintenance?.enabled) {
    $('maintenanceText').textContent = data.maintenance.message || 'Ce site est en maintenance.';
    show('maintenance', true);
  } else {
    const general = data.general || {};
    document.title = `${general.name || 'CV'} — Curriculum vitæ`;
    $('year').textContent = general.year || new Date().getFullYear();
    const parts = (general.name || 'Votre Nom').trim().split(/\s+/);
    $('firstName').textContent = parts.slice(0, -1).join(' ') || parts[0];
    $('lastName').textContent = parts.length > 1 ? parts.at(-1) : '';
    $('eyebrow').textContent = `Curriculum vitæ · ${general.year || new Date().getFullYear()}`;
    $('role').textContent = general.title || data.profile?.headline || '';
    $('summary').textContent = data.profile?.summary || '';
    const portrait = $('portrait');
    portrait.src = general.profilePhoto || '';
    portrait.alt = `Portrait de ${general.name || ''}`;
    show('portrait', Boolean(general.profilePhoto && general.showPhoto !== false));
    const contact = data.contact || {};
    $('contacts').innerHTML = [contact.email && `<a href="mailto:${escape(contact.email)}">${escape(contact.email)}</a>`, contact.phone && `<a href="tel:${escape(contact.phone.replace(/[^+\d]/g, ''))}">${escape(contact.phone)}</a>`, safeUrl(contact.linkedin) && `<a target="_blank" rel="noopener noreferrer" href="${safeUrl(contact.linkedin)}">LinkedIn</a>`, safeUrl(contact.portfolio) && `<a target="_blank" rel="noopener noreferrer" href="${safeUrl(contact.portfolio)}">Portfolio</a>`].filter(Boolean).join('');
    const entries = (list, first, second) => (list || []).filter(item => item[first] || item[second]).map(item => `<article class="entry"><div class="entry-top"><h3>${escape(item[first])}</h3><span class="period">${escape(item.period)}</span></div><div class="meta">${escape(item[second])}${item.location ? ` · ${escape(item.location)}` : ''}</div>${item.description ? `<p>${escape(item.description)}</p>` : ''}</article>`).join('');
    $('experiences').innerHTML = entries(data.experiences, 'title', 'company');
    $('education').innerHTML = entries(data.educations, 'degree', 'school');
    $('skills').innerHTML = (data.skills || []).filter(s => s.items?.length).map(s => `<div class="skill-group"><h3>${escape(s.category)}</h3><div class="tags">${s.items.map(item => `<span class="tag">${escape(item)}</span>`).join('')}</div></div>`).join('');
    $('projects').innerHTML = (data.projects || []).filter(p => p.title || p.description).map(p => `<article class="project"><h3>${escape(p.title)}</h3><p>${escape(p.description)}</p>${safeUrl(p.link) ? `<a target="_blank" rel="noopener noreferrer" href="${safeUrl(p.link)}">Découvrir le projet ↗</a>` : ''}</article>`).join('');
    $('languages').innerHTML = (data.languages || []).filter(l => l.language).map(l => `<div class="language"><span>${escape(l.language)}</span><span>${escape(l.level)}</span></div>`).join('');
    $('footerName').textContent = general.name || 'CV';
    [['intro', data.profile?.summary], ['experienceSection', data.experiences?.length], ['educationSection', data.educations?.length], ['skillsSection', data.skills?.some(s => s.items?.length)], ['projectsSection', data.projects?.some(p => p.title || p.description)], ['languagesSection', data.languages?.some(l => l.language)]].forEach(([id, value]) => show(id, Boolean(value)));
    show('resume', true);
  }
} catch (error) {
  document.body.innerHTML = '<main style="max-width:620px;margin:15vh auto;padding:24px;font:18px/1.6 system-ui;color:#252722"><h1 style="font-family:Georgia,serif">CV temporairement indisponible</h1><p>Réessayez dans quelques instants.</p></main>';
  console.error(error);
}
}
main();
