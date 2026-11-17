<!-- Modifié pour Poké Calme (2026) : adaptation CP, voir NOTICE.md. -->
<script lang="ts">
  import { asset } from "$app/paths";
  import DocPage from "$lib/components/DocPage.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
  const card =
    "mb-6 space-y-3 rounded-2xl bg-white/90 p-6 leading-relaxed shadow-lg";
  const link = "font-semibold text-teal-700 underline";
</script>

<PageMeta
  path="/about"
  title="À propos — Poké Calme"
  description="Origine, crédits et droits de Poké Calme."
/>
<DocPage
  title="Un petit coin de calme"
  lede="Une adaptation familiale pour accompagner le travail en classe de CP."
>
  <section class={card}>
    <h2 class="text-xl font-semibold">Le principe</h2>
    <p>
      Le temps de travail calme fait venir de nouveaux Pokémon dans une
      clairière. Par défaut, le bruit suspend les arrivées et aucun Pokémon
      gagné ne disparaît. Le bouton Pause permet à l’enseignante de parler sans
      être prise en compte.
    </p>
    <p>
      16 Pokémon disposent de leurs animations de marche et de repos dans huit
      directions, issues du style Donjon Mystère. Ils apparaissent depuis les
      hautes herbes et peuvent faire de rares siestes de 30 secondes à deux
      minutes, avec leurs propres sprites de sommeil. Les décors animaliers du
      projet d’origine restent disponibles.
    </p>
  </section>
  <section class={card}>
    <h2 class="text-xl font-semibold">Merci à Shy Safari</h2>
    <p>
      Cette application est une adaptation de <a
        class={link}
        href="https://github.com/teacherdotdev/shy-safari">Shy Safari</a
      >, créé lors de l’EdTech-a-thon et maintenu par teacher.dev. Son code est
      distribué sous licence Apache 2.0. Cette adaptation est indépendante du
      projet d’origine.
    </p>
  </section>
  <section class={card}>
    <h2 class="text-xl font-semibold">Sprites et crédits</h2>
    <p>
      Les images proviennent de <a
        class={link}
        href="https://github.com/PMDCollab/SpriteCollab"
        >PMDCollab / SpriteCollab</a
      >. Le dépôt annonce une licence
      <a class={link} href="https://creativecommons.org/licenses/by-nc/4.0/"
        >CC BY-NC 4.0</a
      > pour les contributions que leurs auteurs peuvent licencier. Les crédits de
      chaque Pokémon sont conservés, y compris CHUNSOFT pour les sprites officiels.
    </p>
    <p>
      <a class={link} href={asset("/credits/pmd/CREDITS.md")}
        >Lire tous les crédits et les sources</a
      >
      ·
      <a class={link} href={asset("/credits/pmd/LICENSE.md")}
        >Lire la licence du dépôt</a
      >
    </p>
    <p>
      Les PNG sont conservés sans retouche ; l’application les découpe à
      l’écran, les agrandit et les anime. Le décor de la clairière est original.
    </p>
    <p>
      La touffe de hautes herbes est un dessin original en pixel art. Les
      sources de la première animation, issues de Pokémon Émeraude via le projet
      <a class={link} href="https://github.com/pret/pokeemerald"
        >pret/pokeemerald</a
      >, sont également conservées.
      <a class={link} href={asset("/credits/emerald/CREDITS.md")}
        >Sources et crédits des herbes</a
      >.
    </p>
    <p>
      Pokémon et les personnages associés appartiennent à leurs titulaires
      respectifs. Cette application est un projet de fan non officiel, sans
      affiliation avec Nintendo, Creatures, GAME FREAK, The Pokémon Company ou
      Chunsoft. L’absence de publicité et les licences communautaires ne valent
      pas autorisation générale des titulaires pour publier ces images.
    </p>
  </section>
</DocPage>
