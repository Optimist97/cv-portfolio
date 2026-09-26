// Données entièrement fictives, adaptées à un profil numérique en Belgique.
export const defaultData = {
  general: {
    name: 'Camille De Smet',
    title: 'Product designer · UX/UI & accessibilité',
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=480&h=560&fit=crop&crop=faces',
    showPhoto: true,
    favicon: './favicon.svg',
    year: new Date().getFullYear()
  },
  contact: {
    email: 'noor.desmet@example.com',
    phone: '+32 470 12 34 56',
    showPhone: true,
    linkedin: 'https://www.linkedin.com/in/noor-desmet-demo/',
    showLinkedin: true,
    portfolio: 'https://noordesmet.example.com',
    showPortfolio: true
  },
  profile: {
    summary: 'Product designer basée à Bruxelles, j’aide les équipes produit à transformer des besoins complexes en parcours numériques clairs, inclusifs et agréables à utiliser. De la recherche utilisateur au prototypage, je travaille en étroite collaboration avec le développement et les parties prenantes.'
  },
  maintenance: { enabled: false, message: 'Ce site est en maintenance. Revenez bientôt !' },
  experiences: [
    { id: 1, title: 'Product designer', company: 'Studio Horizon (fictif)', location: 'Bruxelles', period: '2022 — aujourd’hui', description: 'Recherche utilisateur, conception de parcours et prototypage pour des services numériques. Co-création avec les équipes produit et développement ; amélioration continue de la bibliothèque de composants et de l’accessibilité.', technologies: ['Figma', 'Design system', 'WCAG'] },
    { id: 2, title: 'UX/UI designer', company: 'Atelier Pixel (fictif)', location: 'Namur', period: '2020 — 2022', description: 'Conception de sites et d’outils métier pour des organisations locales. Animation d’ateliers, tests utilisateurs et livraison de maquettes documentées aux équipes techniques.', technologies: ['Recherche UX', 'Prototypage', 'Agile'] }
  ],
  educations: [
    { id: 3, degree: 'Bachelier en communication visuelle', school: 'École supérieure des arts Saint-Luc Bruxelles', location: 'Bruxelles', period: '2016 — 2019', description: 'Orientation design d’interaction et médias numériques.' }
  ],
  skills: [
    { category: 'Design produit', items: ['Recherche utilisateur', 'UX/UI', 'Prototypage', 'Figma'] },
    { category: 'Collaboration', items: ['Design system', 'Accessibilité WCAG', 'Ateliers', 'Agile'] }
  ],
  projects: [
    { title: 'Parcours citoyen (projet fictif)', description: 'Refonte d’un parcours de prise de rendez-vous : simplification des étapes, langage clair et expérience adaptée au mobile.', link: '', technologies: ['UX research', 'Figma', 'Accessibilité'] }
  ],
  languages: [
    { language: 'Français', level: 'Langue maternelle' },
    { language: 'Néerlandais', level: 'Professionnel · B2' },
    { language: 'Anglais', level: 'Professionnel · C1' }
  ]
};

// Le bouton « Charger l’exemple » recharge ce profil belge fictif.
export const demoData = defaultData;
