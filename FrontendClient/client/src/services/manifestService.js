/**
 * Rest Point - Dynamic Manifest Service
 * Updates PWA manifest dynamically based on organization/facility name
 */

// Default manifest values
const DEFAULT_MANIFEST = {
  name: "Rest Point",
  short_name: "Rest.Point",
  description: "Mortuary and funeral home management software",
  theme_color: "#040404",
  background_color: "#040404",
};

/**
 * Get organization name from localStorage or fallback to default
 */
const getOrganizationName = () => {
  try {
    // Try to get from onboarding data first
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      if (data.organizationName) {
        return data.organizationName;
      }
    }

    // Try to get from tenant data
    const tenantData = localStorage.getItem('tenant');
    if (tenantData) {
      const tenant = JSON.parse(tenantData);
      if (tenant.name) {
        return tenant.name;
      }
      if (tenant.organizationName) {
        return tenant.organizationName;
      }
    }

    // Try to get from user data
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.organizationName) {
        return user.organizationName;
      }
    }
  } catch (e) {
    console.warn('[ManifestService] Error reading organization name:', e);
  }
  
  return null;
};

/**
 * Shorten organization name for PWA short_name
 * Examples:
 *   "Nairobi Funeral Home" -> "Nairobi FH"
 *   "Montezuma Memorial" -> "Montezuma"
 *   "Rest Point" -> "Rest.Point"
 */
const shortenName = (name) => {
  if (!name) return DEFAULT_MANIFEST.short_name;
  
  // Remove common suffixes and shorten
  const cleaned = name
    .replace(/\s+&\s+/g, ' ')
    .replace(/\s+(Funeral|Memorial|Home|Mortuary|Services|Limited|Ltd|Incorporated|Inc)/gi, '')
    .trim();
  
  // If still long, just take first two words
  const words = cleaned.split(/\s+/);
  if (words.length > 2) {
    return words.slice(0, 2).join('.');
  }
  
  // Replace spaces with dots for PWA compatibility
  return cleaned.replace(/\s+/g, '.');
};

/**
 * Update the manifest link href with dynamic data
 */
const updateManifest = () => {
  const orgName = getOrganizationName();
  
  if (!orgName) {
    // Use default manifest
    updateManifestLink(DEFAULT_MANIFEST);
    return;
  }

  const shortName = shortenName(orgName);
  
  const dynamicManifest = {
    ...DEFAULT_MANIFEST,
    name: orgName,
    short_name: shortName,
  };

  updateManifestLink(dynamicManifest);
};

/**
 * Update the manifest link element with blob URL
 */
const updateManifestLink = (manifestData) => {
  // Create blob URL for dynamic manifest
  const manifestBlob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
  const manifestUrl = URL.createObjectURL(manifestBlob);
  
  // Find and update the manifest link
  let link = document.querySelector('link[rel="manifest"]');
  
  if (!link) {
    // Create link if it doesn't exist
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }
  
  link.href = manifestUrl;
  
  console.log(`[ManifestService] Manifest updated: ${manifestData.name} (${manifestData.short_name})`);
};

/**
 * Update document title
 */
const updateTitle = () => {
  const orgName = getOrganizationName();
  if (orgName) {
    document.title = `${orgName} - Rest Point`;
  } else {
    document.title = 'Rest Point';
  }
};

/**
 * Initialize manifest and title updates
 * Call this on app load and when organization data changes
 */
export const initManifest = () => {
  updateManifest();
  updateTitle();
};

/**
 * Force refresh of manifest (call after login/onboarding complete)
 */
export const refreshManifest = () => {
  // Small delay to ensure localStorage is updated
  setTimeout(() => {
    updateManifest();
    updateTitle();
  }, 100);
};

/**
 * Get current manifest data
 */
export const getManifestData = () => {
  const orgName = getOrganizationName();
  if (!orgName) {
    return DEFAULT_MANIFEST;
  }
  
  return {
    ...DEFAULT_MANIFEST,
    name: orgName,
    short_name: shortenName(orgName),
  };
};

export default {
  initManifest,
  refreshManifest,
  getManifestData,
  updateManifest,
  updateTitle,
};