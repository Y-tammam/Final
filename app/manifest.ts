import type { MetadataRoute } from 'next';
import { BRAND_CONFIG } from '@/lib/brand';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_CONFIG.nameArabic} | ${BRAND_CONFIG.tagline}`,
    short_name: BRAND_CONFIG.nameArabic,
    description: BRAND_CONFIG.tagline,
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#171717',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
