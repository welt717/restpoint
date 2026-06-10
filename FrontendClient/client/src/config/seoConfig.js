/**
 * REST POINT - SEO Configuration
 * Comprehensive SEO setup for African markets
 */

export const SEO_CONFIG = {
  // Site metadata
  site: {
    title: 'REST POINT - Mortuary Management OS for Africa',
    description: 'Complete deceased management system with billing, dispatch, and family portal for Kenya, Uganda, and East Africa',
    url: process.env.REACT_APP_SITE_URL || 'https://restpoint.co.ke',
    logo: '/logo.png',
    social: {
      twitter: '@restpointke',
      facebook: 'restpoint.africa',
      linkedin: 'restpoint-mortuary-os'
    }
  },

  // Target markets
  markets: [
    { country: 'KE', countryCode: 'Kenya', language: 'en-KE', currency: 'KES' },
    { country: 'UG', countryCode: 'Uganda', language: 'en-UG', currency: 'UGX' },
    { country: 'TZ', countryCode: 'Tanzania', language: 'en-TZ', currency: 'TZS' },
    { country: 'ET', countryCode: 'Ethiopia', language: 'en-ET', currency: 'ETB' },
    { country: 'RW', countryCode: 'Rwanda', language: 'en-RW', currency: 'RWF' },
    { country: 'NG', countryCode: 'Nigeria', language: 'en-NG', currency: 'NGN' },
    { country: 'GH', countryCode: 'Ghana', language: 'en-GH', currency: 'GHS' }
  ],

  // Keywords - Region specific
  keywords: {
    general: [
      'mortuary management software',
      'funeral home operating system',
      'deceased management system',
      'burial permit tracking',
      'mortuary billing'
    ],
    regional: {
      KE: ['mortuary software Kenya', 'funeral management Nairobi', 'burial permit tracker'],
      UG: ['mortuary system Uganda', 'funeral management Kampala'],
      TZ: ['mortuary software Tanzania', 'funeral management Dar es Salaam'],
      NG: ['mortuary software Nigeria', 'funeral management Lagos']
    }
  },

  // Structured data
  schema: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'REST POINT',
      description: 'Mortuary Management Operating System',
      url: 'https://restpoint.co.ke',
      logo: 'https://restpoint.co.ke/logo.png',
      contact: {
        '@type': 'ContactPoint',
        telephone: '+254-XXXXX',
        contactType: 'Customer Service'
      },
      sameAs: [
        'https://twitter.com/restpointke',
        'https://facebook.com/restpoint.africa'
      ]
    },

    software: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'REST POINT',
      description: 'All-in-one mortuary management system',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '7500',
        priceCurrency: 'KES'
      },
      areaServed: ['KE', 'UG', 'TZ', 'ET', 'RW', 'NG', 'GH']
    }
  },

  // Meta tags
  metaTags: {
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'utf-8',
    lang: 'en',
    dir: 'ltr'
  },

  // Open Graph
  og: {
    type: 'website',
    image: '/og-image-1200x630.png',
    image_width: '1200',
    image_height: '630'
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    creator: '@restpointke',
    site: '@restpointke'
  }
};

/**
 * Generate dynamic SEO meta tags
 */
export const generateMetaTags = (pageData = {}) => {
  return {
    title: pageData.title || SEO_CONFIG.site.title,
    description: pageData.description || SEO_CONFIG.site.description,
    keywords: pageData.keywords || SEO_CONFIG.keywords.general.join(', '),
    canonical: pageData.url || SEO_CONFIG.site.url,
    og: {
      title: pageData.ogTitle || pageData.title || SEO_CONFIG.site.title,
      description: pageData.ogDescription || pageData.description,
      image: pageData.ogImage || SEO_CONFIG.og.image,
      url: pageData.url || SEO_CONFIG.site.url,
      type: pageData.ogType || SEO_CONFIG.og.type
    },
    twitter: {
      card: pageData.twitterCard || SEO_CONFIG.twitter.card,
      title: pageData.twitterTitle || pageData.title,
      description: pageData.twitterDescription || pageData.description,
      image: pageData.twitterImage || SEO_CONFIG.og.image
    }
  };
};

/**
 * SEO Hook for React components
 */
export const useSEO = (pageData) => {
  React.useEffect(() => {
    const meta = generateMetaTags(pageData);

    // Set title
    document.title = meta.title;

    // Set meta tags
    const updateMeta = (name, value) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    updateMeta('description', meta.description);
    updateMeta('keywords', meta.keywords);
    updateMeta('canonical', meta.canonical);

    // Set OG tags
    const updateOGMeta = (property, value) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    Object.entries(meta.og).forEach(([key, value]) => {
      updateOGMeta(`og:${key}`, value);
    });

    // Set Twitter tags
    Object.entries(meta.twitter).forEach(([key, value]) => {
      updateMeta(`twitter:${key}`, value);
    });

  }, [pageData]);
};

export default SEO_CONFIG;
