/* eslint-disable complexity */
/* eslint-disable max-params */
/* eslint-disable no-case-declarations */
import {randomInt} from 'node:crypto'
import {Vector3} from 'three'
import * as Jimp from 'jimp'
import {RANDOM_POI_NAME, SKIPPED_POI_NAME} from '../const'
import {getHeightForPosition} from './pixel-data'
import {defaultPrefabFilters, filterPrefabs} from './filter-prefabs'
import {getRandomPrefab} from './select-prefabs'
import {Prefab, Decoration, POIMarker, PrefabToolsConfig} from '../types'

export function calcRotation(
  initialRotation: number,
  RotationToFaceNorth: number,
  markerRotation: number,
):number {
  // if (markerRotation === 1) {
  //   markerRotation = 3
  // } else if (markerRotation === 3) {
  //   markerRotation = 1
  // }
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
  mainPOIRotation: number,
  mainPOIPosition: Vector3,
  socketPrefab: Prefab,
  marker: POIMarker,
): { position: Vector3; rotation: number } {
  const rotation = calcRotation(
    mainPOIRotation, // or first prefab rotation
    socketPrefab.meta.RotationToFaceNorth,
    marker.PartRotation,
  )
  const rotatedMarker = marker.Start.clone().applyAxisAngle(
    new Vector3(0, 1, 0),
    (Math.PI / 2) * mainPOIRotation,
  )

  const position = mainPOIPosition.clone()
  const newMarker = marker.Start.clone()

  switch (mainPOIRotation) {
  case 0:
    position.add(rotatedMarker)
    break
  case 1:
    const newZ = newMarker.x
    const modifierX =
        marker.PartRotation % 2 ?
          marker.Size.x :
          marker.Size.z
    newMarker.x = marker.Size.z - newMarker.z - modifierX
    newMarker.z = newZ
    position.add(newMarker)
    break

  case 3:
    const newX = newMarker.z
    const modifierZ =
        marker.PartRotation % 2 ?
          marker.Size.z :
          marker.Size.x
    newMarker.z = marker.Size.x - newMarker.x - modifierZ
    newMarker.x = newX
    position.add(newMarker)

    break
  case 2:
    const sizeX =
        marker.PartRotation % 2 ?
          marker.Size.z :
          marker.Size.x
    const sizeZ =
        marker.PartRotation % 2 ?
          marker.Size.x :
          marker.Size.z
    position
    .add(new Vector3(marker.Size.x, 0, marker.Size.z))
    .add(rotatedMarker)
    .sub(new Vector3(sizeX, 0, sizeZ))
  }

  return {rotation, position}
}

