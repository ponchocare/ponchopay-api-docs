// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { rehypeBaseLinks } from './plugins/rehype-base-links.mjs';

// The site is served from GitHub Pages. Until a custom domain is set up it lives at
// https://ponchocare.github.io/ponchopay-api-docs/, so every URL needs the repo name as a
// base path. With a custom domain, set SITE_URL to it and BASE_PATH to "/".
const site = process.env.SITE_URL ?? 'https://ponchocare.github.io';
const base = process.env.BASE_PATH ?? '/ponchopay-api-docs';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    // Lets content use root-relative links ("/endpoints/initiate-payment/") whatever the base is.
    processor: unified({ rehypePlugins: [[rehypeBaseLinks, { base }]] }),
  },
  integrations: [
    starlight({
      title: 'PonchoPay API',
      description:
        'Integrate PonchoPay payments, recurring payments and webhooks: cards, Tax-Free Childcare and childcare vouchers in one checkout.',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        alt: 'PonchoPay',
        replacesTitle: true,
      },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/fonts.css', './src/styles/theme.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ponchocare' },
        { icon: 'email', label: 'Email support', href: 'mailto:support@ponchopay.com' },
      ],
      editLink: {
        baseUrl: 'https://github.com/ponchocare/ponchopay-api-docs/edit/main/',
      },
      lastUpdated: true,
      sidebar: [
        {
          label: 'Get started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Authentication', slug: 'getting-started/authentication' },
            { label: 'Testing', slug: 'getting-started/testing' },
          ],
        },
        {
          label: 'SDKs',
          items: [{ autogenerate: { directory: 'sdks' } }],
        },
        {
          label: 'Endpoints',
          items: [{ autogenerate: { directory: 'endpoints' } }],
        },
        {
          label: 'Webhooks',
          items: [
            { label: 'Overview', slug: 'webhooks/overview' },
            { autogenerate: { directory: 'webhooks/events' } },
          ],
        },
        {
          label: 'Redirects',
          items: [{ autogenerate: { directory: 'redirects' } }],
        },
        {
          label: 'Objects',
          collapsed: true,
          items: [{ autogenerate: { directory: 'objects' } }],
        },
      ],
    }),
  ],
});
