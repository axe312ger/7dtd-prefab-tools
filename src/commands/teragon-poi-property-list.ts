import {Command} from '@oclif/core'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {initConfig} from '../utils/config'
import {writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import chalk from 'chalk'

export default class TeragonPoiPropertyList extends Command {
  static description =
    'creates a terragon poi property list based on all your prefabs.';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = [{name: 'file'}];

  public async run(): Promise<void> {
    const config = await initConfig()

    const prefabs = await readPrefabsFromXMLs({
      ...config,
      vanillaPrefabsPath: config.additionalPrefabsPaths[0],
      additionalPrefabsPaths: config.additionalPrefabsPaths.slice(1),
    })
    const poiProperties = []

    for (const prefab of prefabs.validPrefabsByName.values()) {
      const region = prefab.meta.isWilderness ? 'region:default' : 'alone'
      const biomes =
        prefab.meta.isWilderness &&
        (prefab.meta.allowedBiomes.length > 0 ?
          `biome:${prefab.meta.allowedBiomes.join(';')}` :
          'biome:burnt,desert,forest,snow,wasteland')
      const prefabListEntry = [
        prefab.name,
        prefab.meta.RotationToFaceNorth,
        prefab.meta.YOffset,
        prefab.meta.PrefabSize.x,
        prefab.meta.PrefabSize.y,
        prefab.meta.PrefabSize.z,
        prefab.meta.isWilderness && 4, // custom value, distance to next wilderness poi
        biomes,
        region,
      ].filter(v => v !== undefined && v !== null && v !== false)
      poiProperties.push(prefabListEntry.join(';'))
    }

    const statsPath = resolve(process.cwd(), 'teragon-prefab-list.txt')
    await writeFile(statsPath, poiProperties.join('\n'))
    console.log(
      chalk.bold('\nYour Teragon prefab list has been written to:'),
      statsPath,
    )
    console.log(
      chalk.red(
        '\nNote: Your vanilla prefabs have been excluded from the file. Make sure to import/read the default POI Property List with Teragon!',
      ),
    )
  }
}

// name of prefab; rotation;y offset;x;y;z;distance to next poi (wilderness only) biome; and region
// ship_poi;2;-3;21;32;82;4;biome:burnt;desert;forest;snow;wasteland;region:ocean
// apartment_adobe_red_5_flr;2;-1;49;42;48;alone
