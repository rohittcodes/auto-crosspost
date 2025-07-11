// Google Analytics configuration for VitePress
export const googleAnalytics = {
  // Your Google Analytics 4 Measurement ID
  // Get this from: https://analytics.google.com/analytics/web/
  // Format: G-XXXXXXXXXX
  measurementId: process.env.VITE_GA_MEASUREMENT_ID || 'G-YOUR_MEASUREMENT_ID',
  
  // Optional: Custom configuration
  config: {
    // Track page views automatically
    send_page_view: true,
    
    // Track site search
    custom_map: {
      'custom_parameter_search_term': 'search_term'
    },
    
    // Enhanced ecommerce (if needed later)
    enhanced_ecommerce: false,
    
    // Privacy settings
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  }
};

// Event tracking helpers
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, parameters);
  }
};

// Common event trackers for documentation
export const trackDocumentationEvents = () => {
  // Track clicks on external links
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.hostname !== window.location.hostname) {
      trackEvent('click', {
        event_category: 'outbound',
        event_label: link.href,
        transport_type: 'beacon'
      });
    }
  });

  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
      maxScroll = scrollPercent;
      trackEvent('scroll', {
        event_category: 'engagement',
        event_label: `${scrollPercent}%`
      });
    }
  });

  // Track time on page
  let startTime = Date.now();
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    trackEvent('timing_complete', {
      name: 'read_time',
      value: timeOnPage
    });
  });
};
