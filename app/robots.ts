import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/login', '/api/'],
      },
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/admin', '/admin/login', '/api/'],
      },
      {
        userAgent: 'NaverBot',
        allow: '/',
        disallow: ['/admin', '/admin/login', '/api/'],
      },
    ],
    sitemap: 'https://kkado-kkado.com/sitemap.xml',
  };
}