export function spawnPOIMarkers(
  mainPOIPosition: Vector3,
  mainPOIRotation: number,
  prefab: Prefab,
  prefabsByName: Map<string, Prefab>,
  validPrefabsByName: Map<string, Prefab>,
  biome: string,
  distanceMap: Map<string, Vector3[]>,
  socketPrefab: Prefab,
  prefabCounter: Map<string, number>,
  config: PrefabToolsConfig,
  testRun?: boolean,
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

    let markerPOI = prefabsByName.get(marker.PartToSpawn.toLocaleLowerCase())

    if (!isRandom) {
      // Check if named prefab is valid
      if (testRun && markerPOI && marker.Type === 'POISpawn') {
        const filterResult = filterPrefabs(
          markerPOI,
          validPrefabsByName,
          defaultPrefabFilters,
          {
            distanceMap,
            position: mainPOIPosition,
            biome,
            marker,
            isWilderness: false,
            // YOU PROBABLY WANT TO CHECK RANDOM SPAWNS BELOW!!!
            // debugPrefabName: "xcostum_Origami_Gallery(by_Pille_TopMinder)",
            config,
          },
        )
        if (!filterResult.success || !markerPOI) {
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

      const filterResult = filterPrefabs(
        markerGhostPrefab,
        validPrefabsByName,
        defaultPrefabFilters,
        {
          distanceMap,
          position: mainPOIPosition,
          biome,
          marker,
          isWilderness: false,
          // debugPrefabName: "xcostum_Origami_Gallery(by_Pille_TopMinder)",
          config,
        },
      )

      if (!filterResult.success) {
        if (testRun) {
          throw new Error(
            `Unable to find matching prefab for marker. Failing testrun.\n${JSON.stringify(
              marker,
              null,
              2,
            )}`,
          )
        }

        console.log(
          `Unable to find valid POI for marker in ${socketPrefab.name}:`,
          marker,
          filterResult.reason,
          biome,
          '\nPrefabs candidates that filtered to zero:\n',
          filterResult.prefabs.map(p => p.name).join('\n'),
        )

        continue
      }

      const randomReplacement = getRandomPrefab(
        markerGhostPrefab,
        socketPrefab,
        biome,
        mainPOIPosition,
        filterResult.prefabs,
        prefabCounter,
      )

      if (randomReplacement === SKIPPED_POI_NAME) {
        continue
      }

      markerPOI = randomReplacement
    }

    if (!markerPOI) {
      throw new Error(
        `unable to find marker: ${marker.PartToSpawn} in:\n${JSON.stringify(
          {prefab, mainPOIPosition, mainPOIRotation},
          null,
          2,
        )}`,
      )
    }

    // Take care of spawn chance
    const shouldSpawn = randomInt(1, 100) <= marker.PartSpawnChance * 100
    if (!shouldSpawn) {
      continue
    }

    // Calculate marker position
    const {position, rotation} = calculateMarkerPosition(
      mainPOIRotation, mainPOIPosition, socketPrefab, marker,
    )

    if (marker.Type === 'POISpawn') {
      position.add(new Vector3(0, markerPOI.meta.YOffset, 0))
    }

    const markerDecoration: Decoration = {
      name: markerPOI.name,
      position,
      rotation,
    }
    markers.push(markerDecoration)

    if (!testRun) {
      addToDistanceMap(distanceMap, markerDecoration)
      prefabCounter.set(
        markerDecoration.name.toLocaleLowerCase(),
        (prefabCounter.get(markerDecoration.name) || 0) + 1,
      )
    }

    // If we just spawned a POI, spawn its markers as well
    if (marker.Type === 'POISpawn') {
      markers.push(
        ...spawnPOIMarkers(
          position,
          rotation,
          markerPOI,
          prefabsByName,
          validPrefabsByName,
          biome,
          distanceMap,
          socketPrefab,
          prefabCounter,
          config,
        ),
      )
    }
  }

  return markers
}

export function translatePositionAndRotation(
  position: Vector3,
  rotation: number,
  prefab: Prefab,
  heightMapImage: Jimp,
  config: PrefabToolsConfig,
): { mainPOIPosition:Vector3, mainPOIRotation: number } {
  const neutralRotation = calcRotation(
    rotation,
    prefab.meta.RotationToFaceNorth * -1,
    0,
  )

  const correctedHeight = getHeightForPosition(
    position,
    prefab.meta.PrefabSize,
    rotation,
    heightMapImage,
    config,
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
  position: Vector3,
  rotation: number,
  prefab: Prefab,
  prefabsByName: Map<string, Prefab>,
  validPrefabsByName: Map<string, Prefab>,
  biome: string,
  distanceMap: Map<string, Vector3[]>,
  heightMapImage: Jimp,
  socketPrefab: Prefab,
  prefabCounter: Map<string, number>,
  config: PrefabToolsConfig,
  testRun?: boolean,
): Decoration[] {
  const {mainPOIPosition, mainPOIRotation} = translatePositionAndRotation(
    position,
    rotation,
    prefab,
    heightMapImage,
    config,
  )
  const decorations: Decoration[] = []
  const mainDecoration: Decoration = {
    name: prefab.name,
    position: mainPOIPosition,
    rotation: mainPOIRotation,
  }
  decorations.push(mainDecoration)

  if (!testRun) {
    addToDistanceMap(distanceMap, mainDecoration)

    prefabCounter.set(
      prefab.name.toLocaleLowerCase(),
      (prefabCounter.get(prefab.name.toLocaleLowerCase()) || 0) + 1,
    )
  }

  // Spawn poi markers
  const markers = spawnPOIMarkers(
    mainPOIPosition,
    mainPOIRotation,
    prefab,
    prefabsByName,
    validPrefabsByName,
    biome,
    distanceMap,
    socketPrefab,
    prefabCounter,
    config,
    testRun,
  )

  decorations.push(...markers)

  return decorations
}
