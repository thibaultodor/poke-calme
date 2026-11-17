# Poké Calme — origine et modifications

Cette version adapte **Shy Safari**, par teacherdotdev / teacher.dev :
https://github.com/teacherdotdev/shy-safari

Base de travail : `351b79c345287d2ccf574dbe599bf0fbbe8d5a67`.
La licence Apache 2.0 d’origine est conservée intégralement dans `LICENSE.txt`.

Modifications de l’adaptation, novembre 2026 : scène Pokémon Donjon Mystère,
lecture des animations Idle/Walk dans huit directions, décor original,
français et pause douce par défaut, identité Poké Calme, stockage distinct,
pages d’information propres à l’adaptation, retrait de la mesure d’audience,
démo sans microphone et publication GitHub Pages. L’adaptation n’est pas
maintenue ni approuvée par l’équipe de Shy Safari.

Version 0.2 : écran d’accueil, rythme CP de deux minutes, gestion des micros
interrompus et de leur arrêt, navigation au clavier, démonstration séparée,
mode hors connexion, installation depuis le navigateur et tests de parcours.

Animations complémentaires : arrivée depuis les hautes herbes avec bulle
d’exclamation, siestes rares de 30 à 120 secondes, lecture des véritables
planches Sleep (une seule orientation pour les 16 Pokémon sélectionnés).
Les premières herbes provenaient des effets de terrain de Pokémon Émeraude, conservés
par pret/pokeemerald, révision `9103e529c2fbdd7add4a1ff3350c6c1f92112c42`.
Leur indice de palette 0 est rendu transparent pour le navigateur, sans
changer les pixels. Sources et original : `static/credits/emerald/`.
La touffe actuellement affichée est un dessin SVG original en pixel art.

Le code ajouté est également proposé sous licence Apache 2.0. Cette licence
ne s’étend pas aux images Pokémon ni aux marques et personnages associés.

Les sprites proviennent de PMDCollab / SpriteCollab, révision
`c9765fc6f8474168a24be5c785ded6fe58683ce0` :
https://github.com/PMDCollab/SpriteCollab

La politique de SpriteCollab annonce CC BY-NC 4.0 pour les contributions que
leurs auteurs peuvent licencier. Les crédits par Pokémon, les métadonnées
d’origine et le texte de la licence figurent dans `static/credits/pmd/`.
Certains sprites officiels sont crédités CHUNSOFT. Les PNG ne sont pas
retouchés ; leur affichage est découpé, agrandi et animé par l’application.

Les copies d’affichage dans `atlases/` entourent chaque image de deux pixels
transparents pour éviter les débordements entre cases. Les pixels des sprites
restent identiques aux originaux conservés dans `assets/`. L’apparition utilise
une unique touffe de forme stable, légèrement balancée autour de sa base.

Pokémon et les personnages associés appartiennent à leurs titulaires
respectifs. Projet de fan non officiel, sans affiliation avec Nintendo,
Creatures, GAME FREAK, The Pokémon Company ou Chunsoft. L’absence de publicité
et la licence communautaire ne garantissent pas le droit de publier les sprites.
