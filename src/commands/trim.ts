import {Command} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import cloneDeep from 'clone-deep'
import {Builder} from 'xml2js'

import {loadImageViaJimp, getBiomeForPosition} from '../utils/pixel-data'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {initConfig} from '../utils/config'
import {loadDecorations} from '../utils/load-decorations'
import {filterPOIMarkers} from '../utils/filter-poi-markers'
import {Decoration, Prefab} from '../types'

export default class Trim extends Command {
  static description = 'remove spawned decorations and parts from the prefabs';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, biomesPath} = config
    const builder = new Builder()
    const xml = await readFile(prefabsPath, 'utf8')
    const decorations = await loadDecorations(xml)
    const prefabs = await readPrefabsFromXMLs(config)
    const biomesImage = await loadImageViaJimp(biomesPath)

    // Based on our existing decorations from prefabs.xml, we filter out everything thats a socket OR a "random" wilderness POI
    const sockets = filterPOIMarkers(decorations, prefabs.prefabsByName)
    // @todo the filtering actually is buggy! some parts are left there!!

    const prefabCounter: Map<string, number> = new Map()
    for (const prefabKey of prefabs.validPrefabsByName.keys()) {
      prefabCounter.set(prefabKey.toLocaleLowerCase(), 0)
    }

    const socketsWithMarkers: Decoration[] = []
    for (const socket of sockets.values()) {
      const socketPrefab: Prefab | undefined = cloneDeep(
        prefabs.prefabsByName.get(socket.name.toLocaleLowerCase()),
      )
      if (!socketPrefab) {
        throw new Error(
          `Unable to locate prefab for socket ${JSON.stringify(socket)}`,
        )
      }

      const socketEnhanced = {
        ...socket,
        zoning: socket.guessedZone,
        allowedTownships: socket.guessedTownship || 'city',
      }
      socketsWithMarkers.push(socketEnhanced)
    }

    // build new structure
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
            biome: getBiomeForPosition(
              decoration.position,
              biomesImage,
              config,
            ),
          },
        },
      })),
    }

    const newXml = builder.buildObject(newDecorations)
    const xmlPath = resolve(dirname(prefabsPath), 'prefabs-trimmed.xml')
    await writeFile(xmlPath, `\uFEFF${newXml}`, {encoding: 'utf8'})

    console.log(`Finished! Wrote new ${xmlPath}`)
  }
}
