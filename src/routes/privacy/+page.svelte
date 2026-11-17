<!-- Modifié pour Poké Calme (2026) : adaptation CP, voir NOTICE.md. -->
<script lang="ts">
  import DocPage from "$lib/components/DocPage.svelte";
  import PageMeta from "$lib/components/PageMeta.svelte";
</script>

<PageMeta
  path="/privacy"
  title="Confidentialité — Poké Calme"
  description="Le microphone est traité sur votre ordinateur, sans enregistrement audio."
/>
<DocPage
  title="Le son reste dans la classe"
  lede="Le microphone mesure le volume ; il n’enregistre pas les conversations."
>
  <section
    class="space-y-4 rounded-2xl bg-white/90 p-6 leading-relaxed shadow-lg"
  >
    <p>
      Après une première ouverture complète du site publié, le navigateur
      conserve une copie de l’application et de ses images pour permettre
      l’utilisation hors connexion. Le badge « Prêt pour une utilisation hors
      connexion » confirme que cette préparation est terminée. Le navigateur
      peut effacer cette copie si son stockage est saturé ou si vous supprimez
      les données du site.
    </p>
    <p>
      Le son est analysé dans le navigateur pour calculer un niveau sonore.
      Aucun extrait audio n’est enregistré, conservé ou envoyé à un serveur.
      L’accès au micro est demandé par le navigateur quand vous appuyez sur
      Commencer.
    </p>
    <p>
      Les réglages, les noms des groupes, les Pokémon rencontrés et les notes de
      l’enseignante restent dans le stockage local de ce navigateur. Ils ne se
      synchronisent pas entre ordinateurs. Effacer les données du site les
      supprime.
    </p>
    <p>
      Cette version n’intègre ni publicité, ni outil de mesure d’audience, ni
      compte utilisateur. Les sprites sont fournis avec le site et ne sont pas
      chargés depuis une API externe pendant la séance.
    </p>
    <p>
      Comme pour toute page web hébergée, l’hébergeur reçoit les requêtes
      nécessaires à l’affichage du site, avec les informations de connexion
      habituelles, notamment l’adresse IP. Cela ne comprend pas le son du micro.
    </p>
    <p>
      Le microphone nécessite une adresse HTTPS ou localhost. Pour couper
      complètement son accès, fermez l’onglet ou retirez l’autorisation dans les
      paramètres du navigateur. Pause suspend la séance tout en gardant le micro
      connecté pour pouvoir reprendre.
    </p>
  </section>
</DocPage>
