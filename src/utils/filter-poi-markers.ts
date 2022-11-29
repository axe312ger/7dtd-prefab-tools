import {Decoration, POIMarker, Prefab} from '../types'

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

const findDecorationsForMarkers = (
  markerGroups: Map<string, Set<POIMarker>>,
  markerGroupsOrder: string[],
  prefabs: Map<string, Prefab>,
  decorations: Decoration[],
): {
  foundZones: string[];
  foundTownships: string[];
  foundOldwestFlags: boolean[];
  spawnedDecorations: Decoration[];
} => {
  const spawnedDecorations: Decoration[] = []
  const foundZones: string[] = []
  const foundTownships: string[] = []
  const foundOldwestFlags: boolean[] = []

  for (const markerGroupId of markerGroupsOrder) {
    const markerGroup = markerGroups.get(markerGroupId)
    // console.log("checking for markers in group", markerGroupId)

    const current = decorations[0]
    if (!current || !markerGroup) {
      continue
    }

    for (const marker of markerGroup) {
      // console.log("checking", { marker, current })

      // markers of type "RoadExit" seem to be spawned dynamically
      if (['RoadExit', 'None'].includes(marker.Type)) {
        continue
      }

      if (decorations[0].name.indexOf('rwg_tile_') === 0) {
        continue
      }

      if (['POISpawn'].includes(marker.Type)) {
        // Some markers might not be able to spawn anything. We have to skip these
        if (marker.PartToSpawn) {
          const markerPOI = prefabs.get(marker.PartToSpawn.toLocaleLowerCase())
          if (!markerPOI) {
            console.warn(
              'Skipping marker as no potential POI can be found',
              marker,
            )
            continue
          }
        }

        // For POISpawn, we can assume the next one is the spawned prefab.
        const decorationPrefab = prefabs.get(
          decorations[0].name.toLocaleLowerCase(),
        )

        if (!decorationPrefab) {
          throw new Error(
            `Could not find marker prefab ${decorations[0].name}. Did you remove or rename it?`,
          )
        }

        const current = decorations.shift()
        if (current) {
          // console.log("found poi spawn", current)
          spawnedDecorations.push(current)
        }

        foundZones.push(...decorationPrefab.meta.zoning)
        foundTownships.push(...decorationPrefab.meta.allowedTownships)

        if (
          decorationPrefab.meta.markerGroups &&
          decorationPrefab.meta.markerGroupsOrder
        ) {
          // console.log("going deeper in level", current)
          const additionalMeta = findDecorationsForMarkers(
            decorationPrefab.meta.markerGroups,
            decorationPrefab.meta.markerGroupsOrder,
            prefabs,
            decorations,
          )
          foundZones.push(...additionalMeta.foundZones)
          foundTownships.push(...additionalMeta.foundTownships)
          foundOldwestFlags.push(...additionalMeta.foundOldwestFlags)
          spawnedDecorations.push(...additionalMeta.spawnedDecorations)
          // console.log("one level out again")
        }

        continue
      } else if (marker.Type === 'PartSpawn') {
        if (
          marker.PartSpawnChance !== 0 &&
          decorations[0].name !== marker.PartToSpawn
        ) {
          continue
        }

        if (decorations[0].name !== marker.PartToSpawn) {
          throw new Error(
            `Expecting part ${marker.PartToSpawn} in ${JSON.stringify(
              marker,
              null,
              2,
            )}`,
          )
        }

        const current = decorations.shift()
        if (current) {
          // console.log("found part spawn", current)
          spawnedDecorations.push(current)
        }

        continue
      }

      console.log({marker})
      throw new Error(`Unknown marker type: ${marker.Type}`)
    }
  }

  return {foundZones, foundTownships, foundOldwestFlags, spawnedDecorations}
}

export const filterPOIMarkers = (
  decorations: Decoration[],
  prefabs: Map<string, Prefab>,
) => {
  const sockets: Decoration[] = []

  console.dir({decorations, prefabs})

  while (decorations.length > 0) {
    const decoration = decorations.shift()
    if (!decoration) {
      continue
    }

    const prefab = prefabs.get(decoration.name.toLocaleLowerCase())
    if (!prefab) {
      throw new Error(
        `Unable to load prefab ${decoration.name}. Did you remove or rename it?`,
      )
    }

    if (prefab.meta.markerGroups && prefab.meta.markerGroupsOrder) {
      const {foundTownships, spawnedDecorations} = findDecorationsForMarkers(
        prefab.meta.markerGroups,
        prefab.meta.markerGroupsOrder,
        prefabs,
        decorations,
      )

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
  // 2. guess type of zone & township based on close tiles

  return sockets
}
