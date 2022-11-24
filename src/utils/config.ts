import {readFile, writeFile, access} from 'node:fs/promises'
import fs from 'node:fs'
import os from 'node:os'
import {resolve} from 'node:path'
import * as inquirer from 'inquirer'
import {PrefabToolsConfig} from '../types'

export async function initConfig(): Promise<PrefabToolsConfig> {
  const currentDir = process.cwd()
  const configPath = resolve(currentDir, 'prefab-tools.json')
  // check if prefab-tools.json exists
  try {
    // throw new Error('force asking, remove me ;)')
    await access(configPath, fs.constants.R_OK)
    // load and return existing config file
    const configContent = await readFile(configPath)
    console.log(`Loading existing config file from ${configPath}`)
    return JSON.parse(configContent.toString()) as PrefabToolsConfig
    // otherwise:
  } catch {
    const responses: any = await inquirer.prompt([
      {
        name: 'prefabsPath',
        message: 'Path to prefabs.xml:',
        type: 'input',
        default: resolve(currentDir, 'prefabs.xml'),
      },
      {
        name: 'biomesPath',
        message: 'Path to biomes.png:',
        type: 'input',
        default: resolve(currentDir, 'workspace', 'biomes.png'),
      },
      {
        name: 'heightMapPath',
        message: 'Path to dtm.png (heightmap):',
        type: 'input',
        default: resolve(currentDir, 'workspace', 'dtm.png'),
      },
      {
        name: 'mapSize',
        message: 'The maximum dimension of the map:',
        type: 'list',
        choices: [
          6144,
          8192,
          10_240,
          5120,
          7168,
          9216,
          11_264,
          12_288,
          13_312,
          14_366,
          15_360,
        ],
      },
      {
        name: 'vanillaPrefabsPath',
        message:
          'Path to your 7 Days To Die game directory (to locate vanilla prefabs):',
        type: 'input',
        default: resolve(
          os.homedir(),
          'Library/Application Support/Steam/steamapps/common/7 Days To Die/7DaysToDie.app/Data/Prefabs',
        ),
      },
    ])

    const additionalPrefabsPaths = []
    let hasPath = true

    while (hasPath) {
      // eslint-disable-next-line no-await-in-loop
      const additionalResponses = await inquirer.prompt([
        {
          name: 'additionalPrefabsPath',
          message:
            'Additional prefabs directory. For example LocalPrefabs or some mods: (Press enter twice to continue)',
          type: 'input',
        },
      ])

      const res = additionalResponses.additionalPrefabsPath.trim()
      hasPath = res.length > 0
      if (hasPath) {
        additionalPrefabsPaths.push(res)
      }
    }

    const config = {
      ...responses,
      additionalPrefabsPaths,
      ...defaultConfig,
    } as PrefabToolsConfig
    await writeFile(configPath, JSON.stringify(config, null, 2))
    console.log(`Created new config file at ${configPath}`)
    return config
  }

  // 1. ask for prefabs.xml path (suggest current dir + prefabs.xml)
  // 2. ask for biomes.png path (suggest current dir + workspace/biomes.png)
  // 3. ask for dtm.png path (suggest current dir + workspace/dtm.png)
  // 4. ask for paths to game/server to locate vanilla prefabs
  // 4. ask for paths to folders that contain additional prefabs. repeat this till user enters empty path
  // 5. ask for map size (give list of possible sizes?)
  // 6. combine data with default config and write prefab-tools.json
}

export const defaultConfig = {
  biomeMap: {
    '0_64_0': 'pine_forest',
    '255_255_255': 'snow',
    '255_228_119': 'desert',
    '186_0_255': 'burnt_forest',
    '255_168_0': 'wasteland',
  },
  vanillaWhitelists: {
    wasteland: [
      'abandoned_house',
      'bombshelter',
      'cave',
      'countrytown_business_06',
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'downtown_filler_31',
      'downtown_filler_park',
      'football_stadium',
      'funeral_home',
      'house_burnt',
      'junkyard',
      'lot_downtown',
      'lot_industrial',
      'park',
      'parking_lot',
      'remnant',
      'rubble',
      'trader',
      'waste',
      'warehouse_05',
      'warehouse_06',
    ],
  },
  vanillaBlacklists: {
    // eslint-disable-next-line camelcase
    pine_forest: [
      'abandoned_house',
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'countrytown_business_06',
      'downtown_filler_31',
      'house_burnt',
      'rubble',
      'waste',
      'warehouse_05',
      'warehouse_06',
      'oldwest',
    ],
    desert: [
      'downtown_building',
      'downtown_filler_12',
      'downtown_filler_13',
      'downtown_filler_14',
      'downtown_filler_15',
      'downtown_filler_31',
      'countrytown_business_06',
      'house_burnt',
      'rubble',
      'waste',
      'warehouse_05',
      'warehouse_06',
    ],
    snow: [
      'rubble',
      'house_burnt',
      'remnant',
      'rubble',
      'waste',
      'oldwest',
      'countrytown_business_06',
    ],
    wasteland: ['rwg_tile_oldwest'],
  },
  socketBlacklist: ['bridge_', 'canyon_', 'deco_', 'spawn_'],
}
