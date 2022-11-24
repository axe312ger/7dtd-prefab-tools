import {Command, Flags} from '@oclif/core'
import {readFile, writeFile} from 'node:fs/promises'
import {resolve, dirname} from 'node:path'
import {vanillaPrefabsPath, xmlMapPrefabsPath} from '../config'
import {readPrefabsFromXMLs} from '../utils/read-prefabs'
import {loadDecorations} from '../utils/load-decorations'

export default class Analyze extends Command {
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
    const {args, flags} = await this.parse(Analyze)

    // const name = flags.name ?? 'world'
    // this.log(`hello ${name} from /Users/bene/dev/7d2d/prefab-tools/src/commands/analyze.ts`)
    // if (args.file && flags.force) {
    //   this.log(`you input --force and --file: ${args.file}`)
    // }

    const prefabs = await readPrefabsFromXMLs()
    const xml = await readFile(
      resolve(dirname(xmlMapPrefabsPath), 'prefabs.xml'),
      'utf8',
    )
    const decorations = await loadDecorations(xml)
    // Loop through

    // 1. output list of prefabs without distant mesh!

    // 2. output list of prefabs without size

    // 3. output list of prefabs without :
    // zone (any zone, you might not want that!)
    // township (any township, you might not want that!)
    // biome (any biome, you might not want that!)

    // 4. list unique values used in zoning, tags, townships, biomes

    // Output prefab placement stats as CSV
    const csvData = [...prefabs.validPrefabsByName.entries()]
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
    // Turn to CSV array
    .map(d =>
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

    console.log(`There are ${csvData.length} unique POIs currently spawned on the map.`)

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
