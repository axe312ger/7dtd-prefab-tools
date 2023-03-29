/* eslint-disable complexity */
import * as path from 'node:path'
import * as fs from 'node:fs'
import {Vector3} from 'three'
import {parseStringPromise} from 'xml2js'
import fastGlob from 'fast-glob'
import expandTilde from 'expand-tilde'
import {ux} from '@oclif/core'

import {
  Prefab,
  POIMeta,
  POIMarker,
  PrefabXMLData,
  PrefabToolsConfig,
} from '../types'
import {groupBy, parseArrayValue} from './utils'

const getDimensions = (prefabData: PrefabXMLData): Vector3 => {
  const sizes: number[] = prefabData.PrefabSize.split(',').map(v =>
    Number.parseInt(v, 10),
  )
  return new Vector3(...sizes)
}

// const clearPath = (p: string) =>
//   p
//   .replace(localPrefabsPath, '[MODDED]')
//   .replace(vanillaPrefabsPath, '[VANILLA]')

export async function readPrefabsFromXMLs({
  vanillaPrefabsPath,
  additionalPrefabsPaths,
  socketBlacklist,
}: PrefabToolsConfig): Promise<{
  prefabsByName: Map<string, Prefab>;
  validPrefabsByName: Map<string, Prefab>;
}> {
  ux.action.start(
    'Locate, parse and normalize XML data for all prefabs',
  )

  // Locate all prefabs
  const globPatterns = [vanillaPrefabsPath, ...additionalPrefabsPaths].map(pattern =>
    path.join(expandTilde(pattern), '**', '*.xml').replace(/\\/g, '/'),
  )

  const files = await fastGlob(
    // Turns directory paths into an array of glob patterns that match all xml files recursively
    globPatterns,
    {
      onlyFiles: true,
      extglob: true,
      absolute: true,
    },
  )

  // Read and parse all prefabs
  const prefabsByName: Map<string, Prefab> = new Map()

  for await (const filePath of files) {
    const fileContent = fs.readFileSync(filePath)
    const data = await parseStringPromise(fileContent)

    if (!data.prefab) {
      console.log(`Unable to read file ${filePath}. Does this script have permission to read these files?`)
      continue
    }

    const prefabData: PrefabXMLData = {}

    for (const prop of data.prefab.property) {
      if (prop.$.name) {
        prefabData[prop.$.name] = prop.$.value
      }
    }

    try {
      getDimensions(prefabData)
    } catch {
      console.log(`SKIPPING: POI is missing dimensions/size: ${filePath}`)
      continue
    }

    const {name} = path.parse(filePath)
    const allowedTownships = parseArrayValue(prefabData.AllowedTownships)
    const isTile = name.indexOf('rwg_tile_') === 0
    const isTrader = prefabData.TraderArea.toLocaleLowerCase() === 'true'
    const meta: POIMeta = {
      PrefabSize: getDimensions(prefabData),
      zoning: parseArrayValue(prefabData.Zoning),
      allowedBiomes: parseArrayValue(prefabData.AllowedBiomes),
      allowedTownships,
      difficultyTier: Number.parseInt(prefabData.DifficultyTier, 10),
      RotationToFaceNorth: Number.parseInt(prefabData.RotationToFaceNorth, 10),
      YOffset: Number.parseInt(prefabData.YOffset, 10) || 0,
      isTrader,
      isTile,
      isWilderness: !isTrader && !name.includes('part_') && allowedTownships.includes('wilderness'),
      tags: parseArrayValue(prefabData.Tags),
    }

    // Extend biomes, townships and zones by matching tags
    const allTags = [
      ...meta.tags,
      ...(prefabData.EditorGroups ?
        parseArrayValue(prefabData.EditorGroups) :
        []),
      ...name.split('_'),
    ]

    meta.allowedBiomes.push(
      ...allTags.filter(tag =>
        ['snow', 'desert', 'wasteland', 'pine_forest', 'burnt_forest'].includes(
          tag,
        ),
      ),
    )
    meta.allowedTownships.push(
      ...allTags.filter(tag =>
        [
          'city',
          'wilderness',
          'town',
          'rural',
          'oldwest',
          'fabbersville',
          'countrytown',
        ].includes(tag),
      ),
    )

    // Improve placement, allow everything in towns also in country towns
    // if (
    //   meta.allowedTownships.includes(`town`) &&
    //   !meta.allowedTownships.includes(`countrytown`)
    // ) {
    //   meta.allowedTownships.push(`countrytown`)
    // }

    if (name.includes('rwg_tile_oldwest_')) {
      meta.allowedTownships.push('oldwest')
    }

    meta.zoning.push(
      ...allTags.filter(tag =>
        [
          'downtown',
          'residential',
          'commercial',
          'residentialold',
          'residentialnew',
          'industrial',
          'rural',
          'countryresidential',
        ].includes(tag),
      ),
    )

    if (meta.zoning.length > 0) {
      // Merge residentialold and residentialnew into residental
      meta.zoning = meta.zoning.map(z =>
        ['residentialold', 'residentialnew'].includes(z) ? 'residential' : z,
      )
    }

    meta.allowedBiomes = [
      ...new Set(meta.allowedBiomes.filter(v => !['any'].includes(v))),
    ]
    meta.zoning = [
      ...new Set(
        meta.zoning.filter(v => !['none', 'nozone', 'any'].includes(v)),
      ),
    ]
    meta.allowedTownships = [
      ...new Set(meta.allowedTownships.filter(v => !['none'].includes(v))),
    ]

    if (prefabData.POIMarkerStart) {
      const markers = prefabData.POIMarkerStart.split('#')
      const sizes = prefabData.POIMarkerSize.split('#')
      const types = prefabData.POIMarkerType.split(',')
      const parts = prefabData.POIMarkerPartToSpawn.split(',')
      const rotation = prefabData.POIMarkerPartRotations.split(',').map(v =>
        Number.parseInt(v, 10),
      )
      const chance = prefabData.POIMarkerPartSpawnChance.split(',').map(v =>
        Number.parseFloat(v),
      )
      const rawGroups = prefabData.POIMarkerGroup.split(',')
      const tags = prefabData.POIMarkerTags.split('#')

      // Turn marker information arrays into a list of marker objects
      const markersList: POIMarker[] = markers.map((marker, i) => ({
        Start: new Vector3(
          ...marker.split(',').map(v => Number.parseInt(v, 10)),
        ),
        Size: new Vector3(
          ...sizes[i].split(',').map(v => Number.parseInt(v, 10)),
        ),
        Type: types[i],
        Group: rawGroups[i],
        Tags: (tags[i] || '')
        .split(',')
        .map(v => v.trim())
        .filter(v => Boolean(v)),
        PartToSpawn: parts[i],
        PartRotation: rotation[i],
        PartSpawnChance: chance[i],
      }))

      meta.markers = markersList
      const {groups, order} = groupBy(
        markersList.sort(
          (a: POIMarker, b: POIMarker) => a.Type.localeCompare(b.Type) * -1,
        ),
        'Group',
      )
      meta.markerGroupsOrder = [...order.values()]
      meta.markerGroups = groups
    }

    // Drop tiles without spawners (vanilla... OMG why...)
    if (isTile && !meta.markers?.some(marker => marker.Type === 'POISpawn')) {
      console.log(
        `SKIPPING: rwg_tile ${name} does not have any POI spawers assigned.`,
      )
      continue
    }

    if (isTile) {
      meta.tileType = name
      .split('_')
      .find(segment =>
        [
          'intersection',
          'straight',
          'gateway',
          'corner',
          'cap',
          't',
        ].includes(segment),
      )

      meta.tilePattern = name
      .split('_')
      .find(segment =>
        [
          'downtown',
          'residential',
          'commercial',
          'industrial',
          'rural',
          'countryresidential',
          'oldwest',
          'gateway',
        ].includes(segment),
      )
    }

    const prefab: Prefab = {filePath, name, prefabData, meta}

    prefabsByName.set(name.toLocaleLowerCase(), prefab)
  }

  const validPrefabsByName: Map<string, Prefab> = new Map()
  for (const prefab of prefabsByName.values()) {
    if (
      !(
        // prefab.name.indexOf('part_') === 0 ||
        prefab.name.indexOf('AAA_') === 0 ||
        prefab.name.indexOf('000_') === 0 ||
        // prefab.name.indexOf("rwg_tile_oldwest_") === 0 ||
        // prefab.meta.tags.includes('part') ||
        prefab.meta.tags.includes('testonly') ||
        prefab.meta.tags.includes('test') ||
        prefab.meta.tags.includes('navonly') ||
        prefab.meta.zoning.includes('biomeonly') ||
        prefab.filePath.includes('Player Creations') ||
        socketBlacklist.includes(prefab.name)
      )
    ) {
      validPrefabsByName.set(prefab.name.toLocaleLowerCase(), prefab)
    }
  }

  ux.action.stop()
  return {prefabsByName, validPrefabsByName}
}
