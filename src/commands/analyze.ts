import {CliUx, Command} from '@oclif/core'
import {readFile, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {loadDecorations} from '../utils/load-decorations'
import {initConfig} from '../utils/config'
import {Prefab} from '../types'

export default class Analyze extends Command {
  static description = 'Analyze your maps prefabs.xml and get detailed stats about your spawned POIs';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static args = [{name: 'file'}];

  public async run(): Promise<void> {
    const config = await initConfig()
    const {prefabsPath, vanillaPrefabsPath} = config
    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from /Users/bene/dev/7d2d/prefab-tools/src/commands/analyze.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }

    const prefabs = await readPrefabsFromXMLs(config)
    const xml = await readFile(
      resolve(prefabsPath),
      'utf8',
    )
    const decorations = await loadDecorations(xml)

    const validPrefabsBySize: Map<string, Prefab[]> = new Map()
    for (const prefab of prefabs.validPrefabsByName.values()) {
      const prefabSizeId = `${prefab.meta.PrefabSize.x}x${prefab.meta.PrefabSize.z}`
      const prefabList = validPrefabsBySize.get(prefabSizeId)
      if (prefabList) {
        validPrefabsBySize.set(prefabSizeId, [...prefabList, prefab])
      } else {
        validPrefabsBySize.set(prefabSizeId, [prefab])
      }
    }
    // Loop through

    // Count how many 50x50 poi markers and so on you have
    // say how many tiles/prefabs are in which biome

    // 1. output list of prefabs without distant mesh!

    // 2. output list of prefabs without size

    // 3. output list of prefabs without :
    // zone (any zone, you might not want that!)
    // township (any township, you might not want that!)
    // biome (any biome, you might not want that!)

    // 4. list unique values used in zoning, tags, townships, biomes

    // Output prefab placement stats as CSV
    const prefabStats = [...prefabs.validPrefabsByName.entries()]
    .filter(
      ([k]) =>
        !k.includes('part_') &&
          !k.includes('deco') &&
          !k.toLowerCase().includes('aaa_'),
    )
    // Inject extra information
    .map(([k, v]) => {
      const count = decorations.filter(
        d => d.name.toLocaleLowerCase() === k.toLocaleLowerCase(),
      ).length
      const data = {...v, count}
      return data
    })
    // Sort
    .sort((d, d2) => {
      const count = d2.count - d.count
      if (count !== 0) {
        return count
      }

      return d.name.localeCompare(d2.name)
    })

    const poiSpawnMarkerMap: Map<string, Prefab[]> = new Map()
    let tilesCount = 0
    for (const decoration of decorations) {
      const prefabId = decoration.name.toLocaleLowerCase()
      const prefabData = prefabs.validPrefabsByName.get(prefabId)
      if (!prefabData) {
        continue
      }

      if (prefabData.meta.isTile) {
        tilesCount += 1
      }

      // Analyze POI spawn markers
      if (prefabData.meta.markers) {
        for (const marker of prefabData.meta.markers) {
          if (marker.Type === 'POISpawn') {
            const markerId = `${marker.Size.x}x${marker.Size.z}`
            const markerStats = poiSpawnMarkerMap.get(markerId)
            if (markerStats) {
              poiSpawnMarkerMap.set(markerId, [...markerStats, prefabData])
            } else {
              poiSpawnMarkerMap.set(markerId, [prefabData])
            }
          }
        }
      }
    }

    const markerTableData = []
    for (const markerInfo of poiSpawnMarkerMap.entries()) {
      markerTableData.push({
        size: markerInfo[0],
        count: markerInfo[1].length,
        prefabs: validPrefabsBySize.get(markerInfo[0])?.length || 0,
        tiles: [...new Set(markerInfo[1].map(prefab => prefab.name))].sort().join(', '),
      })
    }

    // Turn to CSV array
    const csvData = prefabStats.map(d =>
      [
        d.name,
        d.count,
        d.meta.difficultyTier,
        [d.meta.PrefabSize.x, d.meta.PrefabSize.z].join('x'),
        d.meta.PrefabSize.x,
        d.meta.PrefabSize.y,
        d.meta.PrefabSize.z,
        d.meta.allowedBiomes.join(', '),
        d.meta.allowedTownships.join(', '),
        d.meta.zoning.join(', '),
        d.meta.isTile,
        d.meta.isTrader,
        d.meta.isWilderness,
        d.filePath.includes(vanillaPrefabsPath),
        d.meta.tags.join(', '),
      ].join(';'),
    )
    .filter(Boolean)

    console.log(`There are ${prefabStats.filter((v => v.count > 0)).length} unique POIs spawned in your prefabs.xml`)
    console.log(`Number of tiles: ${tilesCount}`)
    console.log('List of POI markers:')
    CliUx.ux.table(
      markerTableData.sort((a, b) => a.size.localeCompare(b.size)),
      {
        size: {
          header: 'Marker Size',
        },
        count: {
          header: 'Total Count', // override column header
          minWidth: 3, // column must display at this width or greater
        },
        prefabs: {
          header: 'Fitting prefabs',
        },
        tiles: {
          header: 'Tiles with marker',
        },
      },
    )

    // @todo show as table and how many POIs are available per size

    const statsPath = resolve(process.cwd(), 'prefab-spawn-stats.csv')
    await writeFile(
      statsPath,
      [
        'name;count;difficulty;size;size_x;size_y;size_z;biomes;townships;zones;isTile;isTrader;isWilderness;isVanilla;tags',
        ...csvData,
      ].join('\n'),
    )
    console.log(`Stats written to: ${statsPath}`)
  }
}
