/**
 * Module Fix Agent - Tests and fixes module loading issues
 */

class ModuleFixAgent {
  constructor() {
    this.name = 'module-fix';
    this.results = {
      tests: {},
      errors: [],
      recommendations: []
    };
  }

  async run() {
    console.log('🔧 Module Fix Agent starting...');
    
    await this.testModuleLoading();
    await this.testGlobalAccess();
    await this.testErrorHandling();
    await this.testDependencyOrder();
    await this.proposeFixestest EventHandlers();
    
    return this.generateReport();
  }

  async testModuleLoading() {
    const testName = 'module_loading';
    try {
      // Check if app.js is loaded as module
      const appScript = document.querySelector('script[src*="app.js"]');
      const isModule = appScript?.type === 'module';
      
      // Check package.json type
      const response = await fetch('/package.json');
      const packageJson = await response.json();
      const isESModule = packageJson.type === 'module';
      
      if (isModule && isESModule) {
        // Check if global app is available
        if (typeof window.app === 'undefined') {
          this.results.tests[testName] = 'fail';
          this.results.errors.push('app.js loaded as module but window.app not available');
          this.results.recommendations.push('Remove type="module" or properly export/import');
        } else {
          this.results.tests[testName] = 'pass';
        }
      } else if (!isModule && !isESModule) {
        this.results.tests[testName] = 'pass';
      } else {
        this.results.tests[testName] = 'fail';
        this.results.errors.push('Mismatch between script type and package.json type');
      }
    } catch (error) {
      this.results.tests[testName] = 'error';
      this.results.errors.push(`Module loading test failed: ${error.message}`);
    }
  }

  async testGlobalAccess() {
    const testName = 'global_access';
    try {
      // Test if required globals are available
      const requiredGlobals = ['SwarmClient', 'BettingEngine', 'BookmakerAgents', 'socialFeed'];
      const missingGlobals = [];
      
      for (const global of requiredGlobals) {
        if (typeof window[global] === 'undefined') {
          missingGlobals.push(global);
        }
      }
      
      if (missingGlobals.length === 0) {
        this.results.tests[testName] = 'pass';
      } else {
        this.results.tests[testName] = 'fail';
        this.results.errors.push(`Missing globals: ${missingGlobals.join(', ')}`);
        this.results.recommendations.push('Ensure all dependencies set window properties');
      }
    } catch (error) {
      this.results.tests[testName] = 'error';
      this.results.errors.push(`Global access test failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    const testName = 'error_handling';
    try {
      // Check if error boundaries exist
      const hasErrorBoundaries = window.onerror !== null || window.addEventListener.toString().includes('error');
      
      // Check if app has try-catch blocks
      const appCode = window.FairwayLive?.toString() || '';
      const hasTryCatch = appCode.includes('try') && appCode.includes('catch');
      
      if (hasErrorBoundaries || hasTryCatch) {
        this.results.tests[testName] = 'pass';
      } else {
        this.results.tests[testName] = 'fail';
        this.results.errors.push('No error handling detected');
        this.results.recommendations.push('Add global error handler and try-catch blocks');
      }
    } catch (error) {
      this.results.tests[testName] = 'error';
      this.results.errors.push(`Error handling test failed: ${error.message}`);
    }
  }

  async testDependencyOrder() {
    const testName = 'dependency_order';
    try {
      // Check script loading order
      const scripts = Array.from(document.querySelectorAll('script[src*="/js/"]'));
      const scriptOrder = scripts.map(s => s.src.split('/').pop());
      
      const expectedOrder = [
        'swarm-client.js',
        'betting-engine.js',
        'bookmaker-agents.js',
        'social-feed.js',
        'app.js'
      ];
      
      const isCorrectOrder = expectedOrder.every((script, index) => 
        scriptOrder[index] === script
      );
      
      if (isCorrectOrder) {
        this.results.tests[testName] = 'pass';
      } else {
        this.results.tests[testName] = 'fail';
        this.results.errors.push('Scripts loaded in wrong order');
        this.results.recommendations.push(`Correct order: ${expectedOrder.join(' → ')}`);
      }
    } catch (error) {
      this.results.tests[testName] = 'error';
      this.results.errors.push(`Dependency order test failed: ${error.message}`);
    }
  }

  async testEventHandlers() {
    const testName = 'event_handlers';
    try {
      // Find all elements with onclick attributes
      const elementsWithOnclick = document.querySelectorAll('[onclick]');
      const brokenHandlers = [];
      
      elementsWithOnclick.forEach(element => {
        const handler = element.getAttribute('onclick');
        if (handler.includes('app.') && typeof window.app === 'undefined') {
          brokenHandlers.push({
            element: element.tagName,
            handler: handler,
            text: element.textContent.trim()
          });
        }
      });
      
      if (brokenHandlers.length === 0) {
        this.results.tests[testName] = 'pass';
      } else {
        this.results.tests[testName] = 'fail';
        this.results.errors.push(`${brokenHandlers.length} broken event handlers found`);
        this.results.recommendations.push('Replace inline handlers with event delegation');
        
        // Log specific broken handlers
        brokenHandlers.slice(0, 3).forEach(h => {
          this.results.errors.push(`  - ${h.element}: "${h.text}" → ${h.handler}`);
        });
      }
    } catch (error) {
      this.results.tests[testName] = 'error';
      this.results.errors.push(`Event handler test failed: ${error.message}`);
    }
  }

  async proposeFixes() {
    // Quick fix solution
    const quickFix = {
      title: 'Quick Fix - Remove Module Declarations',
      steps: [
        '1. In package.json, remove: "type": "module"',
        '2. In index.html, change: <script src="/js/app.js" type="module"> to <script src="/js/app.js">',
        '3. Restart the server'
      ],
      effort: '5 minutes',
      risk: 'low'
    };
    
    // Proper fix solution
    const properFix = {
      title: 'Proper Fix - Refactor to ES6 Modules',
      steps: [
        '1. Export classes from each file (export default ClassName)',
        '2. Import dependencies in app.js',
        '3. Create init.js that imports app and sets window.app',
        '4. Replace inline onclick with addEventListener',
        '5. Add error boundaries and fallbacks'
      ],
      effort: '2-3 hours',
      risk: 'medium'
    };
    
    this.results.recommendations.push(quickFix);
    this.results.recommendations.push(properFix);
  }

  generateReport() {
    const passedTests = Object.values(this.results.tests).filter(t => t === 'pass').length;
    const totalTests = Object.keys(this.results.tests).length;
    
    return {
      agent: this.name,
      status: passedTests === totalTests ? 'pass' : 'fail',
      summary: `${passedTests}/${totalTests} tests passed`,
      tests: this.results.tests,
      errors: this.results.errors,
      recommendations: this.results.recommendations,
      criticalIssue: this.results.tests.module_loading === 'fail' || this.results.tests.global_access === 'fail',
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.ModuleFixAgent = ModuleFixAgent;
}