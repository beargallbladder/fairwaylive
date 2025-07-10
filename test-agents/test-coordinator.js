/**
 * Test Coordinator - Orchestrates all test agents and generates comprehensive report
 */

class TestCoordinator {
  constructor() {
    this.agents = [];
    this.results = {};
    this.startTime = null;
    this.endTime = null;
  }

  async initialize() {
    // Load all test agents
    const agentScripts = [
      'module-fix-agent.js',
      'integration-test-agent.js',
      'ui-flow-test-agent.js',
      'voice-media-test-agent.js',
      'betting-logic-agent.js',
      'performance-agent.js',
      'cross-browser-agent.js'
    ];

    // Check which agents are available
    if (window.ModuleFixAgent) this.agents.push(new ModuleFixAgent());
    if (window.IntegrationTestAgent) this.agents.push(new IntegrationTestAgent());
    if (window.UIFlowTestAgent) this.agents.push(new UIFlowTestAgent());
    if (window.VoiceMediaTestAgent) this.agents.push(new VoiceMediaTestAgent());
    if (window.BettingLogicAgent) this.agents.push(new BettingLogicAgent());
    if (window.PerformanceAgent) this.agents.push(new PerformanceAgent());
    if (window.CrossBrowserAgent) this.agents.push(new CrossBrowserAgent());

    console.log(`🤖 Test Coordinator initialized with ${this.agents.length} agents`);
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive test suite...');
    this.startTime = new Date();
    
    // Run Module Fix Agent first (critical)
    const moduleFixAgent = this.agents.find(a => a.name === 'module-fix');
    if (moduleFixAgent) {
      console.log('\n📌 Running critical module fix tests first...');
      const moduleResults = await moduleFixAgent.run();
      this.results[moduleFixAgent.name] = moduleResults;
      
      if (moduleResults.criticalIssue) {
        console.error('❌ Critical module loading issue detected! Other tests may fail.');
        console.log('💡 Recommendation: Fix module loading issues before running other tests.');
      }
    }
    
    // Run remaining agents in parallel for speed
    const remainingAgents = this.agents.filter(a => a.name !== 'module-fix');
    const promises = remainingAgents.map(agent => this.runAgent(agent));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.results[remainingAgents[index].name] = result.value;
      } else {
        this.results[remainingAgents[index].name] = {
          status: 'error',
          error: result.reason.message
        };
      }
    });
    
    this.endTime = new Date();
    return this.generateReport();
  }

  async runAgent(agent) {
    console.log(`\n🔧 Running ${agent.name} agent...`);
    try {
      const result = await agent.run();
      console.log(`✅ ${agent.name} completed`);
      return result;
    } catch (error) {
      console.error(`❌ ${agent.name} failed:`, error);
      throw error;
    }
  }

  calculateOverallStatus(results) {
    const criticalAgents = ['module-fix', 'integration-test'];
    const agentStatuses = Object.entries(results);
    
    // If any critical agent fails, overall status is fail
    for (const [agentName, result] of agentStatuses) {
      if (criticalAgents.includes(agentName) && result.status !== 'pass') {
        return 'fail';
      }
    }
    
    // Calculate pass percentage for non-critical agents
    const nonCriticalResults = agentStatuses.filter(([name]) => !criticalAgents.includes(name));
    const passedAgents = nonCriticalResults.filter(([_, result]) => result.status === 'pass').length;
    const passPercentage = (passedAgents / nonCriticalResults.length) * 100;
    
    if (passPercentage >= 80) return 'pass';
    if (passPercentage >= 60) return 'partial';
    return 'fail';
  }

  extractCriticalIssues(results) {
    const criticalIssues = [];
    
    // Module loading issues are always critical
    if (results['module-fix']?.criticalIssue) {
      criticalIssues.push({
        agent: 'module-fix',
        issue: 'ES Module loading prevents app initialization',
        impact: 'Application completely non-functional',
        priority: 1
      });
    }
    
    // API failures are critical
    if (results['integration-test']?.endpoints_passed < results['integration-test']?.endpoints_tested * 0.8) {
      criticalIssues.push({
        agent: 'integration-test',
        issue: 'Multiple API endpoints failing',
        impact: 'Core functionality broken',
        priority: 2
      });
    }
    
    // UI flow failures
    if (results['ui-flow-test']?.broken_flows?.length > 3) {
      criticalIssues.push({
        agent: 'ui-flow-test',
        issue: 'Multiple user flows broken',
        impact: 'Poor user experience',
        priority: 3
      });
    }
    
    return criticalIssues;
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // Aggregate all agent recommendations
    Object.entries(results).forEach(([agentName, result]) => {
      if (result.recommendations) {
        recommendations.push(...result.recommendations.map(rec => ({
          agent: agentName,
          recommendation: rec
        })));
      }
    });
    
    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityMap = {
        'module-fix': 1,
        'integration-test': 2,
        'ui-flow-test': 3,
        'voice-media-test': 4,
        'betting-logic': 5,
        'performance': 6,
        'cross-browser': 7
      };
      return (priorityMap[a.agent] || 99) - (priorityMap[b.agent] || 99);
    });
  }

  generateExecutiveSummary(results, status) {
    const totalTests = Object.values(results).reduce((sum, r) => 
      sum + (r.tests ? Object.keys(r.tests).length : 0), 0
    );
    const passedTests = Object.values(results).reduce((sum, r) => 
      sum + (r.tests ? Object.values(r.tests).filter(t => t === 'pass').length : 0), 0
    );
    
    return {
      overall_health: status,
      test_coverage: `${Math.round((passedTests / totalTests) * 100)}%`,
      critical_issues_count: this.extractCriticalIssues(results).length,
      agents_run: Object.keys(results).length,
      total_duration: `${((this.endTime - this.startTime) / 1000).toFixed(1)}s`,
      can_deploy: status === 'pass',
      needs_immediate_attention: status === 'fail'
    };
  }

  generateReport() {
    const overallStatus = this.calculateOverallStatus(this.results);
    
    const report = {
      test_suite: 'FairwayLive Comprehensive Test Suite',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      duration: `${((this.endTime - this.startTime) / 1000).toFixed(1)}s`,
      executive_summary: this.generateExecutiveSummary(this.results, overallStatus),
      overall_status: overallStatus,
      agent_results: this.results,
      critical_issues: this.extractCriticalIssues(this.results),
      recommendations: this.generateRecommendations(this.results),
      next_steps: this.generateNextSteps(overallStatus),
      test_metrics: this.generateTestMetrics()
    };
    
    // Output report
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    console.log(JSON.stringify(report, null, 2));
    
    // Save report to window for access
    window.testReport = report;
    
    // Create downloadable report
    this.createDownloadableReport(report);
    
    return report;
  }

  generateNextSteps(status) {
    switch (status) {
      case 'fail':
        return [
          'Fix critical module loading issue immediately',
          'Run Module Fix Agent recommendations',
          'Re-run test suite after fixes',
          'Do not deploy until critical issues resolved'
        ];
      case 'partial':
        return [
          'Address high-priority issues from failed agents',
          'Fix broken user flows',
          'Improve test coverage for failed areas',
          'Consider staged deployment with feature flags'
        ];
      case 'pass':
        return [
          'Review performance metrics for optimization opportunities',
          'Set up continuous monitoring',
          'Plan incremental improvements',
          'Safe to deploy to production'
        ];
      default:
        return ['Review test results and create action plan'];
    }
  }

  generateTestMetrics() {
    const metrics = {
      total_assertions: 0,
      passed_assertions: 0,
      failed_assertions: 0,
      error_rate: '0%',
      test_coverage: {},
      performance_summary: {}
    };
    
    // Aggregate metrics from all agents
    Object.entries(this.results).forEach(([agentName, result]) => {
      if (result.tests) {
        const tests = Object.values(result.tests);
        metrics.total_assertions += tests.length;
        metrics.passed_assertions += tests.filter(t => t === 'pass').length;
        metrics.failed_assertions += tests.filter(t => t === 'fail').length;
      }
      
      // Coverage by area
      metrics.test_coverage[agentName] = result.status;
      
      // Performance metrics
      if (result.performance_metrics || result.average_response_time) {
        metrics.performance_summary[agentName] = 
          result.average_response_time || result.performance_metrics;
      }
    });
    
    metrics.error_rate = metrics.total_assertions > 0 
      ? `${((metrics.failed_assertions / metrics.total_assertions) * 100).toFixed(1)}%`
      : '0%';
    
    return metrics;
  }

  createDownloadableReport(report) {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `fairwaylive-test-report-${timestamp}.json`;
    
    // Create download button
    const button = document.createElement('button');
    button.textContent = '📥 Download Test Report';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 9999;
    `;
    button.onclick = () => link.click();
    
    document.body.appendChild(button);
    
    // Remove button after 30 seconds
    setTimeout(() => button.remove(), 30000);
  }
}

// Auto-initialize and provide global access
if (typeof window !== 'undefined') {
  window.TestCoordinator = TestCoordinator;
  
  // Create convenience function to run all tests
  window.runComprehensiveTests = async function() {
    const coordinator = new TestCoordinator();
    await coordinator.initialize();
    return await coordinator.runAllTests();
  };
  
  console.log('🎯 Test Coordinator ready. Run window.runComprehensiveTests() to start.');
}