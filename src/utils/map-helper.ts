import {Vector3} from 'three'
import * as Jimp from 'jimp'

import {getBiomeForPosition, getHeightForPosition, loadImageViaJimp} from '../utils/pixel-data'
import {PrefabToolsConfig} from '../types'

export class MapHelper {
  biomesImage: Jimp | null;
  heightMapImage: Jimp | null;
  config: PrefabToolsConfig;
  constructor(config: PrefabToolsConfig) {
    this.config = config
    this.biomesImage = null
    this.heightMapImage = null
  }

  async loadImages(): Promise<void> {
    this.biomesImage = await loadImageViaJimp(this.config.biomesPath)
    this.heightMapImage = await loadImageViaJimp(this.config.heightMapPath)
  }

  getBiomeForPosition = (position: Vector3): string => {
    if (!this.biomesImage) {
      throw new Error(
        'You need to load the biome image first via jimp. Call loadImages!',
      )
    }

    return getBiomeForPosition(position, this.biomesImage, this.config)
  };

  getHeightForPosition = (
    position: Vector3,
    plotSize: Vector3,
    rotation: number,
  ): number => {
    if (!this.heightMapImage) {
      throw new Error(
        'You need to load the heightmap image first via jimp. Call loadImages!',
      )
    }

    return getHeightForPosition(
      position,
      plotSize,
      rotation,
      this.heightMapImage,
      this.config,
    )
  };
}
