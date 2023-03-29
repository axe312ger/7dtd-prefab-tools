/* eslint-disable complexity */
/* eslint-disable max-params */
/* eslint-disable no-case-declarations */
import {randomInt} from 'node:crypto'
import {Vector3} from 'three'
import {RANDOM_POI_NAME, SKIPPED_POI_NAME} from '../const'
import {defaultPrefabFilters, filterPrefabs} from './filter-prefabs'
import {getRandomPrefab} from './select-prefabs'
import {Prefab, Decoration, POIMarker, PrefabToolsConfig} from '../types'
import {MapHelper} from './map-helper'

export function calcRotation(
  initialRotation: number,
  RotationToFaceNorth: number,
  markerRotation: number,
): number {
  return (markerRotation + RotationToFaceNorth + initialRotation) % 4
}

export function getPrefabForRandomMarker(
  prefab: Prefab,
  marker: POIMarker,
): Prefab {
  return {
    filePath: RANDOM_POI_NAME,
    name: RANDOM_POI_NAME,
    meta: {
      ...prefab.meta,
      PrefabSize: marker.Size,
      zoning: prefab.meta.zoning,
      allowedTownships: prefab.meta.allowedTownships,
      allowedBiomes: prefab.meta.allowedBiomes,
      tags: marker.Tags || prefab.meta.tags,
      isTile: false,
      isWilderness: false,
    },
    prefabData: {},
  }
}

export function calculateMarkerPosition(
  socketDecoPOIRotation: number,
  socketDecoPOIPosition: Vector3,
  socketPrefab: Prefab,
  marker: POIMarker,
): Vector3 {
  const rotatedMarker = marker.Start.clone().applyAxisAngle(
    new Vector3(0, 1, 0),
    (Math.PI / 2) * socketDecoPOIRotation,
  )

  const position = socketDecoPOIPosition.clone()
  const newMarker = marker.Start.clone()

  switch (socketDecoPOIRotation) {
  case 0:
    position.add(rotatedMarker)
    break
  case 1:
    const newZ = newMarker.x
    const modifierX =
        socketDecoPOIRotation % 2 ? marker.Size.z : marker.Size.x
    const startX =
        socketDecoPOIRotation % 2 ? marker.Start.z : marker.Start.x
    newMarker.x = socketPrefab.meta.PrefabSize.z - startX - modifierX
    newMarker.z = newZ
    position.add(newMarker)
    break

  case 3:
    const newX = newMarker.z
    const modifierZ =
        socketDecoPOIRotation % 2 ? marker.Size.x : marker.Size.z
    const startZ =
        socketDecoPOIRotation % 2 ? marker.Start.x : marker.Start.z
    newMarker.z = socketPrefab.meta.PrefabSize.x - startZ - modifierZ
    newMarker.x = newX
    position.add(newMarker)

    break
  case 2:
    const sizeX = socketDecoPOIRotation % 2 ? marker.Size.z : marker.Size.x
    const sizeZ = socketDecoPOIRotation % 2 ? marker.Size.x : marker.Size.z
    position
    .add(
      new Vector3(
        socketPrefab.meta.PrefabSize.x,
        0,
        socketPrefab.meta.PrefabSize.z,
      ),
    )
    .add(rotatedMarker)
    .sub(new Vector3(sizeX, 0, sizeZ))
  }

  return position
}

export function calculateMarkerRotation(
  socketDecoPOIRotation: number,
  markerPrefab: Prefab,
  marker: POIMarker,
): number {
  let rotation = calcRotation(
    socketDecoPOIRotation, // or first prefab rotation
    markerPrefab.meta.RotationToFaceNorth,
    marker.PartRotation,
  )

  if (marker.Type === 'PartSpawn' && marker.PartRotation % 2 === 1) {
    rotation = (rotation + 2) % 4
  }

  return rotation
}

