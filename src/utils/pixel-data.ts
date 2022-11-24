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
      throw new Error(`Unable to detect biome for ${biomeCode} at ${position}`)
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
    let modifierX = plotSize.x
    let modifierZ = plotSize.z * -1
    switch (rotation) {
    case 3:
      modifierX = plotSize.z * -1
      modifierZ = plotSize.x * -1
      break
    case 2:
      modifierX = plotSize.z
      modifierZ = plotSize.x * -1
      break
    case 1:
      modifierX = plotSize.z
      modifierZ = plotSize.x * -1
      break
    }

    const posX = (mapSize / 2) + position.x + Math.floor(modifierX / 2)
    const posY = (mapSize / 2) - position.z + Math.floor(modifierZ / 2)

    const locationColor = Jimp.intToRGBA(
      heightMapImage.getPixelColor(posX, posY),
    )
    const height = (locationColor.r + locationColor.g + locationColor.b) / 3

    return height + 1
  },
)
