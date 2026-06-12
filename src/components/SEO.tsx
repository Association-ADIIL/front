import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'event';
  image?: string;
  imageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noindex?: boolean;
  // Event specific
  eventDate?: string;
  eventLocation?: string;
  eventPrice?: number;
  // Product specific
  productPrice?: number;
  productCurrency?: string;
  productAvailability?: 'InStock' | 'OutOfStock' | 'PreOrder';
}

const BASE_TITLE = 'ADIIL - Association Etudiante | IUT de Laval';
const BASE_DESCRIPTION = "ADIIL, l'Association Des Etudiants en Informatique de l'IUT de Laval. Evenements, boutique et vie etudiante du Departement Informatique.";
const BASE_KEYWORDS = 'ADIIL, IUT de Laval, Association Etudiante, Departement Informatique, Bureau des Etudiants, BDE Laval, IUT Informatique Laval, vie etudiante, evenements etudiants, boutique BDE';
const BASE_URL = 'https://adiil.fr';
const DEFAULT_IMAGE = 'https://adiil.fr/og-image.png';

export default function SEO({
  title,
  description = BASE_DESCRIPTION,
  keywords = BASE_KEYWORDS,
  url = '',
  type = 'website',
  image = DEFAULT_IMAGE,
  imageAlt = 'ADIIL - Association Etudiante IUT de Laval',
  publishedTime,
  modifiedTime,
  author = 'ADIIL',
  noindex = false,
  eventDate,
  eventLocation,
  eventPrice,
  productPrice,
  productCurrency = 'EUR',
  productAvailability = 'InStock'
}: SEOProps) {
  const fullTitle = title ? `${title} | ADIIL` : BASE_TITLE;
  const fullUrl = `${BASE_URL}${url}`;

  // JSON-LD Structured Data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ADIIL',
    alternateName: 'Association Des IUT Informatique Laval',
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.svg`,
    description: BASE_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Laval',
      addressRegion: 'Mayenne',
      postalCode: '53000',
      addressCountry: 'FR'
    },
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'French'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ADIIL',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/shop?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const breadcrumbSchema = url && url !== '/' ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: BASE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title || 'Page',
        item: fullUrl
      }
    ]
  } : null;

  const eventSchema = type === 'event' && eventDate ? {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: description,
    startDate: eventDate,
    location: eventLocation ? {
      '@type': 'Place',
      name: eventLocation,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Laval',
        addressCountry: 'FR'
      }
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'ADIIL',
      url: BASE_URL
    },
    offers: eventPrice !== undefined ? {
      '@type': 'Offer',
      price: eventPrice,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: fullUrl
    } : undefined,
    image: image,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
  } : null;

  const productSchema = type === 'product' && productPrice !== undefined ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    description: description,
    image: image,
    brand: {
      '@type': 'Organization',
      name: 'ADIIL'
    },
    offers: {
      '@type': 'Offer',
      price: productPrice,
      priceCurrency: productCurrency,
      availability: `https://schema.org/${productAvailability}`,
      url: fullUrl,
      seller: {
        '@type': 'Organization',
        name: 'ADIIL'
      }
    }
  } : null;

  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'ADIIL',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/favicon.svg`
      }
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    mainEntityOfPage: fullUrl
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <link rel="canonical" href={fullUrl} />

      {/* Language */}
      <meta httpEquiv="content-language" content="fr" />
      <meta name="language" content="French" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'event' ? 'event' : type === 'article' ? 'article' : type === 'product' ? 'product' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="ADIIL" />

      {/* Article specific OG tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && (
        <meta property="article:author" content={author} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Geo Tags */}
      <meta name="geo.region" content="FR-53" />
      <meta name="geo.placename" content="Laval" />
      <meta name="geo.position" content="48.0733;-0.7689" />
      <meta name="ICBM" content="48.0733, -0.7689" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      {url === '/' && (
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
        </script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
      {eventSchema && (
        <script type="application/ld+json">
          {JSON.stringify(eventSchema)}
        </script>
      )}
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
    </Helmet>
  );
}
