const COLORS = {
  BLUE: 'FF1874CD',
  GRAY: 'FFDBDBDB',
  GRAY_LIGHT: 'FFF5F5F5'
};

const COLOR_NAMES = {
  [COLORS.BLUE]: 'Azul',
  [COLORS.GRAY]: 'Gris',
  [COLORS.GRAY_LIGHT]: 'Gris Claro'
};

const COLOR_HEX = {
  [COLORS.BLUE]: '#1874CD',
  [COLORS.GRAY]: '#DBDBDB',
  [COLORS.GRAY_LIGHT]: '#F5F5F5'
};

function getColorName(color) {
  return COLOR_NAMES[color] || 'Sin color';
}

function getColorHex(color) {
  return COLOR_HEX[color] || '#FFFFFF';
}

export {
  COLORS,
  COLOR_NAMES,
  COLOR_HEX,
  getColorName,
  getColorHex
};
