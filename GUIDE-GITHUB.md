# Ton fork, WebStorm et la publication

Le fork [thibaultodor/poke-calme](https://github.com/thibaultodor/poke-calme)
est le dépôt de destination. Le dossier cloné possède déjà son lien GitHub
nommé `origin` : il n’est pas nécessaire de recréer le fork ou de le recloner.

## Essayer avec ta maman

Double-clique sur **DEMARRER.cmd**. Le navigateur s’ouvre et la fenêtre du
lanceur reste ouverte pendant la séance. Si Bun manque mais que Node.js est
installé, le lanceur prépare la version prévue sans installation globale.
Le premier lancement peut prendre une minute et nécessite Internet.

À l’accueil, **Découvrir sans micro** permet de voir les promenades. La
démonstration n’enregistre aucune rencontre dans la collection.

Pour une vraie séance :

1. Appuyer sur **Commencer**, puis autoriser le micro dans le navigateur.
2. Dans **Réglages**, choisir le micro et le volume adapté à l’activité.
3. Au besoin, utiliser **Étalonner** : cinq secondes de silence, puis cinq
   secondes de conversation normale. Le niveau est relatif, pas des décibels certifiés.
4. Laisser travailler la classe. Le premier Pokémon vient après 10 à 20
   secondes de calme ; les suivants environ toutes les deux minutes par défaut.
5. Pour parler, appuyer sur **Pause** ou **Espace**. Les Pokémon regardent la
   classe et le bruit de l’enseignante n’est plus pris en compte.

**Espace** ne fait rien lorsqu’on écrit une consigne ou qu’un panneau est
ouvert. **Nouvelle séance** vide le décor après confirmation, en conservant
la collection. **Couper le micro et revenir à l’accueil** libère réellement
le microphone et conserve les rencontres ; on peut ensuite reprendre.

Les réglages, les groupes, la collection et les notes restent sur ce
navigateur. Ils ne se synchronisent pas entre ordinateurs. Supprimer les
données du site les efface. Évite d’y saisir des informations personnelles
inutiles sur les élèves.

## Utiliser sans Internet

Sur le site publié, ouvrir une première fois l’application avec Internet et
attendre le badge **Prêt pour une utilisation hors connexion**. On peut alors
la recharger sans réseau et retrouver la clairière, les Pokémon et les pages
d’information. La copie locale peut être effacée par le navigateur si son
stockage manque ou si les données du site sont supprimées.

Le navigateur peut aussi proposer d’installer l’application. Une nouvelle
version s’applique lorsque les anciens onglets sont fermés, ou avec le bouton
**Mettre à jour l’application** proposé à l’accueil. Ne pas déclencher une
mise à jour en plein travail de classe.

Le mode développement de WebStorm demande de garder le serveur local
ouvert. Le mode hors connexion est testé sur la version compilée et publiée.

## Développer dans WebStorm

Ouvrir la racine qui contient `package.json`. Les réglages personnels
WebStorm dans `.idea` restent locaux et ne sont pas envoyés sur GitHub.
La configuration partagée **Poké Calme** est fournie dans `.run`.

Après installation des dépendances par le lanceur ou par `bun install`,
choisir **Poké Calme** dans la liste Exécuter, ou utiliser le bouton à côté
du script `dev` dans `package.json`. Chaque enregistrement met la page à jour.

Avant un commit, lancer depuis le terminal du projet :

```sh
bun run check
bun test
bun run lint
bun run build
bun run test:browser
```

Pour le premier test de navigateur : `bunx playwright install chromium`.
Pour mettre le code en forme : `bun run format`.

## Enregistrer sur ton GitHub

Dans **Commit**, relire puis enregistrer les modifications sur la branche
de travail. Faire **Push** vers `origin`. Sur GitHub, créer une demande de
fusion vers la branche `main` de **ton dépôt thibaultodor/poke-calme**,
puis attendre les vérifications et la fusionner. GitHub peut proposer le dépôt
original comme destination : bien sélectionner ton propre fork.

Les demandes de fusion exécutent les tests et ne publient pas le site.
Le dépôt d’origine Shy Safari ne reçoit aucune modification avec ce parcours.

## Activer GitHub Pages une première fois

Quand tu décides de rendre la version accessible sur Internet :

1. Dans ton fork : **Settings → Pages**.
2. **Build and deployment → Source → GitHub Actions**.
3. Dans **Actions**, autoriser les workflows du fork si GitHub le demande.
4. Ouvrir **Vérifier et publier**, puis **Run workflow** sur `main` après la fusion.
5. Attendre la réussite. L’adresse figure dans **Settings → Pages** et dans
   le déploiement terminé : normalement [thibaultodor.github.io/poke-calme](https://thibaultodor.github.io/poke-calme/).

Ensuite, une modification fusionnée dans `main` lance les vérifications et
la publication. Les chemins d’images, le mode hors connexion et l’adresse
canonique suivent le chemin GitHub Pages du dépôt. Aucun jeton personnel
n’est à coller dans le code.

Si une étape est rouge, ouvrir son journal dans **Actions**. Une erreur Pages
se règle d’abord dans **Settings → Pages**. Les erreurs de code se reproduisent
avec les commandes de vérification. GitHub Free propose Pages pour les dépôts
publics ; les options de dépôts privés dépendent du forfait et ne rendent pas
automatiquement le site privé.

## Repères dans le code

La liste des Pokémon et leur rareté sont dans
`src/lib/scenes/pokemon/catalog.ts`. Après modification :

```sh
bun run sprites:import
```

L’import télécharge Idle et Walk, leurs durées, les métadonnées et les crédits
depuis une révision fixe de SpriteCollab. Les animations sont découpées et
orientées à l’écran. Les PNG d’origine ne sont pas retouchés.

Les tests de parcours sont dans `scripts/check-browser.mjs`. Ils utilisent
un micro simulé, contrôlent les interruptions et la reprise, le clavier,
la démonstration indépendante, la sauvegarde et le mode hors connexion.

## Droits

Le code de Shy Safari et l’adaptation sont Apache 2.0. Conserver
`LICENSE.txt`, `NOTICE.md` et les mentions de modification.
SpriteCollab annonce CC BY-NC 4.0 pour les contributions que leurs auteurs
peuvent licencier ; certains sprites officiels sont crédités CHUNSOFT.
Les crédits et la licence se trouvent dans `static/credits/pmd/` et la page
**À propos** les rend accessibles.

L’absence de publicité et le contexte scolaire ne suffisent pas, à eux
seuls, à garantir le droit de publier ces personnages. La
[position officielle Pokémon](https://support.pokemon.com/hc/en-us/articles/360000634094-Can-I-use-Pok%C3%A9mon-images-or-materials)
reste restrictive. Pour une diffusion avec des droits clairs sur les images,
obtenir l’autorisation adaptée ou remplacer les personnages par des créations
dont on maîtrise les droits.

Sources : [WebStorm et GitHub](https://www.jetbrains.com/help/webstorm/github.html),
[GitHub Pages et Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[Bun](https://bun.sh/docs/installation),
[SpriteCollab](https://github.com/PMDCollab/SpriteCollab).
