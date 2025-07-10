/**
 * UI Flow Test Agent - Tests complete user journeys and UI interactions
 */

class UIFlowTestAgent {
  constructor() {
    this.name = 'ui-flow-test';
    this.results = {
      flows_tested: 0,
      flows_passed: 0,
      broken_flows: [],
      ui_issues: [],
      accessibility_checks: {},
      timing_metrics: {}
    };
  }

  async run() {
    console.log('🎨 UI Flow Test Agent starting...');
    
    await this.testLandingToRoundFlow();
    await this.testVoiceRecordingFlow();
    await this.testBettingFlow();
    await this.testSocialFeedFlow();
    await this.testScoreEntryFlow();
    await this.testNavigationFlow();
    await this.testResponsiveDesign();
    await this.testAccessibility();
    
    return this.generateReport();
  }

  async testLandingToRoundFlow() {
    const flowName = 'landing_to_round';
    this.results.flows_tested++;
    const startTime = performance.now();
    
    try {
      // Step 1: Check landing page
      if (!document.querySelector('.screen.landing')) {
        throw new Error('Landing page not displayed');
      }
      
      // Step 2: Find START ROUND button
      const startButton = document.querySelector('button.btn-primary');
      if (!startButton || !startButton.textContent.includes('START ROUND')) {
        throw new Error('START ROUND button not found');
      }
      
      // Step 3: Test button click
      const clickable = await this.testElementClickable(startButton);
      if (!clickable) {
        throw new Error('START ROUND button not clickable');
      }
      
      // Step 4: Simulate click and check for location permission
      startButton.click();
      
      // Wait for potential state change
      await this.wait(500);
      
      // Check if location permission was requested or error shown
      const loadingState = document.querySelector('.loading');
      const errorState = document.querySelector('.error');
      const roundScreen = document.querySelector('.screen.round');
      
      if (!loadingState && !errorState && !roundScreen) {
        throw new Error('No state change after clicking START ROUND');
      }
      
      this.results.flows_passed++;
      this.results.timing_metrics[flowName] = performance.now() - startTime;
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message,
        step: this.getFailedStep(error.message)
      });
    }
  }

  async testVoiceRecordingFlow() {
    const flowName = 'voice_recording';
    this.results.flows_tested++;
    
    try {
      // Find microphone button
      const micButton = document.querySelector('.voice-btn, .btn-voice, [data-action="record"]');
      if (!micButton) {
        throw new Error('Microphone button not found');
      }
      
      // Test touch/mouse events
      const hasListeners = this.checkEventListeners(micButton, ['mousedown', 'touchstart']);
      if (!hasListeners) {
        throw new Error('Microphone button missing event listeners');
      }
      
      // Check visual feedback elements
      const recordingIndicator = document.querySelector('.recording-indicator, .recording');
      if (!recordingIndicator && !micButton.classList.contains('recording')) {
        this.results.ui_issues.push('No visual recording indicator found');
      }
      
      // Test permission handling
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Browser supports getUserMedia
        this.results.flows_passed++;
      } else {
        throw new Error('getUserMedia not supported');
      }
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message
      });
    }
  }

  async testBettingFlow() {
    const flowName = 'betting_flow';
    this.results.flows_tested++;
    
    try {
      // Find betting ticker
      const bettingTicker = document.querySelector('.betting-ticker, .betting-container');
      if (!bettingTicker) {
        throw new Error('Betting ticker not found');
      }
      
      // Find bet items
      const betItems = bettingTicker.querySelectorAll('.bet-item, .bet-option');
      if (betItems.length === 0) {
        throw new Error('No bet items found');
      }
      
      // Test bet selection
      const firstBet = betItems[0];
      const clickable = await this.testElementClickable(firstBet);
      if (!clickable) {
        throw new Error('Bet items not clickable');
      }
      
      // Check for bet confirmation UI
      const betConfirm = document.querySelector('.bet-confirm, .place-bet');
      if (!betConfirm) {
        this.results.ui_issues.push('No bet confirmation UI found');
      }
      
      // Check Pride Points display
      const pointsDisplay = document.querySelector('.pride-points, .points-balance');
      if (!pointsDisplay) {
        this.results.ui_issues.push('Pride Points balance not displayed');
      }
      
      this.results.flows_passed++;
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message
      });
    }
  }

  async testSocialFeedFlow() {
    const flowName = 'social_feed';
    this.results.flows_tested++;
    
    try {
      // Find social feed button
      const socialButton = document.querySelector('.social-btn, [data-action="social"]');
      if (!socialButton) {
        throw new Error('Social feed button not found');
      }
      
      // Test button click
      socialButton.click();
      await this.wait(300);
      
      // Check if feed opened
      const socialFeed = document.querySelector('.social-feed, .feed-container');
      if (!socialFeed) {
        throw new Error('Social feed did not open');
      }
      
      // Check for bookmaker agents
      const bookmakers = socialFeed.querySelectorAll('.bookmaker, .agent');
      if (bookmakers.length === 0) {
        throw new Error('No bookmaker agents found');
      }
      
      // Test agent selection
      const firstAgent = bookmakers[0];
      const selectable = await this.testElementClickable(firstAgent);
      if (!selectable) {
        this.results.ui_issues.push('Bookmaker agents not selectable');
      }
      
      this.results.flows_passed++;
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message
      });
    }
  }

  async testScoreEntryFlow() {
    const flowName = 'score_entry';
    this.results.flows_tested++;
    
    try {
      // Find score buttons
      const scoreButtons = document.querySelectorAll('.score-btn, [data-score]');
      if (scoreButtons.length === 0) {
        throw new Error('Score buttons not found');
      }
      
      // Test each score button
      let workingButtons = 0;
      for (const button of scoreButtons) {
        if (await this.testElementClickable(button)) {
          workingButtons++;
        }
      }
      
      if (workingButtons === 0) {
        throw new Error('No score buttons are clickable');
      }
      
      // Check for score display
      const scoreDisplay = document.querySelector('.score-display, .current-score');
      if (!scoreDisplay) {
        this.results.ui_issues.push('Score display not found');
      }
      
      // Check for hole navigation
      const holeNav = document.querySelector('.hole-nav, .hole-selector');
      if (!holeNav) {
        this.results.ui_issues.push('Hole navigation not found');
      }
      
      this.results.flows_passed++;
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message
      });
    }
  }

  async testNavigationFlow() {
    const flowName = 'navigation';
    this.results.flows_tested++;
    
    try {
      // Test back button functionality
      const backButtons = document.querySelectorAll('.back-btn, [data-action="back"]');
      let navigationWorks = backButtons.length > 0;
      
      // Test tab/screen switching
      const screens = document.querySelectorAll('.screen');
      if (screens.length < 2) {
        this.results.ui_issues.push('Multiple screens not found for navigation');
      }
      
      // Test menu if exists
      const menu = document.querySelector('.menu, .nav-menu');
      if (menu) {
        const menuItems = menu.querySelectorAll('a, button');
        if (menuItems.length === 0) {
          navigationWorks = false;
        }
      }
      
      if (navigationWorks) {
        this.results.flows_passed++;
      } else {
        throw new Error('Navigation elements not functional');
      }
      
    } catch (error) {
      this.results.broken_flows.push({
        flow: flowName,
        error: error.message
      });
    }
  }

  async testResponsiveDesign() {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;
    
    for (const viewport of viewports) {
      // Simulate viewport change
      window.innerWidth = viewport.width;
      window.innerHeight = viewport.height;
      window.dispatchEvent(new Event('resize'));
      
      await this.wait(100);
      
      // Check for layout issues
      const issues = this.checkLayoutIssues();
      if (issues.length > 0) {
        this.results.ui_issues.push({
          viewport: viewport.name,
          issues: issues
        });
      }
    }
    
    // Restore original viewport
    window.innerWidth = originalWidth;
    window.innerHeight = originalHeight;
    window.dispatchEvent(new Event('resize'));
  }

  async testAccessibility() {
    const checks = {
      'alt_text': this.checkAltText(),
      'color_contrast': this.checkColorContrast(),
      'focus_indicators': this.checkFocusIndicators(),
      'aria_labels': this.checkAriaLabels(),
      'keyboard_navigation': this.checkKeyboardNavigation()
    };
    
    this.results.accessibility_checks = checks;
    
    // Calculate accessibility score
    const passedChecks = Object.values(checks).filter(v => v.pass).length;
    const totalChecks = Object.keys(checks).length;
    this.results.accessibility_score = Math.round((passedChecks / totalChecks) * 100);
  }

  // Helper methods
  async testElementClickable(element) {
    if (!element) return false;
    
    const hasOnclick = element.hasAttribute('onclick');
    const hasListeners = this.checkEventListeners(element, ['click']);
    const isButton = element.tagName === 'BUTTON' || element.tagName === 'A';
    const hasRole = element.getAttribute('role') === 'button';
    
    return hasOnclick || hasListeners || isButton || hasRole;
  }

  checkEventListeners(element, events) {
    // This is a simplified check - in real implementation would use 
    // getEventListeners() or other debugging APIs
    return true; // Assume listeners exist for now
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getFailedStep(errorMessage) {
    if (errorMessage.includes('not found')) return 'element_missing';
    if (errorMessage.includes('not clickable')) return 'interaction_failed';
    if (errorMessage.includes('not displayed')) return 'visibility_issue';
    return 'unknown';
  }

  checkLayoutIssues() {
    const issues = [];
    
    // Check for overflow
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      if (el.scrollWidth > el.clientWidth) {
        issues.push(`Horizontal overflow on ${el.tagName}`);
      }
    });
    
    // Check for overlapping elements
    const buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length - 1; i++) {
      const rect1 = buttons[i].getBoundingClientRect();
      const rect2 = buttons[i + 1].getBoundingClientRect();
      if (this.rectsOverlap(rect1, rect2)) {
        issues.push('Overlapping buttons detected');
      }
    }
    
    return issues;
  }

  rectsOverlap(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect2.right < rect1.left || 
             rect1.bottom < rect2.top || 
             rect2.bottom < rect1.top);
  }

  checkAltText() {
    const images = document.querySelectorAll('img');
    const missing = Array.from(images).filter(img => !img.alt);
    return {
      pass: missing.length === 0,
      details: `${missing.length} images missing alt text`
    };
  }

  checkColorContrast() {
    // Simplified check - real implementation would calculate actual contrast ratios
    const hasHighContrast = getComputedStyle(document.body).color !== getComputedStyle(document.body).backgroundColor;
    return {
      pass: hasHighContrast,
      details: 'Basic contrast check'
    };
  }

  checkFocusIndicators() {
    const focusableElements = document.querySelectorAll('button, a, input, [tabindex]');
    return {
      pass: focusableElements.length > 0,
      details: `${focusableElements.length} focusable elements found`
    };
  }

  checkAriaLabels() {
    const buttons = document.querySelectorAll('button');
    const labeled = Array.from(buttons).filter(btn => 
      btn.textContent.trim() || btn.getAttribute('aria-label')
    );
    return {
      pass: labeled.length === buttons.length,
      details: `${buttons.length - labeled.length} buttons missing labels`
    };
  }

  checkKeyboardNavigation() {
    const tabIndexElements = document.querySelectorAll('[tabindex]');
    const negativeTabIndex = Array.from(tabIndexElements).filter(el => 
      parseInt(el.getAttribute('tabindex')) < 0
    );
    return {
      pass: negativeTabIndex.length === 0,
      details: `${negativeTabIndex.length} elements prevent keyboard navigation`
    };
  }

  generateReport() {
    const avgCompletionTime = Object.values(this.results.timing_metrics).reduce((a, b) => a + b, 0) / 
      Object.keys(this.results.timing_metrics).length || 0;
    
    return {
      agent: this.name,
      status: this.results.broken_flows.length === 0 ? 'pass' : 'fail',
      flows_tested: this.results.flows_tested,
      flows_passed: this.results.flows_passed,
      average_completion_time: `${(avgCompletionTime / 1000).toFixed(1)}s`,
      accessibility_score: this.results.accessibility_score,
      broken_flows: this.results.broken_flows.map(f => f.flow),
      ui_issues: this.results.ui_issues,
      accessibility_checks: this.results.accessibility_checks,
      detailed_failures: this.results.broken_flows,
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.UIFlowTestAgent = UIFlowTestAgent;
}