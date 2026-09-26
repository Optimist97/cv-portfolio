// Données fictives réalistes pour un profil de développeur web
export const demoData = {
  // Informations générales
  general: {
    name: 'Marie Dubois',
    title: 'Développeuse Full Stack Senior',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces',
    favicon: '/favicon.svg',
    year: new Date().getFullYear()
  },

  // Contact
  contact: {
    email: 'marie.dubois@email.com',
    phone: '+33 6 12 34 56 78',
    linkedin: 'https://linkedin.com/in/marie-dubois-dev',
    portfolio: 'https://mariedubois.dev'
  },

  // Profil
  profile: {
    summary: `Développeuse Full Stack passionnée avec plus de 8 ans d'expérience dans la création d'applications web modernes et performantes. 
    Spécialisée dans l'écosystème JavaScript (React, Node.js), j'ai mené des projets variés allant de startups à grandes entreprises.
    
    Expertise en architecture technique, développement frontend/Backend, et mentorat d'équipes juniures. J'aime transformer des besoins complexes 
    en solutions élégantes et évolutives.`
  },

  // Expériences professionnelles
  experiences: [
    {
      id: 'exp1',
      title: 'Développeuse Full Stack Senior',
      company: 'TechSolutions Paris',
      location: 'Paris, France (Hybride)',
      period: '2022 - Présent',
      description: `
        • Architecture et développement d'une plateforme SaaS utilisée par 10 000+ clients
        • Leadership technique sur une équipe de 5 développeurs
        • Réduction du temps de chargement de 40% grâce à l'optimisation Frontend
        • Mise en place de CI/CD avec GitHub Actions et Docker
        • Amélioration de la couverture de tests unitaires à 85%
      `,
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker']
    },
    {
      id: 'exp2',
      title: 'Développeuse Full Stack',
      company: 'StartupInnov',
      location: 'Lyon, France',
      period: '2019 - 2022',
      description: `
        • Développement complet de l'application e-commerce principale (React + Express)
        • Intégration de services de paiement Stripe et PayPal
        • Optimisation SEO qui a augmenté le trafic organique de 60%
        • Collaboration étroite avec les équipes produit et design
        • Mentorat de 2 développeurs juniors
      `,
      technologies: ['React', 'Express.js', 'MongoDB', 'Redis', 'AWS']
    },
    {
      id: 'exp3',
      title: 'Développeuse Web Junior',
      company: 'AgenceWeb Digital',
      location: 'Lyon, France (Télétravail)',
      period: '2017 - 2019',
      description: `
        • Développement de sites vitrines et landing pages pour 50+ clients
        • Conversion de maquettes Figma en code HTML/CSS/JS
        • Intégration d'animations et interactions JavaScript
        • Optimisation pour la performance et le SEO
        • Support technique aux clients et formation aux CMS utilisés
      `,
      technologies: ['HTML5', 'CSS3', 'JavaScript', 'jQuery', 'WordPress']
    }
  ],

  // Formation
  educations: [
    {
      id: 'edu1',
      degree: 'Master en Ingénierie Logicielle',
      school: 'École Polytechnique University',
      location: 'Paris, France',
      period: '2016 - 2017',
      description: 'Mention Très Bien. Spécialisation en Architecture Distribuée et Sécurité des Systèmes.'
    },
    {
      id: 'edu2',
      degree: 'Licence Informatique',
      school: 'Université Lyon 1',
      location: 'Lyon, France',
      period: '2013 - 2016',
      description: 'Mention Bien. Projets : Développement d\'une plateforme e-learning et analyse de données.'
    },
    {
      id: 'edu3',
      degree: 'BTS Informatique de Gestion',
      school: 'Lycée Technologique Lyon',
      location: 'Lyon, France',
      period: '2011 - 2013',
      description: 'Spécialité Développement Web et Bases de Données.'
    }
  ],

  // Compétences
  skills: [
    { category: 'Langages de programmation', items: ['JavaScript (ES6+)', 'TypeScript', 'Python', 'SQL', 'HTML5/CSS3'] },
    { category: 'Frameworks & Librairies', items: ['React', 'Next.js', 'Vue.js', 'Node.js', 'Express', 'Redux', 'GraphQL'] },
    { category: 'Bases de données', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase'] },
    { category: 'DevOps & Outils', items: ['Docker', 'Kubernetes', 'AWS', 'GitHub Actions', 'Git', 'Linux', 'Jest', 'Webpack'] },
    { category: 'Compétences transversales', items: ['Leadership technique', 'Mentorat', 'Agile/Scrum', 'Communication', 'Résolution de problèmes'] }
  ],

  // Projets personnels
  projects: [
    {
      title: 'OpenSource UI Kit',
      description: 'Création d\'un kit de composants React open-source utilisé par plus de 5 000 développeurs sur GitHub.',
      link: 'https://github.com/mariedubois/react-uikit',
      technologies: ['React', 'Material-UI', 'Storybook'],
      date: '2023'
    },
    {
      title: 'E-commerce Dashboard',
      description: 'Tableau de bord analytique complet pour boutiques en ligne avec visualisations temps réel.',
      link: 'https://dashboard-demo.vercel.app',
      technologies: ['Next.js', 'TypeScript', 'Chart.js'],
      date: '2022'
    },
    {
      title: 'Task Management App',
      description: 'Application de gestion de tâches collaborative avec temps réel (socket.io).',
      link: 'https://taskmanager.app',
      technologies: ['React', 'Socket.io', 'Express', 'MongoDB'],
      date: '2021'
    }
  ],

  // Langues
  languages: [
    { language: 'Français', level: 'Natif (C2)' },
    { language: 'Anglais', level: 'Avancé (C1)' },
    { language: 'Espagnol', level: 'Intermédiaire (B2)' }
  ]
};

// Données de démarrage par défaut (version simplifiée)
export const defaultData = {
  general: {
    name: 'Clémence Martin',
    title: 'Designer numérique · Développement front-end',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop&crop=faces',
    showPhoto: true,
    favicon: '/favicon.svg',
    year: new Date().getFullYear()
  },
  contact: {
    email: 'clemence@example.com',
    phone: '+33 6 12 34 56 78',
    linkedin: 'https://www.linkedin.com/',
    portfolio: 'https://example.com'
  },
  profile: {
    summary: 'Designer numérique et développeuse front-end, je donne vie à des expériences web à la fois sensibles, accessibles et simples à utiliser. J’aime trouver le juste équilibre entre une idée singulière et une réalisation soignée.'
  },
  maintenance: { enabled: false, message: 'Ce site est en maintenance. Revenez bientôt !' },
  experiences: [{ id: 1, title: 'Développeuse web', company: 'Studio Créatif', location: 'Paris', period: '2022 — Aujourd’hui', description: 'Création de sites web accessibles et accompagnement des clients dans leurs projets numériques.', technologies: ['JavaScript', 'CSS'] }],
  educations: [{ id: 2, degree: 'Licence Informatique', school: 'Université de Paris', location: 'Paris', period: '2019 — 2022', description: 'Spécialisation en développement web.' }],
  skills: [{ category: 'Développement', items: ['HTML', 'CSS', 'JavaScript'] }, { category: 'Design', items: ['Figma', 'Accessibilité'] }],
  projects: [{ title: 'Portfolio créatif', description: 'Un site vitrine pour présenter des projets et partager mon travail.', link: '', technologies: ['HTML', 'CSS'] }],
  languages: [{ language: 'Français', level: 'Natif' }, { language: 'Anglais', level: 'Courant' }]
};
