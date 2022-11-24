import {Command, Flags} from '@oclif/core'

import {readFile, writeFile} from 'node:fs/promises'
import {dirname, resolve} from 'node:path'
import cloneDeep from 'clone-deep'
import {Builder} from 'xml2js'
import {heightMapPath, xmlMapPrefabsPath} from '../config'
import {getHeightForPosition, loadImageViaJimp} from '../utils/pixel-data'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {Decoration, Prefab} from '../types'

import {loadDecorations} from '../utils/load-decorations'
import {filterPOIMarkers} from '../utils/filter-poi-markers'

export default class AlignToHeightmap extends Command {
  static description = 'describe the command here';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
  };

  static args = [{name: 'file'}];

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AlignToHeightmap)

    const builder = new Builder()
    const xml = await readFile(xmlMapPrefabsPath, 'utf8')
    const decorations = await loadDecorations(xml)
    const prefabs = await readPrefabsFromXMLs()
    const heightMapImage = await loadImageViaJimp(heightMapPath)

    // Based on our existing decorations from prefabs.xml, we filter out everything thats a socket OR a "random" wilderness POI
    const sockets = filterPOIMarkers(decorations, prefabs.prefabsByName)

    const adjustedSockets: Decoration[] = []
    for (const [i, socket] of sockets.entries()) {
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
      dirname(xmlMapPrefabsPath),
      'prefabs-heightmap-aligned.xml',
    )
    await writeFile(xmlPath, `\uFEFF${newXml.replace(/"\/>/g, '" />')}`, {
      encoding: 'utf8',
    })

    console.log(`Finished! Wrote new ${xmlPath}`)
  }
}
