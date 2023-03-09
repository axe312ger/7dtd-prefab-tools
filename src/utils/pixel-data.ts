import * as Jimp from 'jimp'
import {Vector3} from 'three'
import memoizerific from 'memoizerific'

import {PrefabToolsConfig} from '../types'

export const loadImageViaJimp = async (path: string): Promise<Jimp> => Jimp.read(path)

export const getBiomeForPosition = memoizerific(0)(
  (position: Vector3, biomesImage: Jimp, {mapSize, biomeMap}: PrefabToolsConfig) => {
    const posX = position.x + (mapSize / 2)
    const posY = (mapSize / 2) - position.z
    const locationColor = Jimp.intToRGBA(biomesImage.getPixelColor(posX, posY))

    const biomeCode = `${locationColor.r}_${locationColor.g}_${locationColor.b}` as keyof typeof biomeMap as string

    if (!Object.keys(biomeMap).includes(biomeCode)) {
      console.log(`WARNING: Unable to detect biome for ${biomeCode} at ${position.x},${position.z}`)
      return 'pine_forest'
    }

    return biomeMap[biomeCode]
  },
)

export const getHeightForPosition = memoizerific(0)(
  (
    position: Vector3,
    plotSize: Vector3,
    rotation: number,
    heightMapImage: Jimp,
    {mapSize}: PrefabToolsConfig,
  ) => {
    let modifierX = Math.floor(plotSize.x / 2)
    let modifierZ = Math.floor(plotSize.z / 2)

    if (rotation === 1 || rotation === 3) {
      modifierX = Math.floor(plotSize.z / 2)
      modifierZ = Math.floor(plotSize.x / 2)
    }

    const posX = (mapSize / 2) + (position.x + modifierX)
    const posY = (mapSize / 2) - (position.z + modifierZ)

    const locationColor = Jimp.intToRGBA(
      heightMapImage.getPixelColor(posX, posY),
    )
    const height = (locationColor.r + locationColor.g + locationColor.b) / 3

    return height + 1
  },
)
