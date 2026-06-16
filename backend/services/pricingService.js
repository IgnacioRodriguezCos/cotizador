const fs = require('fs');
const path = require('path');

let pricingData = null;

function loadPricingData() {
  if (pricingData) return pricingData;
  
  const pricingPath = path.join(__dirname, '../../pricing.json');
  const rawData = fs.readFileSync(pricingPath, 'utf8');
  pricingData = JSON.parse(rawData);
  return pricingData;
}

function mapRegion(excelRegion) {
  if (!excelRegion) return null;
  
  const regionLower = excelRegion.toLowerCase().trim();
  
  if (regionLower.includes('santiago')) return 'Santiago';
  if (regionLower.includes('buenos aires')) return 'Buenos Aires';
  
  return null;
}

function parseTypeCell(typeValue) {
  if (!typeValue) return null;
  
  const typeStr = String(typeValue).trim();
  const parts = typeStr.split('|').map(p => p.trim());
  
  if (parts.length < 3) return null;
  
  return {
    arch: parts[0],
    category: parts[1],
    flavor: parts[2],
    vcpus: parts[3] || null,
    ram: parts[4] || null
  };
}

function normalizeCategory(category) {
  if (!category) return null;
  
  const catLower = category.toLowerCase().trim();
  
  if (catLower.includes('general computing-plus') || catLower.includes('general computing-plus')) {
    return 'General Computing-Plus';
  }
  if (catLower.includes('general computing-basic')) {
    return 'General Computing-Basic';
  }
  if (catLower.includes('general computing') && !catLower.includes('plus') && !catLower.includes('basic')) {
    return 'General Computing';
  }
  if (catLower.includes('memory optimized')) {
    return 'Memory Optimized';
  }
  if (catLower.includes('large memory')) {
    return 'Large Memory';
  }
  if (catLower.includes('general computing x0')) {
    return 'General Computing X0';
  }
  
  return category;
}

function getAvailableImages(region, category, flavor) {
  const data = loadPricingData();
  
  const mappedRegion = mapRegion(region);
  if (!mappedRegion) {
    return { error: 'Región no encontrada', options: [] };
  }
  
  const regionData = data.find(r => r.Region === mappedRegion);
  if (!regionData) {
    return { error: 'Región no encontrada en pricing', options: [] };
  }
  
  const normalizedCategory = normalizeCategory(category);
  const categoryData = regionData.Categorias.find(c => 
    c.Categoria.toLowerCase() === normalizedCategory.toLowerCase()
  );
  
  if (!categoryData) {
    return { 
      error: `Categoría "${normalizedCategory}" no encontrada en región ${mappedRegion}`,
      availableCategories: regionData.Categorias.map(c => c.Categoria),
      options: []
    };
  }
  
  const flavorData = categoryData.Flavors.find(f => 
    f['Base Flavor'].toLowerCase() === flavor.toLowerCase()
  );
  
  if (!flavorData) {
    return {
      error: `Flavor "${flavor}" no encontrado en categoría "${normalizedCategory}"`,
      availableFlavors: categoryData.Flavors.map(f => f['Base Flavor']).slice(0, 20),
      options: []
    };
  }
  
  const options = [];
  
  if (flavorData['Windows'] !== null && flavorData['Windows'] !== undefined) {
    options.push({
      label: 'Windows',
      value: 'Windows',
      price: flavorData['Windows']
    });
  }
  
  if (flavorData['SQL Standard'] !== null && flavorData['SQL Standard'] !== undefined) {
    options.push({
      label: 'SQL Standard',
      value: 'SQL Standard',
      price: flavorData['SQL Standard']
    });
  }
  
  if (flavorData['SQL Web'] !== null && flavorData['SQL Web'] !== undefined) {
    options.push({
      label: 'SQL Web',
      value: 'SQL Web',
      price: flavorData['SQL Web']
    });
  }
  
  if (flavorData['SQL Enterprise'] !== null && flavorData['SQL Enterprise'] !== undefined) {
    options.push({
      label: 'SQL Enterprise',
      value: 'SQL Enterprise',
      price: flavorData['SQL Enterprise']
    });
  }
  
  return {
    region: mappedRegion,
    category: normalizedCategory,
    flavor: flavor,
    options: options
  };
}

function getImageOptions(region, typeValue) {
  const parsed = parseTypeCell(typeValue);
  
  if (!parsed) {
    return { error: 'No se pudo parsear la celda Type', options: [] };
  }
  
  return getAvailableImages(region, parsed.category, parsed.flavor);
}

module.exports = {
  loadPricingData,
  mapRegion,
  parseTypeCell,
  normalizeCategory,
  getAvailableImages,
  getImageOptions
};
