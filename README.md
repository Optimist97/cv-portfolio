# CV éditorial — Clémence Martin (profil fictif)

Un CV public élégant, responsive et imprimable, accompagné d’un mini-CMS local pour modifier le profil, la photo, les sections et le mode maintenance. Le profil fourni est fictif : adaptez-le avant de publier.

## Lancer le CMS

Installez Node.js, puis dans ce dossier :

```powershell
npm install
npm run dev
```

Ouvrez `http://127.0.0.1:3000/cms.html`. Une page de connexion dédiée s’affiche d’abord ; l’éditeur ne s’ouvre qu’après validation du jeton GitHub. Les changements sont sauvegardés dans le stockage local de ce navigateur. La photo importée depuis l’ordinateur doit faire au plus 1 Mo. Le toggle de photo permet de la masquer sans la supprimer ; le toggle de maintenance affiche une page temporaire avec le message modifiable.

## Connecter GitHub et publier

Le dépôt cible est [`Optimist97/cv-portfolio`](https://github.com/Optimist97/cv-portfolio). Créez un jeton personnel **finement limité** depuis [les paramètres de jetons GitHub](https://github.com/settings/personal-access-tokens/new) avec :

- Accès au dépôt sélectionné `cv-portfolio` uniquement.
- Permission de dépôt **Contents: Read and write** (Metadata est accordé automatiquement).
- Aucun secret n’est requis par GitHub Actions pour le workflow Pages.

Saisissez le jeton uniquement dans le champ masqué du CMS ouvert sur cet ordinateur. Le mini-CMS le garde en mémoire pendant que cette page est ouverte, ne l’écrit ni dans le stockage local ni dans un fichier, et le retire à la déconnexion ou à la fermeture de la page. Ne le collez pas dans une conversation ou dans le dépôt. Révoquez-le depuis GitHub si vous n’en avez plus besoin.

1. Cliquez sur **Se connecter** ; le CMS vérifie le compte et le dépôt.
2. Au premier déploiement, cliquez sur **Installer le site dans le dépôt** et confirmez l’envoi du code et du profil exemple public.
3. Ensuite, modifiez le CV puis cliquez sur **Publier les changements**. Cette action met à jour `public/cv-data.json` et déclenche le déploiement.

Le workflow `.github/workflows/pages.yml` construit le CV et le publie avec GitHub Pages. Dans les réglages du dépôt, choisissez **GitHub Actions** comme source de Pages si nécessaire. Le site de production n’inclut pas le CMS ; gardez l’éditeur sur cet ordinateur.

## Vérifier et construire

```powershell
npm test
npm run build
npm run preview
```

Le résultat public est dans `dist/`. Il s’adapte à l’URL de projet GitHub Pages et reste imprimable.

## Sécurité et confidentialité

- Le profil et toute photo publiés sont accessibles publiquement. Remplacez les exemples par les informations que vous souhaitez partager.
- Le CMS est conçu pour une utilisation locale sur `127.0.0.1`, pas comme une interface d’administration hébergée publiquement.
- Le jeton est transmis directement à l’API GitHub depuis le navigateur local, et ne passe pas par un serveur tiers.
- Le rendu échappe les champs texte et n’autorise que les liens HTTP(S).
- Les informations locales sont sauvegardées dans le navigateur. Utilisez l’import/export JSON pour en conserver une copie.
