import {Command} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import cloneDeep from 'clone-deep'
import {Builder} from 'xml2js'
import {Vector3} from 'three'

import {getBiomeForPosition, loadImageViaJimp} from '../utils/pixel-data'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {initConfig} from '../utils/config'
import {loadDecorations} from '../utils/load-decorations'
import {filterPOIMarkers} from '../utils/filter-poi-markers'
import {Decoration, Prefab} from '../types'
import {SKIPPED_POI_NAME} from '../const'

import {spawnPOI} from '../utils/place-prefabs'
import {filterPrefabs,
  defaultPrefabFilters} from '../utils/filter-prefabs'
import {getRandomPrefab} from '../utils/select-prefabs'

export default class Populate extends Command {
  static description = 'Populate all empty tiles in a prefab.xml'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, heightMapPath, biomesPath, socketBlacklist} = config

    const builder = new Builder()
    const xml = await readFile(prefabsPath, 'utf8')
    const decorations = await loadDecorations(xml)
    const prefabs = await readPrefabsFromXMLs(config)
    const biomesImage = await loadImageViaJimp(biomesPath)
    const heightMapImage = await loadImageViaJimp(heightMapPath)
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

      const biome = getBiomeForPosition(socket.position, biomesImage, config)

      // Search for top level replacement
      // Do not replace tiles
      const isTile =
      socketPrefab.meta.tags.find(tag =>
        ['streettile', 'zzintersection'].includes(tag),
      ) || socketPrefab.name.indexOf('rwg_tile_') === 0

      let replacement: Prefab | typeof SKIPPED_POI_NAME = socketPrefab

      // Well, do keep tiles only as long they are in a valid location. Otherwise shuffle time!
      let isInvalid = false
      if (
        !socketBlacklist.some(test => socketPrefab.name.includes(test))
      ) {
      // Is the tile at a allowed position?
        const isValidFilterResult = filterPrefabs(
          socketPrefab,
          prefabs.validPrefabsByName,
          defaultPrefabFilters,
          {
            distanceMap,
            position: socket.position,
            biome,
            isWilderness: false,
            config,
          },
        )
        if (isValidFilterResult.success) {
          try {
            const spawnTestDecorations = spawnPOI(
              socket.position,
              socket.rotation,
              replacement,
              prefabs.prefabsByName,
              prefabs.validPrefabsByName,
              biome,
              distanceMap,
              heightMapImage,
              replacement,
              prefabCounter,
              config,
              true,
            )
            isInvalid = spawnTestDecorations.length === 0
          } catch {
          // If some marker could not be spawned, it will throw and therefor this prefab should not be here
            isInvalid = true
          }
        } else {
          isInvalid = true
        }
      }

      if (
      // (isInvalid || !isTile) &&
        isInvalid &&
      // Exclude blacklistes sockets
      !socketBlacklist.includes(socketPrefab.name)
      ) {
        const filterResult = filterPrefabs(
          socketPrefab,
          prefabs.validPrefabsByName,
          defaultPrefabFilters,
          {
            distanceMap,
            position: socket.position,
            biome,
            isWilderness:
            !isTile &&
            socketPrefab.meta.allowedTownships.includes('wilderness'),
            // debugPrefabName: "rwg_tile_commercial_intersection_ghost",
            debugSocketName: 'rwg_tile_commercial_cap',
            config,
          },
        )
        if (!filterResult.success) {
          throw new Error(
            `Unable to replace Socket '${socket.name}@${socket.position
            .toArray()
            .join(',')}': ${filterResult.reason}\n${filterResult.prefabs
            .map(p => p.name)
            .join('\n')}`,
          )
        }

        replacement = getRandomPrefab(
          socketPrefab,
          socketPrefab,
          biome,
          socket.position,
          filterResult.prefabs,
          prefabCounter,
        )

        if (replacement === SKIPPED_POI_NAME) {
          throw new Error(
            `Socket ${socket.name}@${socket.position
            .toArray()
            .join(',')} in biome ${biome} could not be replaced. Skipping it.`,
          )
        }

        console.log(
          `Shuffling ${socketPrefab.name} to ${replacement.name} (${i}/${
            sockets.length - 1
          })`,
        )
      } else {
        console.log(`Spawning ${socketPrefab.name} (${i}/${sockets.length - 1})`)
      }

      const spawned = spawnPOI(
        socket.position,
        socket.rotation,
        replacement,
        prefabs.prefabsByName,
        prefabs.validPrefabsByName,
        biome,
        distanceMap,
        heightMapImage,
        replacement,
        prefabCounter,
        config,
      )
      spawned[0].zoning = socketPrefab.meta.zoning.join(',')
      spawned[0].allowedTownships = socketPrefab.meta.allowedTownships.join(',')
      spawned[0].isWilderness = !isTile

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
            biome: getBiomeForPosition(decoration.position, biomesImage, config),
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

