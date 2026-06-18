const fs = require('fs');
const path = require('path');

let imagesList = null;

function loadImagesList() {
  if (imagesList) return imagesList;
  
  const imagesPath = path.join(__dirname, '../../images.txt');
  const rawData = fs.readFileSync(imagesPath, 'utf8');
  imagesList = rawData.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  return imagesList;
}

function getImagesByType(type) {
  const images = loadImagesList();
  
  if (!type) return images;
  
  const typeLower = type.toLowerCase();
  
  if (typeLower === 'windows') {
    return images.filter(img => 
      img.toLowerCase().includes('windows') && 
      !img.toLowerCase().includes('sql')
    );
  }
  
  if (typeLower === 'sql standard') {
    return images.filter(img => 
      img.toLowerCase().includes('sql') && 
      img.toLowerCase().includes('standard')
    );
  }
  
  if (typeLower === 'sql web') {
    return images.filter(img => 
      img.toLowerCase().includes('sql') && 
      img.toLowerCase().includes('web')
    );
  }
  
  if (typeLower === 'sql enterprise') {
    return images.filter(img => 
      img.toLowerCase().includes('sql') && 
      img.toLowerCase().includes('enterprise')
    );
  }
  
  return images;
}

module.exports = {
  loadImagesList,
  getImagesByType
};
