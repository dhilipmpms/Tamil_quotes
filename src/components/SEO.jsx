import React, { useEffect } from 'react';

const SEO = ({ title, description, type = 'website', author, slug, imageUrl }) => {
  const siteName = 'Tamil Literature & Philosophy Community Platform';
  const displayTitle = title ? `${title} | ${siteName}` : siteName;
  const displayDesc = description || 'Read, discover and share Tamil and English quotes, Kavithai (poetry), philosophy articles, and short stories.';
  const currentUrl = `https://tamil-philosophy.com/${slug || ''}`;
  const displayImage = imageUrl || 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200';

  useEffect(() => {
    // Update Title
    document.title = displayTitle;

    // Helper to get or create meta elements
    const setMeta = (property, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO Tags
    setMeta('description', displayDesc);
    setMeta('keywords', 'Tamil literature, Tamil quotes, Kavithai, Tamil poetry, Thirukkural, Stoicism, Philosophy, short stories, Tamil writers');

    // Open Graph / Facebook
    setMeta('og:title', displayTitle, true);
    setMeta('og:description', displayDesc, true);
    setMeta('og:type', type, true);
    setMeta('og:url', currentUrl, true);
    setMeta('og:image', displayImage, true);
    setMeta('og:site_name', siteName, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', displayTitle);
    setMeta('twitter:description', displayDesc);
    setMeta('twitter:image', displayImage);

    // Structured Data (Schema.org JSON-LD)
    let schemaScript = document.getElementById('seo-schema-jsonld');
    if (schemaScript) {
      schemaScript.remove();
    }

    schemaScript = document.createElement('script');
    schemaScript.id = 'seo-schema-jsonld';
    schemaScript.type = 'application/ld+json';

    let jsonLd = {};
    if (type === 'article') {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': displayDesc,
        'image': displayImage,
        'author': {
          '@type': 'Person',
          'name': author || 'Community Contributor'
        },
        'publisher': {
          '@type': 'Organization',
          'name': siteName,
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150'
          }
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': currentUrl
        }
      };
    } else {
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': siteName,
        'url': 'https://tamil-philosophy.com/',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://tamil-philosophy.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
    }

    schemaScript.innerHTML = JSON.stringify(jsonLd);
    document.head.appendChild(schemaScript);

    return () => {
      // Clean up structured data script when component unmounts
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [displayTitle, displayDesc, type, currentUrl, displayImage, author]);

  return null;
};

export default SEO;
