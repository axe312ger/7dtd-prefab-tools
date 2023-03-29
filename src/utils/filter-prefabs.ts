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
  ) => true | string;
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
    FilterContext): true | string => {
      // Do not mix tiles and non tiles
      if (prefabToReplace.meta.isTile !== prefabCandidate.meta.isTile) {
        return 'tiles should not be replaced by POIs and vise versa'
      }

      if (
        prefabCandidate.meta.isTile &&
        prefabToReplace.name !== prefabCandidate.name &&
        config.socketBlacklist.some(item => prefabCandidate.name.toLocaleLowerCase().includes(item))
      ) {
        return 'this socket is blacklisted and wont spawn as replacement'
      }

      if (prefabToReplace.meta.isTile) {
        // Tiles must share the same type/zone
        if (
          prefabToReplace.meta.tileType &&
            prefabCandidate.meta.tileType &&
            prefabToReplace.meta.tileType !== prefabCandidate.meta.tileType
        ) {
          return `tile does not match the correct type/zone (${prefabToReplace.meta.tileType})`
        }

        // Ensure not to mix roat pattern (straight, corner, t, ...)
        if (
          prefabToReplace.meta.tilePattern !==
            prefabCandidate.meta.tilePattern
        ) {
          return `is tile but tile road pattern mismatches (${prefabToReplace.meta.tilePattern})`
        }

        return true
      }

      if (isWilderness) {
        return prefabCandidate.meta.isWilderness ?
          true :
          'both need to be wilderness'
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
          return `zones mismatch - has: ${prefabCandidate.meta.zoning.join(
            ', ',
          )} - need: ${prefabToReplace.meta.zoning.join(', ')}`
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
          return 'township mismatch'
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
      config: {prefabBlacklists, prefabWhitelists, biomeTierMap},
      marker,
    }: FilterContext): true | string => {
      // Skip check if marker is filtered by tags
      if (marker && marker.Tags && marker.Tags.length > 0) {
        return true
      }

      // Mach by difficulty tier
      const difficultyMatches =
        prefabCandidate.meta.difficultyTier === 0 ||
        biomeTierMap[biome].includes(prefabCandidate.meta.difficultyTier)

      if (!difficultyMatches) {
        return 'difficulty mismatch'
      }

      // Match biome, except for oldwest
      const biomeMatches =
        (prefabToReplace.meta.allowedTownships &&
          prefabToReplace.meta.allowedTownships.includes('oldwest')) ||
        prefabCandidate.meta.allowedBiomes.length === 0 ||
        prefabCandidate.meta.allowedBiomes.includes(biome)

      if (!biomeMatches) {
        // whitelist overrules biome filter
        const prefabWhitelist = prefabWhitelists[biome]
        if (!prefabWhitelist) {
          return 'biome mismatch'
        }

        if (
          !prefabWhitelist.some(entry => prefabCandidate.name.includes(entry))
        ) {
          return `biome mismatch and not included in ${biome} whitelist`
        }
      }

      // Blacklists
      const prefabBlacklist = prefabBlacklists[biome]

      if (
        prefabBlacklist &&
        prefabBlacklist.some(entry => prefabCandidate.name.includes(entry))
      ) {
        return `included in ${biome} blacklist`
      }

      return true
    },
  },
  {
    name: '3. Spawn traders only at POIMarkers tagged with trader or prefabs marked as trader area',
    filter: ({
      marker,
      prefabCandidate,
      prefabToReplace,
    }: FilterContext): true | string => {
      // Trader should only spawn at markers with tag trader
      if (
        (marker && marker.Tags && marker.Tags.includes('trader')) ||
        prefabToReplace.meta.isTrader
      ) {
        return prefabCandidate.meta.isTrader ? true : 'trader'
      }

      return prefabCandidate.meta.isTrader ? 'trader' : true
    },
  },
  {
    name: '4. Filter by POIMarker tags. (Hint: Check if the tile and prefab share the same biomes, zones and townships. Also make sure a prefab exists with the defined POISpawn marker tag.)',
    filter: ({
      prefabCandidate,
      marker,
      isWilderness,
    }: FilterContext): true | string => {
      // Filter by marker tags if given
      if (!isWilderness && marker && marker.Tags && marker.Tags.length > 0) {
        return prefabCandidate.meta.tags.some(tag =>
          marker.Tags.includes(tag),
        ) ?
          true :
          'marker tag'
      }

      // Drop parts for markers without tags
      if (
        marker &&
        marker.Tags &&
        marker.Tags.length === 0 &&
        prefabCandidate.name.indexOf('part_') === 0
      ) {
        return 'marker tag2'
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
    }: FilterContext): true | string => {
      // No size check for traders or wilderness pois
      if (isWilderness || prefabCandidate.meta.isTrader) {
        return true
      }

      // If we place markers, allow them do differ by X% in size
      if (marker && marker.Size) {
        let res: true | string = 'size mismatch'
        for (const [x, z] of [
          [
            prefabCandidate.meta.PrefabSize.x,
            prefabCandidate.meta.PrefabSize.z,
          ],
          [
            prefabCandidate.meta.PrefabSize.z,
            prefabCandidate.meta.PrefabSize.x,
          ],
        ]) {
          const diffX = marker.Size.x - x
          const diffZ = marker.Size.z - z

          if (
            diffX >= 0 &&
            diffX <= Math.ceil(marker.Size.x * markerSizeDifferenceMax) &&
            diffZ >= 0 &&
            diffZ <= Math.ceil(marker.Size.z * markerSizeDifferenceMax)
          ) {
            res = true
          }
        }

        return res
      }

      // non-wilderness non-markers (must be tiles) - have to be exact
      return prefabToReplace.meta.PrefabSize.x ===
        prefabCandidate.meta.PrefabSize.x &&
        prefabToReplace.meta.PrefabSize.z === prefabCandidate.meta.PrefabSize.z ?
        true :
        'size'
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
    }: FilterContext): true | string => {
      // Exclude some from the distance check
      if (
        prefabCandidate.meta.isTile ||
        prefabCandidate.name.toLocaleLowerCase().indexOf('part_') === 0 ||
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
      const distanceTag = prefabCandidate.meta.tags.find(tag =>
        Object.keys(distances).includes(tag),
      )
      if (distanceTag) {
        type = distanceTag
      }

      const minimumDistance = distances[type]

      // Ensure minimum distance
      const positions = distanceMap.get(prefabCandidate.name) || []
      if (positions && positions.length > 0) {
        return positions?.some(
          p => p.manhattanDistanceTo(position) < minimumDistance,
        ) ?
          'distance to low to POI of same type' :
          true
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
        res !== true &&
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
          } in ${filterContextData.biome})' Reason: ${res}`,
        )
        debugDropped = true
      }

      return res === true
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
        reason: `Filter '${filter.name}' did not return any prefabs.\nLast filter '${lastFilter.name}' returned ${filteredPrefabs.length} prefabs'.`,
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
