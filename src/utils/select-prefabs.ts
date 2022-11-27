import {randomInt} from 'node:crypto'
import {Vector3} from 'three'
import {RANDOM_POI_NAME, SKIPPED_POI_NAME} from '../const'
import {Prefab} from '../types'

export const getRandomPrefab = (
  prefabToReplace: Prefab,
  socketPrefabToReplace: Prefab,
  biome: string,
  position: Vector3,
  prefabCandidates: Prefab[],
  prefabCounter: Map<string, number>,
): Prefab | typeof SKIPPED_POI_NAME => {
  if (prefabCandidates.length === 0) {
    if (prefabToReplace.name === RANDOM_POI_NAME) {
      console.log(
        `[RANDOMIZER] No replacement found for ${prefabToReplace.name} (${
          socketPrefabToReplace.name
        }@${position
        .toArray()
        .join(
          ',',
        )}) in biome ${biome} with size: ${prefabToReplace.meta.PrefabSize.toArray().join(
          ',',
        )}. Ignoring this marker as it is a random POI.`,
      )
      return SKIPPED_POI_NAME
    }

    console.log(
      `[RANDOMIZER] No valid replacement found for ${prefabToReplace.name} (${
        socketPrefabToReplace.name
      }@${position
      .toArray()
      .join(
        ',',
      )}) in biome ${biome} with size: ${prefabToReplace.meta.PrefabSize.toArray().join(
        ',',
      )}. Keeping original.`,
    )
    return prefabToReplace
  }

  if (prefabCandidates.length === 1) {
    return prefabCandidates[0]
  }

  // Prefer unspawned prefabs
  const unspawned = prefabCandidates.filter(
    prefabCandidate =>
      (prefabCounter.get(prefabCandidate.name.toLocaleLowerCase()) || 0) === 0,
  )

  if (unspawned.length > 0) {
    if (unspawned.length === 1) {
      // console.log("[RANDOMIZER] Last unspawned:", unspawned[0].name)
      return unspawned[0]
    }

    const rnd = randomInt(0, unspawned.length - 1)
    // console.log("[RANDOMIZER] ", {
    //   unspawned: unspawned.map((v) => v.name).join(","),
    //   rnd,
    // })
    return unspawned.length === 1 ? unspawned[0] : unspawned[rnd]
  }

  // console.log("[RANDOMIZER] No unspawned, go normal")

  return prefabCandidates.length === 1 ?
    prefabCandidates[0] :
    prefabCandidates[randomInt(0, prefabCandidates.length - 1)]
}
