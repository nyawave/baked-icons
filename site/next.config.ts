import { withBakedIcons } from '@nyawave/baked-icons/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
};

export default withBakedIcons(nextConfig, { iconSets: { bi: './icons/brand.json' } });
