import {Command} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import cloneDeep from 'clone-deep'
import {Builder} from 'xml2js'
import {Vector3} from 'three'

import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {initConfig} from '../utils/config'
import {loadDecorations} from '../utils/load-decorations'
import {filterPOIMarkers} from '../utils/filter-poi-markers'
import {spawnPOI} from '../utils/place-prefabs'
import {MapHelper} from '../utils/map-helper'
import {Decoration, Prefab} from '../types'

export default class Populate extends Command {
  static description = 'Populate all empty tiles in a prefab.xml'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath} = config

    const builder = new Builder()
    const xml = await readFile(prefabsPath, 'utf8')
    const decorations = await loadDecorations(xml)
    const prefabs = await readPrefabsFromXMLs(config)
    const mapHelper = new MapHelper(config)
    await mapHelper.loadImages()

    const distanceMap: Map<string, Vector3[]> = new Map()

    // Based on our existing decorations from prefabs.xml, we filter out everything thats a socket OR a "random" wilderness POI
    const sockets = filterPOIMarkers(decorations, prefabs.prefabsByName)

    const prefabCounter: Map<string, number> = new Map()
    for (const prefabKey of prefabs.validPrefabsByName.keys()) {
      prefabCounter.set(prefabKey.toLocaleLowerCase(), 0)
    }

    const socketsWithMarkers: Decoration[] = []
    for (const [i, socket] of sockets.entries()) {
      const socketPrefab: Prefab | undefined = cloneDeep(
        prefabs.prefabsByName.get(socket.name.toLocaleLowerCase()),
      )
      if (!socketPrefab) {
        throw new Error(
          `Unable to locate prefab for socket ${JSON.stringify(socket)}`,
        )
      }

      if (
        socket.guessedZone &&
      !socketPrefab.meta.zoning.includes(socket.guessedZone)
      ) {
        socketPrefab.meta.zoning.push(socket.guessedZone)
      }

      if (
        socket.guessedTownship &&
      !socketPrefab.meta.allowedTownships.includes(socket.guessedTownship)
      ) {
        socketPrefab.meta.allowedTownships.push(socket.guessedTownship)
      }

      console.log(`Spawning ${socketPrefab.name} (${i}/${sockets.length - 1})`)

      const spawned = spawnPOI(
        mapHelper,
        socket.position,
        socket.rotation,
        socketPrefab,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        distanceMap,
        socketPrefab,
        prefabCounter,
        config,
      )
      spawned[0].zoning = socketPrefab.meta.zoning.join(',')
      spawned[0].allowedTownships = socketPrefab.meta.allowedTownships.join(',')
      spawned[0].isWilderness = socketPrefab.meta.isWilderness

      socketsWithMarkers.push(...spawned)
    }

    const newDecorations = {
      prefabs: socketsWithMarkers.map(decoration => ({
        decoration: {
          $: {
            type: 'model',
            name: decoration.name,
            position: decoration.position
            .toArray()
            .map(v => Math.round(v))
            .join(','),
            rotation: decoration.rotation,
            zones: decoration.zoning,
            townships: decoration.allowedTownships,
            biome: mapHelper.getBiomeForPosition(decoration.position),
          },
        },
      })),
    }

    const newXml = builder.buildObject(newDecorations)
    const xmlPath = resolve(
      dirname(prefabsPath),
      'prefabs-populated.xml',
    )
    await writeFile(xmlPath, `\uFEFF${newXml.replace(/"\/>/g, '" />')}`, {
      encoding: 'utf8',
    })

    console.log(`Finished! Wrote new ${xmlPath}`)
  }
}