export function spawnPOIMarkers(
  mainPOIPosition: Vector3,
  mainPOIRotation: number,
  prefab: Prefab,
  prefabsByName: Map<string, Prefab>,
  validPrefabsByName: Map<string, Prefab>,
  mapHelper: MapHelper,
  distanceMap: Map<string, Vector3[]>,
  socketPrefab: Prefab,
  prefabCounter: Map<string, number>,
  config: PrefabToolsConfig,
  debugPrefabName?: string,
  testRun?: boolean,
  forceSpawnProbability?: boolean,
): Decoration[] {
  if (!prefab.meta.markers) {
    return []
  }

  const markers: Decoration[] = []
  for (const marker of prefab.meta.markers) {
    if (['RoadExit', 'None'].includes(marker.Type)) {
      // @todo should we spawn the road exists here now?
      continue
    }

    const isRandom = !marker.PartToSpawn || marker.PartToSpawn.length === 0

    let markerPrefab = prefabsByName.get(
      marker.PartToSpawn.toLocaleLowerCase(),
    )

    const position = calculateMarkerPosition(
      mainPOIRotation,
      mainPOIPosition,
      prefab,
      marker,
    )

    if (!isRandom) {
      // Check if named prefab is valid
      if (testRun && markerPrefab && marker.Type === 'POISpawn') {
        const filterResult = filterPrefabs(
          markerPrefab,
          validPrefabsByName,
          defaultPrefabFilters,
          {
            distanceMap,
            position,
            biome: mapHelper.getBiomeForPosition(mainPOIPosition),
            marker,
            isWilderness: false,
            // YOU PROBABLY WANT TO CHECK RANDOM SPAWNS BELOW!!!
            // debugPrefabName: "xcostum_Origami_Gallery(by_Pille_TopMinder)",
            // debugPrefabName: 'oldwest_business_03',
            config,
          },
        )
        if (!filterResult.success || !markerPrefab) {
          throw new Error(
            `Unable to spawn named marker prefab.\n${JSON.stringify(
              marker,
              null,
              2,
            )}`,
          )
        }
      }
    } else if (marker.Type === 'POISpawn') {
      // Find random POI for marker, included ones filtered by tags
      const markerGhostPrefab = getPrefabForRandomMarker(prefab, marker)
      const biome = mapHelper.getBiomeForPosition(position)

      const filterResult = filterPrefabs(
        markerGhostPrefab,
        validPrefabsByName,
        defaultPrefabFilters,
        {
          distanceMap,
          position,
          biome,
          marker,
          isWilderness: false,
          // debugPrefabName: "xcostum_Origami_Gallery(by_Pille_TopMinder)",
          debugPrefabName,
          config,
        },
      )

      if (!filterResult.success) {
        if (testRun) {
          throw new Error(
            `Unable to find a matching prefab for the following marker in ${
              socketPrefab.name
            }:\n${JSON.stringify(marker, null, 2)}`,
          )
        }

        console.log(
          `Unable to find valid POI for marker in ${socketPrefab.name}:`,
          marker,
          filterResult.reason,
          biome,
          '\nPrefabs candidates that filtered to zero:\n',
          filterResult.prefabs
          .map(p =>
            [
              p.name,
              `${p.meta.PrefabSize.x}x${p.meta.PrefabSize.z}`,
              p.meta.allowedBiomes.join(', '),
              p.meta.allowedTownships.join(', '),
              p.meta.zoning.join(', '),
            ].join(' '),
          )
          .join('\n'),
        )

        continue
      }

      const randomReplacement = getRandomPrefab(
        markerGhostPrefab,
        socketPrefab,
        biome,
        position,
        filterResult.prefabs,
        prefabCounter,
      )

      if (randomReplacement === SKIPPED_POI_NAME) {
        continue
      }

      markerPrefab = randomReplacement
    }

    if (!markerPrefab) {
      throw new Error(
        `unable to find marker: ${marker.PartToSpawn} in:\n${JSON.stringify(
          {prefab, mainPOIPosition, mainPOIRotation},
          null,
          2,
        )}`,
      )
    }

    // Take care of spawn chance
    const shouldSpawn =
      forceSpawnProbability || randomInt(1, 100) <= marker.PartSpawnChance * 100

    if (!shouldSpawn) {
      continue
    }

    // Calculate marker position
    const rotation = calculateMarkerRotation(
      mainPOIRotation,
      markerPrefab,
      marker,
    )

    // console.log({name: markerPOI.name, markerPOIRot: markerPOI.meta.RotationToFaceNorth, rotation})

    if (marker.Type === 'POISpawn') {
      position.add(new Vector3(0, markerPrefab.meta.YOffset, 0))
    }

    const markerDecoration: Decoration = {
      name: markerPrefab.name,
      position,
      rotation,
    }
    markers.push(markerDecoration)

    // If we just spawned a POI, spawn its markers as well
    if (markerPrefab.meta.markers?.length !== 0) {
      markers.push(
        ...spawnPOIMarkers(
          position,
          rotation,
          markerPrefab,
          prefabsByName,
          validPrefabsByName,
          mapHelper,
          distanceMap,
          socketPrefab,
          prefabCounter,
          config,
          debugPrefabName,
          testRun,
          forceSpawnProbability,
        ),
      )
    }
  }

  return markers
}

