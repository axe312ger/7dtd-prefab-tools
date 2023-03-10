import {Args, Command} from '@oclif/core'

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
import {getRandomPrefab} from '../utils/select-prefabs'
import {defaultPrefabFilters, filterPrefabs} from '../utils/filter-prefabs'
import {SKIPPED_POI_NAME} from '../const'

export default class Populate extends Command {
  static description = 'Populate all empty tiles in a prefab.xml';

  static examples = ['<%= config.bin %> <%= command.id %>'];
  static args = {
    debugPrefabName: Args.string({
      description: 'Output why a prefab is excluded from being spawned in a POI marker',
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath} = config

    const {args} = await this.parse(Populate)
    const {debugPrefabName} = args

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
    const counters = {
      spawned: 0,
      replaced: 0,
      errors: 0,
    }
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

      let spawned: Decoration[]
      const biome = mapHelper.getBiomeForPosition(socket.position)
      try {
        if (socketPrefab.meta.isTile && !socketPrefab.meta.isTrader) {
          const filterResult = filterPrefabs(
            socketPrefab,
            prefabs.validPrefabsByName,
            defaultPrefabFilters,
            {
              distanceMap,
              position: socket.position,
              isWilderness: false,
              // debugPrefabName: "XXX",
              biome,
              config,
            },
          )
          if (
            filterResult.success === false ||
            !filterResult.prefabs.some(
              prefab => prefab.name === socketPrefab.name,
            )
          ) {
            throw new Error('Prefab is not allowed to spawn here')
          }
        }

        // Spawn and throw error when marker can not be spawned
        spawned = spawnPOI(
          mapHelper,
          socket.position,
          socket.rotation,
          socketPrefab,
          prefabs.prefabsByName,
          prefabs.validPrefabsByName,
          distanceMap,
          prefabCounter,
          config,
          debugPrefabName,
          true,
        )

        console.log(
          `Spawned ${socketPrefab.name} (${i}/${sockets.length - 1})`,
        )
        counters.spawned++
      } catch (error) {
        const filterResult = filterPrefabs(
          socketPrefab,
          prefabs.validPrefabsByName,
          defaultPrefabFilters,
          {
            distanceMap,
            position: socket.position,
            isWilderness: false,
            // debugPrefabName: 'oldwest_business_03',
            biome,
            config,
          },
        )

        const replacement = getRandomPrefab(
          socketPrefab,
          socketPrefab,
          biome,
          socket.position,
          filterResult.prefabs,
          prefabCounter,
        )

        if (replacement === SKIPPED_POI_NAME) {
          counters.errors++
          console.log(
            `Socket ${socket.name}@${socket.position
            .toArray()
            .join(',')} in biome ${biome} could not be replaced. Skipping it.`,
          )
          continue
        }

        console.log(
          `Spawning ${replacement.name} instead of ${socketPrefab.name} (${i}/${
            sockets.length - 1
          }) (Reason:  ${error})`,
        )
        counters.replaced++

        spawned = spawnPOI(
          mapHelper,
          socket.position,
          socket.rotation,
          replacement,
          prefabs.prefabsByName,
          prefabs.validPrefabsByName,
          distanceMap,
          prefabCounter,
          config,
        )
      }

      spawned[0].zoning = socketPrefab.meta.zoning.join(',')
      spawned[0].allowedTownships =
        socketPrefab.meta.allowedTownships.join(',')
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
    const xmlPath = resolve(dirname(prefabsPath), 'prefabs-populated.xml')
    await writeFile(xmlPath, `\uFEFF${newXml.replace(/"\/>/g, '" />')}`, {
      encoding: 'utf8',
    })

    console.log(`Spawned: ${counters.spawned}`)
    console.log(`Replaced: ${counters.replaced}`)
    console.log(`Unspawned/Errors: ${counters.errors}`)
    console.log(`Finished! Wrote new ${xmlPath}`)
  }
}

