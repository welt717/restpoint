/**
 * Time Stamps Utility
 * Provides Kenya timezone-aware timestamp functions
 */

/**
 * Returns the current time as an ISO string in Kenya timezone (UTC+3)
 * @returns {string} ISO timestamp string
 */
function getKenyaTimeISO() {
  const now = new Date();
  // Kenya is UTC+3 (EAT - East Africa Time)
  const kenyaOffset = 3 * 60; // 3 hours in minutes
  const localOffset = now.getTimezoneOffset();
  const kenyaTime = new Date(now.getTime() + (localOffset + kenyaOffset) * 60 * 1000);
  return kenyaTime.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Returns the current date in YYYY-MM-DD format (Kenya timezone)
 * @returns {string} Date string
 */
function getKenyaDate() {
  const now = new Date();
  const kenyaOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const kenyaTime = new Date(now.getTime() + (localOffset + kenyaOffset) * 60 * 1000);
  return kenyaTime.toISOString().slice(0, 10);
}

module.exports = { getKenyaTimeISO, getKenyaDate };