export function translateSocketPositionAndRotation(
  position: Vector3,
  rotation: number,
  prefab: Prefab,
  mapHelper: MapHelper,
): { mainPOIPosition: Vector3; mainPOIRotation: number } {
  const neutralRotation = calcRotation(
    rotation,
    prefab.meta.RotationToFaceNorth * -1,
    0,
  )

  const correctedHeight = mapHelper.getHeightForPosition(
    position,
    prefab.meta.PrefabSize,
    rotation,
  )

  const neutralPosition = position
  .clone()
  .setComponent(1, correctedHeight)
  .clone()

  const mainPOIPosition = neutralPosition
  .clone()
  .add(new Vector3(0, prefab.meta.YOffset, 0))
  const mainPOIRotation = calcRotation(
    neutralRotation,
    prefab.meta.RotationToFaceNorth,
    0,
  )

  return {mainPOIPosition, mainPOIRotation}
}

export const addToDistanceMap = (
  distanceMap: Map<string, Vector3[]>,
  decoration: Decoration,
): void => {
  decoration.name.indexOf('part_') !== 0 &&
    distanceMap.set(decoration.name, [
      ...(distanceMap.get(decoration.name) || []),
      decoration.position,
    ])
}

export function spawnPOI(
  mapHelper: MapHelper,
  position: Vector3,
  rotation: number,
  prefab: Prefab,
  prefabsByName: Map<string, Prefab>,
  validPrefabsByName: Map<string, Prefab>,
  distanceMap: Map<string, Vector3[]>,
  prefabCounter: Map<string, number>,
  config: PrefabToolsConfig,
  debugPrefabName?: string,
  testRun?: boolean,
  forceSpawnProbability?: boolean,
): Decoration[] {
  const {mainPOIPosition, mainPOIRotation} =
    translateSocketPositionAndRotation(position, rotation, prefab, mapHelper)
  const decorations: Decoration[] = []
  const mainDecoration: Decoration = {
    name: prefab.name,
    position: mainPOIPosition,
    rotation: mainPOIRotation,
  }
  decorations.push(mainDecoration)

  // Spawn poi markers
  const markers = spawnPOIMarkers(
    mainPOIPosition,
    mainPOIRotation,
    prefab,
    prefabsByName,
    validPrefabsByName,
    mapHelper,
    distanceMap,
    prefab,
    prefabCounter,
    config,
    debugPrefabName,
    testRun,
    forceSpawnProbability,
  )

  decorations.push(...markers)

  for (const decoration of [mainDecoration, ...markers]) {
    addToDistanceMap(distanceMap, decoration)
    const name = decoration.name.toLocaleLowerCase()

    prefabCounter.set(
      name,
      (prefabCounter.get(name) || 0) + 1,
    )
  }

  return decorations
}
