import {Command} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import cloneDeep from 'clone-deep'
import {Builder} from 'xml2js'

import {getHeightForPosition, loadImageViaJimp} from '../utils/pixel-data'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {initConfig} from '../utils/config'
import {loadDecorations} from '../utils/load-decorations'
import {filterPOIMarkers} from '../utils/filter-poi-markers'
import {Decoration, Prefab} from '../types'

export default class Align extends Command {
  static description = 'Align all POIs and tiles to the heightmap of your map';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, heightMapPath} = config

    const builder = new Builder()
    const xml = await readFile(prefabsPath, 'utf8')
    const decorations = await loadDecorations(xml)
    const prefabs = await readPrefabsFromXMLs(config)
    const heightMapImage = await loadImageViaJimp(heightMapPath)

    // Based on our existing decorations from prefabs.xml, we filter out everything thats a socket OR a "random" wilderness POI
    const sockets = filterPOIMarkers(decorations, prefabs.prefabsByName)

    const adjustedSockets: Decoration[] = []
    for (const socket of sockets.values()) {
      const socketPrefab: Prefab | undefined = cloneDeep(
        prefabs.prefabsByName.get(socket.name.toLocaleLowerCase()),
      )
      if (!socketPrefab) {
        throw new Error(
          `Unable to locate prefab for socket ${JSON.stringify(socket)}`,
        )
      }

      const oldY = socket.position.y - socketPrefab.meta.YOffset
      const actualY = getHeightForPosition(
        socket.position,
        socketPrefab.meta.PrefabSize,
        socket.rotation,
        heightMapImage,
        config,
      )
      const diff = actualY - oldY

      socket.position.setY(socket.position.y + diff)
      adjustedSockets.push(socket)

      if (socket.spawnedDecorations && socket.spawnedDecorations.length > 0) {
        adjustedSockets.push(
          ...socket.spawnedDecorations.map(d => {
            d.position.setY(d.position.y + diff)
            return d
          }),
        )
      }
    }

    const newDecorations = {
      prefabs: adjustedSockets.map(decoration => ({
        decoration: {
          $: {
            type: 'model',
            name: decoration.name,
            position: decoration.position
            .toArray()
            .map(v => Math.round(v))
            .join(','),
            rotation: decoration.rotation,
            // zones: decoration.zoning,
            // townships: decoration.allowedTownships,
            // biome: getBiomeForPosition(decoration.position, biomesImage),
          },
        },
      })),
    }

    const newXml = builder.buildObject(newDecorations)
    const xmlPath = resolve(
      dirname(prefabsPath),
      'prefabs-heightmap-aligned.xml',
    )
    await writeFile(xmlPath, `\uFEFF${newXml.replace(/"\/>/g, '" />')}`, {
      encoding: 'utf8',
    })

    console.log(`Finished! Wrote new ${xmlPath}`)
  }
}
