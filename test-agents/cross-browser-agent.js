/**
 * Cross-Browser Agent - Tests compatibility across different browsers and devices
 */

class CrossBrowserAgent {
  constructor() {
    this.name = 'cross-browser';
    this.results = {
      browsers_tested: 0,
      full_compatibility: 0,
      partial_compatibility: 0,
      browser_info: {},
      feature_support: {},
      pwa_tests: {},
      critical_issues: [],
      minor_issues: []
    };
  }

  async run() {
    console.log('🌐 Cross-Browser Test Agent starting...');
    
    await this.detectBrowser();
    await this.testFeatureSupport();
    await this.testPWACapabilities();
    await this.testBrowserSpecificIssues();
    await this.testResponsiveFeatures();
    await this.testTouchSupport();
    
    return this.generateReport();
  }

  async detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Detect browser
    this.results.browser_info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      deviceMemory: navigator.deviceMemory || 'unknown',
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    };

    // Browser detection
    const browsers = {
      chrome: /chrome/.test(ua) && /google inc/.test(navigator.vendor.toLowerCase()),
      firefox: /firefox/.test(ua),
      safari: /safari/.test(ua) && /apple computer/.test(navigator.vendor.toLowerCase()) && !/chrome/.test(ua),
      edge: /edg/.test(ua),
      opera: /opr/.test(ua),
      samsung: /samsungbrowser/.test(ua)
    };

    // OS detection
    const os = {
      ios: /iphone|ipad|ipod/.test(ua),
      android: /android/.test(ua),
      windows: /win/.test(platform),
      mac: /mac/.test(platform),
      linux: /linux/.test(platform)
    };

    // Version detection
    let browserVersion = 'unknown';
    if (browsers.chrome) {
      browserVersion = ua.match(/chrome\/(\d+)/)?.[1] || 'unknown';
    } else if (browsers.firefox) {
      browserVersion = ua.match(/firefox\/(\d+)/)?.[1] || 'unknown';
    } else if (browsers.safari) {
      browserVersion = ua.match(/version\/(\d+)/)?.[1] || 'unknown';
    }

    this.results.browser_info.detected = {
      browser: Object.keys(browsers).find(b => browsers[b]) || 'unknown',
      version: browserVersion,
      os: Object.keys(os).find(o => os[o]) || 'unknown',
      mobile: os.ios || os.android
    };

    this.results.browsers_tested = 1; // Current browser
  }

  async testFeatureSupport() {
    const features = {
      // Core Web APIs
      service_worker: 'serviceWorker' in navigator,
      push_notifications: 'PushManager' in window,
      notifications: 'Notification' in window,
      geolocation: 'geolocation' in navigator,
      media_devices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      
      // Storage APIs
      local_storage: typeof localStorage !== 'undefined',
      session_storage: typeof sessionStorage !== 'undefined',
      indexed_db: 'indexedDB' in window,
      cache_api: 'caches' in window,
      
      // Modern JavaScript
      es6_modules: this.checkES6ModuleSupport(),
      async_await: this.checkAsyncSupport(),
      promises: typeof Promise !== 'undefined',
      arrow_functions: this.checkArrowFunctions(),
      
      // CSS Features
      css_grid: CSS.supports('display', 'grid'),
      css_flexbox: CSS.supports('display', 'flex'),
      css_custom_properties: CSS.supports('--test', 'red'),
      css_sticky: CSS.supports('position', 'sticky'),
      
      // Media
      web_audio: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined',
      media_recorder: typeof MediaRecorder !== 'undefined',
      webrtc: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection),
      
      // Performance
      web_workers: typeof Worker !== 'undefined',
      shared_workers: typeof SharedWorker !== 'undefined',
      request_idle_callback: typeof requestIdleCallback !== 'undefined',
      intersection_observer: typeof IntersectionObserver !== 'undefined',
      
      // PWA Features
      manifest: this.checkManifestSupport(),
      install_prompt: 'BeforeInstallPromptEvent' in window,
      
      // Sensors
      device_orientation: 'DeviceOrientationEvent' in window,
      device_motion: 'DeviceMotionEvent' in window,
      ambient_light: 'AmbientLightSensor' in window,
      
      // Other
      web_share: 'share' in navigator,
      web_bluetooth: 'bluetooth' in navigator,
      battery_api: 'getBattery' in navigator,
      vibration: 'vibrate' in navigator,
      speech_recognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    };

    this.results.feature_support = features;

    // Calculate compatibility score
    const requiredFeatures = [
      'service_worker', 'geolocation', 'media_devices', 'local_storage',
      'promises', 'css_flexbox', 'web_audio', 'media_recorder'
    ];

    const hasAllRequired = requiredFeatures.every(f => features[f]);
    
    if (hasAllRequired) {
      this.results.full_compatibility = 1;
    } else {
      const missingRequired = requiredFeatures.filter(f => !features[f]);
      this.results.critical_issues.push({
        issue: 'Missing required features',
        features: missingRequired
      });
    }

    // Check nice-to-have features
    const optionalFeatures = [
      'push_notifications', 'web_share', 'battery_api', 'speech_recognition'
    ];
    
    const hasOptional = optionalFeatures.filter(f => features[f]).length;
    if (hasOptional < optionalFeatures.length) {
      this.results.partial_compatibility = 1;
    }
  }

  checkES6ModuleSupport() {
    try {
      new Function('import("")');
      return true;
    } catch {
      return false;
    }
  }

  checkAsyncSupport() {
    try {
      new Function('async () => {}');
      return true;
    } catch {
      return false;
    }
  }

  checkArrowFunctions() {
    try {
      new Function('() => {}');
      return true;
    } catch {
      return false;
    }
  }

  checkManifestSupport() {
    const link = document.querySelector('link[rel="manifest"]');
    return !!link;
  }

  async testPWACapabilities() {
    const pwaTests = {
      manifest_present: false,
      service_worker_registered: false,
      https_enabled: location.protocol === 'https:',
      installable: false,
      app_installed: false,
      icons_configured: false,
      start_url_valid: false,
      display_mode: 'browser',
      theme_color: false,
      viewport_configured: false
    };

    try {
      // Check manifest
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        pwaTests.manifest_present = true;
        
        // Try to fetch and validate manifest
        try {
          const response = await fetch(manifestLink.href);
          const manifest = await response.json();
          
          pwaTests.icons_configured = !!(manifest.icons && manifest.icons.length > 0);
          pwaTests.start_url_valid = !!manifest.start_url;
          pwaTests.display_mode = manifest.display || 'browser';
          pwaTests.theme_color = !!manifest.theme_color;
        } catch (e) {
          this.results.minor_issues.push('Manifest file could not be loaded');
        }
      }

      // Check service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        pwaTests.service_worker_registered = !!registration;
      }

      // Check viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      pwaTests.viewport_configured = !!viewport;

      // Check if app is installed
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps();
          pwaTests.app_installed = relatedApps.length > 0;
        } catch (e) {
          // API might not be available
        }
      }

      // Check installability
      pwaTests.installable = pwaTests.manifest_present && 
                            pwaTests.service_worker_registered && 
                            pwaTests.https_enabled;

      // Calculate PWA score
      const pwaScore = Object.values(pwaTests).filter(v => v === true).length / Object.keys(pwaTests).length * 100;
      this.results.pwa_score = Math.round(pwaScore);
      this.results.pwa_tests = pwaTests;

    } catch (error) {
      this.results.pwa_tests.error = error.message;
      this.results.minor_issues.push('PWA tests failed');
    }
  }

  async testBrowserSpecificIssues() {
    const { browser, os, mobile } = this.results.browser_info.detected;
    
    // iOS Safari specific issues
    if (browser === 'safari' && os === 'ios') {
      // Check for common iOS Safari issues
      const issues = [];
      
      // 100vh issue
      if (window.innerHeight !== document.documentElement.clientHeight) {
        issues.push('100vh includes browser UI on iOS Safari');
      }
      
      // Audio autoplay
      issues.push('Audio requires user interaction to play');
      
      // PWA limitations
      if (!('standalone' in navigator)) {
        issues.push('Limited PWA support on iOS');
      }
      
      this.results.minor_issues.push(...issues.map(i => `iOS Safari: ${i}`));
    }

    // Firefox specific
    if (browser === 'firefox') {
      // Check for Firefox-specific issues
      if (!this.results.feature_support.web_share) {
        this.results.minor_issues.push('Firefox: Web Share API not supported');
      }
      
      // Check for mobile-specific issues
      if (mobile) {
        const voiceButton = document.querySelector('.voice-btn');
        if (voiceButton && getComputedStyle(voiceButton).touchAction !== 'manipulation') {
          this.results.minor_issues.push('Firefox mobile: Voice button may have touch delay');
        }
      }
    }

    // Android Chrome specific
    if (browser === 'chrome' && os === 'android') {
      // Check for Android-specific optimizations
      if (!document.querySelector('meta[name="theme-color"]')) {
        this.results.minor_issues.push('Android Chrome: Missing theme-color meta tag');
      }
    }

    // Edge specific
    if (browser === 'edge') {
      // Edge generally has good compatibility, but check for legacy issues
      if (!this.results.feature_support.speech_recognition) {
        this.results.minor_issues.push('Edge: Speech recognition may require prefix');
      }
    }

    // General mobile issues
    if (mobile) {
      // Check for mobile-specific optimizations
      const viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport || !viewport.content.includes('user-scalable=no')) {
        this.results.minor_issues.push('Mobile: Pinch-zoom not disabled');
      }
      
      // Check for touch-optimized buttons
      const buttons = document.querySelectorAll('button');
      const smallButtons = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      });
      
      if (smallButtons.length > 0) {
        this.results.minor_issues.push(`Mobile: ${smallButtons.length} buttons below 44px touch target`);
      }
    }
  }

  async testResponsiveFeatures() {
    // Test media query support
    const mediaQueries = {
      mobile: window.matchMedia('(max-width: 768px)').matches,
      tablet: window.matchMedia('(min-width: 769px) and (max-width: 1024px)').matches,
      desktop: window.matchMedia('(min-width: 1025px)').matches,
      high_dpi: window.matchMedia('(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)').matches,
      dark_mode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      reduced_motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };

    this.results.media_queries = mediaQueries;

    // Check responsive images
    const images = document.querySelectorAll('img');
    let responsiveImages = 0;
    images.forEach(img => {
      if (img.srcset || img.sizes) {
        responsiveImages++;
      }
    });

    if (images.length > 0 && responsiveImages === 0) {
      this.results.minor_issues.push('No responsive images detected');
    }

    // Check font scaling
    const htmlFontSize = getComputedStyle(document.documentElement).fontSize;
    if (!htmlFontSize.includes('rem') && !htmlFontSize.includes('em')) {
      this.results.minor_issues.push('Font sizes not using relative units');
    }
  }

  async testTouchSupport() {
    const touchTests = {
      touch_events: 'ontouchstart' in window,
      pointer_events: 'PointerEvent' in window,
      max_touch_points: navigator.maxTouchPoints || 0,
      force_touch: 'TouchEvent' in window && 'force' in new TouchEvent('touchstart')
    };

    this.results.touch_support = touchTests;

    // Check for touch-friendly UI
    if (touchTests.touch_events || touchTests.max_touch_points > 0) {
      // Device supports touch
      const clickableElements = document.querySelectorAll('button, a, [onclick]');
      let touchOptimized = true;
      
      clickableElements.forEach(el => {
        const styles = getComputedStyle(el);
        // Check for :active states
        if (!styles.transition && !styles.transform) {
          touchOptimized = false;
        }
      });

      if (!touchOptimized) {
        this.results.minor_issues.push('Touch feedback not optimized');
      }
    }
  }

  calculateCompatibilityPercentage() {
    const required = ['service_worker', 'geolocation', 'media_devices', 'local_storage'];
    const important = ['css_grid', 'web_audio', 'media_recorder', 'promises'];
    const nice = ['push_notifications', 'web_share', 'battery_api'];

    let score = 0;
    let total = 0;

    // Required features (weight: 3)
    required.forEach(feature => {
      total += 3;
      if (this.results.feature_support[feature]) score += 3;
    });

    // Important features (weight: 2)
    important.forEach(feature => {
      total += 2;
      if (this.results.feature_support[feature]) score += 2;
    });

    // Nice to have (weight: 1)
    nice.forEach(feature => {
      total += 1;
      if (this.results.feature_support[feature]) score += 1;
    });

    return Math.round((score / total) * 100);
  }

  generateReport() {
    const compatibilityScore = this.calculateCompatibilityPercentage();
    const { browser, version, os, mobile } = this.results.browser_info.detected;
    
    return {
      agent: this.name,
      status: this.results.critical_issues.length === 0 ? 'pass' : 'fail',
      browser_detected: `${browser} ${version} on ${os}${mobile ? ' (mobile)' : ''}`,
      browsers_tested: this.results.browsers_tested,
      full_compatibility: this.results.full_compatibility,
      partial_compatibility: this.results.partial_compatibility,
      compatibility_score: `${compatibilityScore}%`,
      pwa_score: this.results.pwa_score,
      feature_support: this.results.feature_support,
      pwa_tests: this.results.pwa_tests,
      touch_support: this.results.touch_support,
      media_queries: this.results.media_queries,
      critical_issues: this.results.critical_issues,
      minor_issues: this.results.minor_issues,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    const { browser, os, mobile } = this.results.browser_info.detected;

    // Critical feature recommendations
    if (!this.results.feature_support.media_recorder) {
      recommendations.push({
        issue: 'MediaRecorder not supported',
        solution: 'Implement audio recording polyfill or provide alternative UI',
        priority: 'critical'
      });
    }

    if (!this.results.feature_support.service_worker) {
      recommendations.push({
        issue: 'Service Worker not supported',
        solution: 'Provide fallback for offline functionality',
        priority: 'high'
      });
    }

    // Browser-specific recommendations
    if (browser === 'safari' && os === 'ios') {
      recommendations.push({
        issue: 'iOS Safari limitations',
        solution: 'Implement iOS-specific workarounds for audio and PWA features',
        priority: 'high'
      });
    }

    // PWA recommendations
    if (this.results.pwa_score < 80) {
      recommendations.push({
        issue: 'Low PWA score',
        solution: 'Configure manifest, service worker, and HTTPS for better PWA support',
        priority: 'medium'
      });
    }

    // Mobile recommendations
    if (mobile && this.results.minor_issues.some(i => i.includes('touch target'))) {
      recommendations.push({
        issue: 'Small touch targets',
        solution: 'Increase button sizes to minimum 44x44px for better mobile UX',
        priority: 'medium'
      });
    }

    // Performance recommendations
    if (!this.results.feature_support.request_idle_callback) {
      recommendations.push({
        issue: 'RequestIdleCallback not supported',
        solution: 'Use setTimeout fallback for background tasks',
        priority: 'low'
      });
    }

    return recommendations;
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.CrossBrowserAgent = CrossBrowserAgent;
}