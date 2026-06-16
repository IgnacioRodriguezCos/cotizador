const debugLogs = [];
const MAX_LOGS = 500;

function addLog(category, message, data = null) {
  const log = {
    timestamp: new Date().toISOString(),
    category,
    message,
    data
  };
  
  debugLogs.push(log);
  
  if (debugLogs.length > MAX_LOGS) {
    debugLogs.shift();
  }
  
  console.log(`[${category}] ${message}`, data || '');
}

function getLogs(category = null, limit = 100) {
  let filtered = debugLogs;
  
  if (category) {
    filtered = debugLogs.filter(log => log.category === category);
  }
  
  return filtered.slice(-limit);
}

function clearLogs() {
  debugLogs.length = 0;
}

function getLogsByCategories() {
  const categories = {};
  
  debugLogs.forEach(log => {
    if (!categories[log.category]) {
      categories[log.category] = [];
    }
    categories[log.category].push(log);
  });
  
  return categories;
}

module.exports = {
  addLog,
  getLogs,
  clearLogs,
  getLogsByCategories
};
