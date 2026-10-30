import { useEffect } from 'react';

// Lightweight SEO helper — sets document title and meta description
// without pulling in an extra dependency.
export default function SEO({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | UrbanCart` : 'UrbanCart — Everything You Need. One Better Place.';
    document.title = fullTitle;

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
}
