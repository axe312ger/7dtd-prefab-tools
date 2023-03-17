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

  let lowestCount = -1
  for (const prefabName of prefabCandidates) {
    const count = prefabCounter.get(prefabName.name.toLocaleLowerCase()) || 0

    if (lowestCount < 0 || count < lowestCount) {
      lowestCount = count
    }
  }

  const leastSpawned = prefabCandidates.filter(
    prefabCandidate =>
      (prefabCounter.get(prefabCandidate.name.toLocaleLowerCase()) || 0) === lowestCount,
  )

  if (leastSpawned.length === 1) {
    return leastSpawned[0]
  }

  const rnd = randomInt(0, leastSpawned.length - 1)
  return leastSpawned[rnd]
}
