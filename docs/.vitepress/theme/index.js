// .vitepress/theme/index.js
import DefaultTheme from 'vitepress/theme'
import { trackDocumentationEvents } from '../analytics.js'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    // Initialize analytics tracking when the app is ready
    if (typeof window !== 'undefined') {
      // Wait for router to be ready
      router.onAfterRouteChanged = (to) => {
        // Track page views for SPA navigation
        if (typeof gtag !== 'undefined') {
          gtag('config', window.GA_MEASUREMENT_ID || 'G-YOUR_MEASUREMENT_ID', {
            page_path: to,
            page_title: document.title
          });
        }
      };

      // Initialize custom event tracking
      setTimeout(() => {
        trackDocumentationEvents();
      }, 1000);
    }
  }
}
