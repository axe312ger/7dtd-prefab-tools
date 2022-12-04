import {Box2, Vector2, Vector3} from 'three'
import {Decoration, Prefab} from '../types'

function getMostFrequent(arr: string[]) {
  const hashmap: Map<string, number> = new Map()

  for (const val of arr) {
    if (val !== 'any') {
      const currentVal = hashmap.get(val)
      if (currentVal) {
        hashmap.set(val, currentVal + 1)
      } else {
        hashmap.set(val, 1)
      }
    }
  }

  if (hashmap.size === 0) {
    return null
  }

  let highestKey = ''
  let highestCnt = 0

  for (const [key, cnt] of hashmap.entries()) {
    if (cnt > highestCnt) {
      highestKey = key
      highestCnt = cnt
    }
  }

  return highestKey
}

const removeSpawnedMarkers = (
  prefabs: Map<string, Prefab>,
  decorations: Decoration[],
  socketPrefab: Prefab,
  socketDecoration: Decoration,
): {
  positionsToDelete: Vector3[];
  foundZones: string[];
  foundTownships: string[];
  foundOldwestFlags: boolean[];
  spawnedDecorations: Decoration[];
} => {
  const positionsToDelete: Vector3[] = []
  const spawnedDecorations: Decoration[] = []
  const foundZones: string[] = []
  const foundTownships: string[] = []
  const foundOldwestFlags: boolean[] = []

  const socketBox = new Box2(
    new Vector2(socketDecoration.position.x, socketDecoration.position.z),
    new Vector2(
      socketDecoration.position.x + socketPrefab.meta.PrefabSize.x,
      socketDecoration.position.z + socketPrefab.meta.PrefabSize.z,
    ),
  )
  for (const decorationCandidate of decorations.values()) {
    // Do not delete tiles that (accidently?) overlap
    if (decorationCandidate.name.indexOf('rwg_tile_') === 0) {
      continue
    }

    const decorationPrefab = prefabs.get(
      decorationCandidate.name.toLocaleLowerCase(),
    )

    if (!decorationPrefab) {
      throw new Error(
        `Unable to load prefab ${decorationCandidate.name.toLocaleLowerCase()}`,
      )
    }

    const decorationCandidateBox = new Box2(
      new Vector2(
        decorationCandidate.position.x,
        decorationCandidate.position.z,
      ),
      new Vector2(
        decorationCandidate.position.x + decorationPrefab.meta.PrefabSize.x,
        decorationCandidate.position.z + decorationPrefab.meta.PrefabSize.z,
      ),
    )
    if (decorationCandidateBox.intersectsBox(socketBox)) {
      // console.log(
      //   'Removing',
      //   decorationCandidate.name,
      //   '@',
      //   decorationCandidate.position.x,
      //   'x',
      //   decorationCandidate.position.z,
      // )
      positionsToDelete.push(decorationCandidate.position)
      foundZones.push(...decorationPrefab.meta.zoning)
      foundTownships.push(...decorationPrefab.meta.allowedTownships)
    }
  }

  // Remove located spawned prefabs from actual decorations
  decorations = decorations.filter(decoration => {
    if (positionsToDelete.includes(decoration.position)) {
      spawnedDecorations.push(decoration)
      return false
    }

    return true
  })

  // Loop deeper with spawned decorations to ensure sub-parts and so on get deleted
  const newSpawnedDecorations: Decoration[] = []
  for (const decoration of spawnedDecorations) {
    const decorationPrefab = prefabs.get(decoration.name.toLocaleLowerCase())

    if (!decorationPrefab) {
      throw new Error(
        `Unable to load prefab ${decoration.name.toLocaleLowerCase()}`,
      )
    }

    if (decorationPrefab.meta.markers) {
      // console.log(
      //   `Locate and remove markers for Prefab ${decorationPrefab.name}@${decoration.position.x}x${decoration.position.z}`,
      // )
      const additionalMeta = removeSpawnedMarkers(
        prefabs,
        decorations,
        decorationPrefab,
        decoration,
      )
      foundZones.push(...additionalMeta.foundZones)
      foundTownships.push(...additionalMeta.foundTownships)
      foundOldwestFlags.push(...additionalMeta.foundOldwestFlags)
      newSpawnedDecorations.push(
        ...additionalMeta.spawnedDecorations,
      )
    }
  }

  spawnedDecorations.push(...newSpawnedDecorations)

  return {
    positionsToDelete,
    foundZones,
    foundTownships,
    foundOldwestFlags,
    spawnedDecorations,
  }
}

export const filterPOIMarkers = (
  decorations: Decoration[],
  prefabs: Map<string, Prefab>,
): Decoration[] => {
  const sockets: Decoration[] = []

  while (decorations.length > 0) {
    const decoration = decorations.shift()
    // Last one
    if (!decoration) {
      continue
    }

    const prefab = prefabs.get(decoration.name.toLocaleLowerCase())
    if (!prefab) {
      throw new Error(
        `Unable to load prefab ${decoration.name}. Did you remove or rename it?`,
      )
    }

    // Iterate markers, gather dater and delete them
    if (prefab.meta.markerGroups && prefab.meta.markerGroupsOrder) {
      // console.log(
      //   `Locate and remove markers for Socket/Tile ${prefab.name}@${decoration.position.x}x${decoration.position.z}`,
      // )
      const {positionsToDelete, foundTownships, spawnedDecorations} = removeSpawnedMarkers(
        prefabs,
        decorations,
        prefab,
        decoration,
      )

      // Delete top level decorations
      decorations = decorations.filter(({name, position}) => !positionsToDelete.includes(position) || name.indexOf('part_') === 0)

      decoration.spawnedDecorations = spawnedDecorations
      const guessedZone = prefab.name
      .toLocaleLowerCase()
      .split('_')
      .find(v =>
        [
          'downtown',
          'residential',
          'commercial',
          'industrial',
          'rural',
        ].includes(v),
      )
      if (guessedZone) {
        decoration.guessedZone = guessedZone
      }

      if (prefab.name.indexOf('rwg_tile_oldwest_') === 0) {
        decoration.guessedTownship = 'oldwest'
      } else {
        const guessedTownship = getMostFrequent(
          foundTownships
          .filter(township => township !== 'oldwest')
          .map(v => v.toLocaleLowerCase()),
        )
        if (guessedTownship) {
          decoration.guessedTownship = guessedTownship
        }
      }
    }

    sockets.push(decoration)
  }

  // idea: loop through sockets, check if tiles are very close. if so:
  // 1. set as real socket/non wilderness
  // 2. guess type of zone & township based on close tiles // amount of tiles in one city

  return sockets
}
