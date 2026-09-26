# CV éditorial — Camille De Smet (profil fictif)

Un CV public élégant, responsive et imprimable, accompagné d’un mini-CMS web pour modifier le profil, la photo, les sections et le mode maintenance. Le profil belge fourni est entièrement fictif : adaptez-le avant de publier.

## Ouvrir le CMS

Après publication, ouvre [la page de connexion du CMS](https://optimist97.github.io/cv-portfolio/cms.html). Elle est servie en HTTPS par GitHub Pages ; le lien n’est pas affiché sur le CV public. L’éditeur reste masqué jusqu’à la validation du jeton GitHub.

Pour travailler en local :

Installez Node.js, puis dans ce dossier :

```powershell
npm install
npm run dev
```

Ouvre `http://127.0.0.1:3000/cms.html`. Les changements sont sauvegardés dans le stockage local de ce navigateur. La photo importée depuis l’ordinateur doit faire au plus 1 Mo. Le toggle de photo permet de la masquer sans la supprimer ; les interrupteurs de contact affichent ou masquent le téléphone, LinkedIn et le portfolio ; le toggle de maintenance affiche une page temporaire avec le message modifiable.

## Connecter GitHub et publier

Le dépôt cible est [`Optimist97/cv-portfolio`](https://github.com/Optimist97/cv-portfolio). Créez un jeton personnel **finement limité** depuis [les paramètres de jetons GitHub](https://github.com/settings/personal-access-tokens/new) avec :

- Accès au dépôt sélectionné `cv-portfolio` uniquement.
- Permission de dépôt **Contents: Read and write** (Metadata est accordé automatiquement).
- Aucun secret n’est requis par GitHub Actions pour le workflow Pages.

Saisis le jeton finement limité dans le champ du CMS. Le navigateur le transmet directement à l’API GitHub via HTTPS ; le CMS le garde uniquement en mémoire pendant cette page et l’efface à la déconnexion ou à sa fermeture. Il n’est pas sauvegardé dans le stockage local ni dans le dépôt. N’inclus jamais le jeton dans un message ou un commit.

1. Cliquez sur **Se connecter** ; le CMS vérifie le compte et le dépôt.
2. Modifie le CV puis clique sur **Publier les changements**. Cette action met à jour `public/cv-data.json` et déclenche le déploiement.

Le workflow `.github/workflows/pages.yml` construit le CV et le CMS puis les publie avec GitHub Pages. La page du CMS est publique comme code, mais ses fonctions d’édition et de publication restent verrouillées jusqu’à validation d’un jeton autorisé. GitHub Pages étant un hébergement statique, il ne peut pas cacher le code HTML/JavaScript du CMS ni fournir de session serveur.

## Vérifier et construire

```powershell
npm test
npm run build
npm run preview
```

Le résultat public est dans `dist/`. Il s’adapte à l’URL de projet GitHub Pages et reste imprimable.

## Sécurité et confidentialité

- Le profil et toute photo publiés sont accessibles publiquement. Remplacez les exemples par les informations que vous souhaitez partager.
- La page de connexion et le code du CMS sont accessibles publiquement ; l’interface de modification s’ouvre seulement après vérification auprès de GitHub.
- Utilise un jeton limité au seul dépôt `cv-portfolio`, avec la permission Contents en lecture/écriture et une courte expiration. Toute personne qui obtient ce jeton pourrait modifier le contenu de ce dépôt.
- Le jeton est transmis directement à l’API GitHub depuis le navigateur en HTTPS et ne passe pas par un serveur tiers.
- Le rendu échappe les champs texte et n’autorise que les liens HTTP(S).
- Les informations locales sont sauvegardées dans le navigateur. Utilisez l’import/export JSON pour en conserver une copie.
