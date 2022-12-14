import {Vector3} from 'three'

import {POIMarker, Prefab, PrefabToolsConfig} from '../types'

interface FilterContextData {
  isWilderness: boolean;
  distanceMap: Map<string, Vector3[]>;
  position: Vector3;
  biome: string;
  marker?: POIMarker;
  debugPrefabName?: string;
  debugSocketName?: string;
  config: PrefabToolsConfig;
}

interface FilterContext extends FilterContextData {
  prefabToReplace: Prefab;
  prefabCandidate: Prefab;
}

export interface Filter {
  name: string;
  optional?: boolean;
  filter: (
    filterContext: FilterContext,
    index?: number,
    array?: Prefab[]
  ) => boolean;
}

type PrefabFilterSuccess = { success: true; prefabs: Prefab[] };
type PrefabFilterFailure = {
  success: false;
  prefabs: Prefab[];
  reason?: string;
};

type PrefabFilterResult = PrefabFilterSuccess | PrefabFilterFailure;

export const defaultPrefabFilters: Filter[] = [
  {
    name: '1. Do not mix types and check zone and township',
    filter: ({
      prefabToReplace,
      prefabCandidate,
      isWilderness,
    }: // debugPrefabName,
    FilterContext): boolean => {
      // Do not mix tiles and non tiles
      if (prefabToReplace.meta.isTile !== prefabCandidate.meta.isTile) {
        return false
      }

      if (
        prefabToReplace.meta.isTile &&
          prefabToReplace.meta.allowedTownships.includes('oldwest') &&
          !prefabCandidate.meta.allowedTownships.includes('oldwest')
      ) {
        // Do not mix oldwest and other tiles
        // if (true || debugPrefabName === prefabCandidate.name) {
        //   console.log(
        //     `Dropped ${prefabCandidate.name} because of oldwest tile check.`,
        //     prefabToReplace.meta.allowedTownships,
        //     prefabCandidate.meta.allowedTownships
        //   )
        // }
        return false
      }

      // Ensure not to mix tile types (straight, corner, t, ...)
      if (
        prefabToReplace.meta.isTile &&
        prefabToReplace.meta.tileType !== prefabCandidate.meta.tileType
      ) {
        return false
      }

      if (isWilderness) {
        // If we are looking for wilderness pois, we can skip the other checks and just test for the flag
        // if (true || debugPrefabName === prefabCandidate.name) {
        //   console.log(
        //     `maybe Dropped ${prefabCandidate.name} because of wildernessss.`
        //   )
        // }
        return prefabCandidate.meta.isWilderness
      }

      // If replacement candidate has a zone, filter by it
      if (
        prefabToReplace.meta.zoning.length > 0 &&
        prefabCandidate.meta.zoning.length > 0
      ) {
        const matchesZone = prefabToReplace.meta.zoning.some(z =>
          prefabCandidate.meta.zoning.includes(z),
        )

        if (!matchesZone) {
          // if (true || debugPrefabName === prefabCandidate.name) {
          //   console.log(
          //     `Dropped ${prefabCandidate.name} because of zone mismatch.`
          //   )
          // }
          return false
        }
      }

      // if base has no townships at all, do not allow wilderness
      // if (!prefabToReplace.meta.allowedTownships.length) {
      //   return !prefabCandidate.meta.allowedTownships.includes("wilderness")
      // }

      // Filter by township. This is optional when the original/master doesnt have it.
      const shouldCheckTownship =
        prefabToReplace.meta.allowedTownships.includes('oldwest') ||
        (prefabToReplace.meta.allowedTownships.length > 0 &&
          prefabCandidate.meta.allowedTownships.length > 0)

      if (shouldCheckTownship) {
        const matchesTownship = prefabToReplace.meta.allowedTownships.some(
          t => prefabCandidate.meta.allowedTownships.includes(t),
        )

        if (!matchesTownship) {
          // if (true || debugPrefabName === prefabCandidate.name) {
          //   console.log(
          //     `Dropped ${prefabCandidate.name} because of township mismatch.`
          //   )
          // }
          return false
        }
      }

      return true
    },
  },
  {
    name: '2. Filter by vanilla white and black lists, biome and difficulty',
    filter: ({
      prefabToReplace,
      prefabCandidate,
      biome,
      // debugPrefabName,
      config: {
        vanillaBlacklists,
        vanillaPrefabsPath,
        vanillaWhitelists,
        biomeTierMap,
      },
      marker,
    }: FilterContext): boolean => {
      // Skip check if marker is filtered by tags
      if (marker && marker.Tags && marker.Tags.length > 0) {
        return true
      }

      // Mach by difficulty tier
      const difficultyMatches = prefabCandidate.meta.difficultyTier === 0 || biomeTierMap[
      biome
      ].includes(prefabCandidate.meta.difficultyTier)

      if (!difficultyMatches) {
        return false
      }

      // Match biome, except for oldwest
      const biomeMatches =
        (prefabToReplace.meta.allowedTownships &&
          prefabToReplace.meta.allowedTownships.includes('oldwest')) ||
        prefabCandidate.meta.allowedBiomes.length === 0 ||
        prefabCandidate.meta.allowedBiomes.includes(biome)

      if (!biomeMatches) {
        return false
      }

      // Filter by white and blacklists
      const vanillaWhitelist = vanillaWhitelists[biome]
      const vanillaBlacklist = vanillaBlacklists[biome]
      const isVanillaPrefab =
        prefabCandidate.filePath.includes(vanillaPrefabsPath)

      let isAllowed = true
      if (isVanillaPrefab) {
        if (vanillaWhitelist) {
          isAllowed = vanillaWhitelist.some(entry =>
            prefabCandidate.name.includes(entry),
          )
        }

        if (vanillaBlacklists) {
          isAllowed = !vanillaBlacklist.some(entry =>
            prefabCandidate.name.includes(entry),
          )
        }
      }

      // if (!isAllowed && debugPrefabName === prefabCandidate.name) {
      //   console.log(
      //     `Dropped ${prefabCandidate.name} because of white or black list.`,
      //     {vanillaWhitelist, vanillaBlacklist},
      //   )
      // }

      return isAllowed
    },
  },
  {
    name: '3. Spawn traders only at POIMarkers tagged with trader or prefabs marked as trader area',
    filter: ({
      marker,
      prefabCandidate,
      prefabToReplace,
    }: FilterContext): boolean => {
      // Trader should only spawn at markers with tag trader
      if (
        (marker && marker.Tags && marker.Tags.includes('trader')) ||
        prefabToReplace.meta.isTrader
      ) {
        return prefabCandidate.meta.isTrader
      }

      return !prefabCandidate.meta.isTrader
    },
  },
  {
    name: '4. Filter by POIMarker tags. (Hint: Check if the tile and prefab share the same biomes, zones and townships. Also make sure a prefab exists with the defined POISpawn marker tag.)',
    filter: ({
      prefabCandidate,
      marker,
      isWilderness,
    }: FilterContext): boolean => {
      // Filter by marker tags if given
      if (!isWilderness && marker && marker.Tags && marker.Tags.length > 0) {
        return prefabCandidate.meta.tags.some(tag =>
          marker.Tags.includes(tag),
        )
      }

      // Drop parts for markers without tags
      if (marker && marker.Tags && marker.Tags.length === 0 && prefabCandidate.name.indexOf('part_') === 0) {
        return false
      }

      return true
    },
  },
  {
    name: '5. Filter by size. (Hint: That means none of the listed prefabs fit into the given socket/marker)',
    filter: ({
      isWilderness,
      marker,
      prefabCandidate,
      prefabToReplace,
      config: {markerSizeDifferenceMax},
    }: FilterContext): boolean => {
      // No size check for traders or wilderness pois
      if (isWilderness || prefabCandidate.meta.isTrader) {
        return true
      }

      // If we place markers, allow them do differ by X% in size
      if (marker && marker.Size) {
        const diffX = marker.Size.x - prefabCandidate.meta.PrefabSize.x
        const diffZ = marker.Size.z - prefabCandidate.meta.PrefabSize.z

        return (
          diffX >= 0 &&
          diffX <= Math.ceil(marker.Size.x * markerSizeDifferenceMax) &&
          diffZ >= 0 &&
          diffZ <= Math.ceil(marker.Size.z * markerSizeDifferenceMax)
        )
      }

      // non-wilderness non-markers (must be tiles) - have to be exact
      return (
        prefabToReplace.meta.PrefabSize.x ===
          prefabCandidate.meta.PrefabSize.x &&
        prefabToReplace.meta.PrefabSize.z === prefabCandidate.meta.PrefabSize.z
      )
    },
  },
  {
    name: '6. Filter by distance. (Hint: that means another copy of the same building is already spawned too close and no other option is available)',
    filter: ({
      prefabCandidate,
      biome,
      distanceMap,
      position,
      isWilderness,
      config: {distances},
    }: FilterContext): boolean => {
      // Exclude some from the distance check
      if (
        prefabCandidate.meta.isTile ||
        (biome === 'wasteland' &&
          (prefabCandidate.name.toLowerCase().includes('rubble') ||
            prefabCandidate.name.toLowerCase().includes('remnant')))
      ) {
        return true
      }

      let type = 'default'

      if (isWilderness) {
        type = 'wilderness'
      }

      if (prefabCandidate.meta.isTrader) {
        type = 'trader'
      }

      // Allow custom distance per tag
      const distanceTag = prefabCandidate.meta.tags.find(tag => Object.keys(distances).includes(tag))
      if (distanceTag) {
        type = distanceTag
      }

      const distance = distances[type]

      // Ensure minimum distance
      const positions = distanceMap.get(prefabCandidate.name) || []
      if (positions && positions.length > 0) {
        return Boolean(
          !positions?.find(p => p.manhattanDistanceTo(position) < distance),
        )
      }

      return true
    },
  },
]

