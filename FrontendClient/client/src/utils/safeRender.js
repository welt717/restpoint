/**
 * Safe rendering utilities to prevent blank pages and crashes
 * Use these helpers to safely render data that might be undefined, null, or empty
 */

/**
 * Safely map over an array, returning empty array if data is invalid
 * @param {Array} data - The array to map over
 * @param {Function} mapFn - The mapping function
 * @param {any} fallback - Fallback value if data is invalid (default: [])
 * @returns {Array} Mapped array or fallback
 */
export const safeMap = (data, mapFn, fallback = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return fallback;
  }
  return data.map(mapFn);
};

/**
 * Safely access nested object properties without crashing
 * @param {Object} obj - The object to access
 * @param {string|string[]} path - The path to access (dot notation or array)
 * @param {any} fallback - Fallback value if path doesn't exist
 * @returns {any} The value at path or fallback
 */
export const safeGet = (obj, path, fallback = null) => {
  if (obj === null || obj === undefined) {
    return fallback;
  }
  
  const pathArray = Array.isArray(path) ? path : path.split('.');
  let result = obj;
  
  for (const key of pathArray) {
    if (result === null || result === undefined) {
      return fallback;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : fallback;
};

/**
 * Check if data is valid for rendering (not null, not undefined, not empty)
 * @param {any} data - The data to check
 * @returns {boolean} True if data is valid
 */
export const hasData = (data) => {
  if (data === null || data === undefined) {
    return false;
  }
  if (Array.isArray(data)) {
    return data.length > 0;
  }
  if (typeof data === 'object') {
    return Object.keys(data).length > 0;
  }
  return true;
};

/**
 * Get a safe string value, returning fallback if invalid
 * @param {any} value - The value to convert to string
 * @param {string} fallback - Fallback string
 * @returns {string}
 */
export const safeString = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
};

/**
 * Get a safe number value, returning fallback if invalid
 * @param {any} value - The value to convert to number
 * @param {number} fallback - Fallback number
 * @returns {number}
 */
export const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Safely parse JSON, returning fallback on error
 * @param {string} jsonString - The JSON string to parse
 * @param {any} fallback - Fallback value on parse error
 * @returns {any}
 */
export const safeJSONParse = (jsonString, fallback = null) => {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
};

/**
 * Create a safe API response handler
 * @param {Function} apiCall - Async function that makes API call
 * @param {any} fallback - Fallback value on error
 * @returns {Promise<[data, error]>} Tuple of [data, error]
 */
export const safeAPICall = async (apiCall, fallback = null) => {
  try {
    const data = await apiCall();
    return [data, null];
  } catch (error) {
    console.error('API call failed:', error);
    return [fallback, error];
  }
};

export default {
  safeMap,
  safeGet,
  hasData,
  safeString,
  safeNumber,
  safeJSONParse,
  safeAPICall
};