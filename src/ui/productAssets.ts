import type { ImageSourcePropType } from 'react-native';
// Five columns, four rows. A sprite is displayed by clipping, without downloading remote photos.
export const productAtlases: Record<string, ImageSourcePropType> = {
  mercearia: require('../../assets/products/mercearia.png'),
  bebidas: require('../../assets/products/bebidas.png'),
  higiene: require('../../assets/products/higiene.png'),
  limpeza: require('../../assets/products/limpeza.png'),
  hortifruti: require('../../assets/products/hortifruti.png'),
  frescos: require('../../assets/products/frescos.png'),
};