export const filterPrefabs = (
  prefabToReplace: Prefab,
  prefabs: Map<string, Prefab>,
  filters: Filter[],
  filterContextData: FilterContextData,
): PrefabFilterResult => {
  let filteredPrefabs = [...prefabs.values()]
  let lastFilter: Filter | undefined

  let debugDropped = false
  for (const filter of filters) {
    const result = filteredPrefabs.filter(prefabCandidate => {
      const res = filter.filter({
        ...filterContextData,
        prefabToReplace,
        prefabCandidate,
      })
      if (
        !res &&
        (prefabCandidate.name === filterContextData.debugPrefabName ||
          prefabToReplace.name === filterContextData.debugSocketName)
      ) {
        console.log(
          `Dropped prefab '${prefabCandidate.name}' in filter '${
            filter.name
          }' because it does not match '${
            prefabToReplace.name
          }@${filterContextData.position.toArray().join(',')} (${
            filterContextData.marker &&
            filterContextData.marker?.Size.toArray().join(',')
          } in ${filterContextData.biome})'`,
        )
        debugDropped = true
      }

      return res
    })
    if (result.length === 0) {
      if (lastFilter === undefined) {
        return {
          success: false,
          reason: `Filter '${filter.name}' did not return any prefabs. This was the first filter. None of your (valid) prefabs match!`,
          prefabs: [],
        }
      }

      return {
        success: false,
        reason: `Filter '${filter.name}' did not return any prefabs. Last filter '${lastFilter.name}' returned ${filteredPrefabs.length} prefabs'.`,
        prefabs: filteredPrefabs,
      }
    }

    lastFilter = filter
    filteredPrefabs = result
  }

  if (!debugDropped && filterContextData.debugPrefabName) {
    console.log(
      `Success! Prefab '${filterContextData.debugPrefabName}' is a valid replacement for '${prefabToReplace.name}'`,
    )
  }

  if (filterContextData.debugSocketName === prefabToReplace.name) {
    console.log(
      `Success! Found '${filteredPrefabs.length}' potential replacements`,
    )
  }

  return {
    success: true,
    prefabs: filteredPrefabs,
  }
}
