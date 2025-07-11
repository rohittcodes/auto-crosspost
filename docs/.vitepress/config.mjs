import { defineConfig } from 'vitepress'
import { googleAnalytics } from './analytics.js'

export default defineConfig({
  title: 'Auto-CrossPost SDK',
  description: 'Automatically cross-post your blog content to multiple platforms',
  base: '/auto-crosspost/', // GitHub Pages base path

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#3c82f6' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en' }],
    ['meta', { property: 'og:title', content: 'Auto-CrossPost SDK | Automated Blog Cross-Posting' }],
    ['meta', { property: 'og:site_name', content: 'Auto-CrossPost SDK' }],
    ['meta', { property: 'og:url', content: 'https://auto-crosspost.dev/' }],
    ['meta', { property: 'og:description', content: 'Automatically cross-post your blog content to multiple platforms' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Auto-CrossPost SDK' }],
    ['meta', { name: 'twitter:description', content: 'Automatically cross-post your blog content to multiple platforms' }],
    // Google Analytics 4
    ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalytics.measurementId}` }],
    ['script', {}, `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${googleAnalytics.measurementId}', ${JSON.stringify(googleAnalytics.config)});
    `]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Examples', link: '/examples/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        },
        {
          text: 'Platform Setup',
          items: [
            { text: 'Dev.to Setup', link: '/guide/platforms/devto' },
            { text: 'Hashnode Setup', link: '/guide/platforms/hashnode' }
          ]
        },
        {
          text: 'Usage',
          items: [
            { text: 'SDK Usage', link: '/guide/usage/sdk' },
            { text: 'CLI Usage', link: '/guide/cli' },
            { text: 'Next.js Integration', link: '/guide/usage/nextjs' }
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Transformers', link: '/guide/advanced/transformers' },
            { text: 'Error Handling', link: '/guide/advanced/error-handling' },
            { text: 'Batch Processing', link: '/guide/advanced/batch-processing' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'AutoCrossPost', link: '/api/auto-crosspost' },
            { text: 'ConfigManager', link: '/api/config-manager' },
            { text: 'Platform Clients', link: '/api/platform-clients' },
            { text: 'Types', link: '/api/types' }
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Usage', link: '/examples/basic' },
            { text: 'CLI Examples', link: '/examples/cli' },
            { text: 'Next.js Integration', link: '/examples/nextjs' },
            { text: 'Custom Workflows', link: '/examples/workflows' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rohittcodes/auto-crosspost' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Rohith Singh'
    },

    editLink: {
      pattern: 'https://github.com/rohittcodes/auto-crosspost/edit/main/docs/:path'
    },

    search: {
      provider: 'local'
    }
  },

  sitemap: {
    hostname: 'https://auto-crosspost.dev'
  }
})
