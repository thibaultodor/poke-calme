import type { CreatureDef, RarityTier } from "../types";

/** Add a Pokémon here, then run `bun run sprites:import`. */
export const POKEMON = [
  { id: 1, slug: "pmd-bulbasaur", name: "Bulbizarre", tier: "common" },
  { id: 4, slug: "pmd-charmander", name: "Salamèche", tier: "common" },
  { id: 7, slug: "pmd-squirtle", name: "Carapuce", tier: "common" },
  { id: 10, slug: "pmd-caterpie", name: "Chenipan", tier: "common" },
  { id: 16, slug: "pmd-pidgey", name: "Roucool", tier: "common" },
  { id: 25, slug: "pmd-pikachu", name: "Pikachu", tier: "common" },
  { id: 39, slug: "pmd-jigglypuff", name: "Rondoudou", tier: "common" },
  { id: 43, slug: "pmd-oddish", name: "Mystherbe", tier: "common" },
  { id: 54, slug: "pmd-psyduck", name: "Psykokwak", tier: "uncommon" },
  { id: 58, slug: "pmd-growlithe", name: "Caninos", tier: "uncommon" },
  { id: 79, slug: "pmd-slowpoke", name: "Ramoloss", tier: "uncommon" },
  { id: 133, slug: "pmd-eevee", name: "Évoli", tier: "uncommon" },
  { id: 143, slug: "pmd-snorlax", name: "Ronflex", tier: "rare" },
  { id: 147, slug: "pmd-dratini", name: "Minidraco", tier: "rare" },
  { id: 149, slug: "pmd-dragonite", name: "Dracolosse", tier: "rare" },
  { id: 151, slug: "pmd-mew", name: "Mew", tier: "rare" },
] satisfies { id: number; slug: string; name: string; tier: RarityTier }[];

export const POKEMON_ROSTER: CreatureDef[] = POKEMON.map((pokemon) => ({
  slug: pokemon.slug,
  tier: pokemon.tier,
  width: 150,
  // Session uses this for spawning; PokemonCreature handles the eight-way walk.
  motion: "graze",
  parts: [],
}));
