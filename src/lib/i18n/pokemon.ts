import type { LanguageCode, UiKey } from "./index.svelte";

export const POKEMON_WORDING: Record<
  LanguageCode,
  Partial<Record<UiKey, string>>
> = {
  fr: {
    "start.shy": "Chut… les Pokémon aiment le calme !",
    "start.explain":
      "Pendant que nous travaillons tranquillement, de nouveaux compagnons viennent se promener. S’il y a du bruit, ils attendent : personne ne disparaît.",
    "start.explainFlee":
      "Pendant que nous travaillons tranquillement, les Pokémon viennent se promener. S’il y a trop de bruit, certains repartent.",
    "controls.animals": "Pokémon",
    "collection.title": "Nos rencontres Pokémon",
    "collection.spotted": "{class} : {seen} Pokémon rencontrés sur {total}",
    "collection.notSeen": "À rencontrer",
    "collection.seen": "Rencontré {count}×",
    "settings.arrival": "Le rythme des rencontres",
    "settings.aboutEvery": "Un Pokémon environ toutes les",
    "counter.label": "Pokémon rencontrés : {count}",
    "settings.showCounter": "Afficher le nombre de Pokémon rencontrés",
    "rate.hint": "un Pokémon toutes les {minutes} minutes environ",
    "loud.pause.label": "Les Pokémon patientent",
    "loud.pause.hint":
      "Tout le monde reste. Les nouvelles rencontres attendent le calme.",
    "loud.flee.label": "Certains repartent",
    "loud.flee.hint":
      "Si le bruit dure, des Pokémon quittent peu à peu la clairière.",
    "meter.paused": "Les rencontres patientent",
    "meter.arriving": "Le calme fait venir les Pokémon",
    "meter.goal":
      "Seuil de calme : {goal} %. Déplacez la ligne pour l’adapter à votre salle.",
    "blocked.title": "Retrouvons le micro de la classe",
    "settings.summon": "Faire venir tous les Pokémon",
    "chance.common.label": "Probabilité des Pokémon communs",
    "chance.uncommon.label": "Probabilité des Pokémon peu communs",
    "chance.rare.label": "Probabilité des Pokémon rares",
  },
  en: {
    "start.shy": "Shh… Pokémon like a quiet room!",
    "start.explain":
      "As we work quietly, new friends come for a walk. If it gets noisy, they wait: no one disappears.",
    "start.explainFlee":
      "As we work quietly, Pokémon come for a walk. If it gets too noisy, some leave.",
    "controls.animals": "Pokémon",
    "collection.title": "Our Pokémon encounters",
    "collection.spotted": "{class}: {seen} of {total} Pokémon encountered",
    "collection.notSeen": "Not met yet",
    "collection.seen": "Met {count}×",
    "settings.arrival": "How often we meet new friends",
    "settings.aboutEvery": "About one Pokémon every",
    "counter.label": "Pokémon encountered: {count}",
    "settings.showCounter": "Show the number of Pokémon encountered",
    "rate.hint": "about one Pokémon every {minutes} minutes",
    "loud.pause.label": "Pokémon wait",
    "loud.pause.hint": "Everyone stays. New encounters wait for quiet.",
    "loud.flee.label": "Some leave",
    "loud.flee.hint":
      "During sustained noise, some Pokémon leave the clearing.",
    "meter.paused": "New encounters are waiting",
    "meter.arriving": "Quiet brings new Pokémon",
    "meter.goal": "Quiet threshold: {goal}%. Move the line to suit your room.",
    "blocked.title": "Let’s reconnect the class microphone",
  },
  es: {
    "start.shy": "Chist… ¡a los Pokémon les gusta la calma!",
    "start.explain":
      "Mientras trabajamos tranquilos, vienen nuevos amigos a pasear. Si hay ruido, esperan: nadie desaparece.",
    "start.explainFlee":
      "Mientras trabajamos tranquilos, los Pokémon vienen a pasear. Si hay demasiado ruido, algunos se van.",
    "controls.animals": "Pokémon",
    "collection.title": "Nuestros encuentros Pokémon",
    "collection.spotted": "{class}: {seen} de {total} Pokémon encontrados",
    "collection.notSeen": "Por conocer",
    "collection.seen": "Encontrado {count}×",
    "settings.arrival": "El ritmo de los encuentros",
    "settings.aboutEvery": "Un Pokémon aproximadamente cada",
    "counter.label": "Pokémon encontrados: {count}",
    "settings.showCounter": "Mostrar el número de Pokémon encontrados",
    "rate.hint": "un Pokémon cada {minutes} minutos aproximadamente",
    "loud.pause.label": "Los Pokémon esperan",
    "loud.pause.hint":
      "Todos se quedan. Los nuevos encuentros esperan a que vuelva la calma.",
    "loud.flee.label": "Algunos se van",
    "loud.flee.hint": "Si el ruido continúa, algunos Pokémon salen del claro.",
    "meter.paused": "Los nuevos encuentros esperan",
    "meter.arriving": "La calma trae nuevos Pokémon",
    "meter.goal":
      "Umbral de calma: {goal}%. Mueve la línea para adaptarla a la clase.",
    "blocked.title": "Reconectemos el micrófono de la clase",
  },
};
