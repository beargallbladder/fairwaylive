/**
 * Integration Test Agent - Tests API endpoints and WebSocket connections
 */

class IntegrationTestAgent {
  constructor() {
    this.name = 'integration-test';
    this.baseUrl = window.location.origin;
    this.results = {
      endpoints_tested: 0,
      endpoints_passed: 0,
      websocket_tests: {},
      failed_tests: [],
      performance_metrics: {}
    };
  }

  async run() {
    console.log('🔌 Integration Test Agent starting...');
    
    await this.testAPIEndpoints();
    await this.testWebSocketConnections();
    await this.testDataFlow();
    await this.testAuthentication();
    
    return this.generateReport();
  }

  async testAPIEndpoints() {
    const endpoints = [
      {
        name: 'quick_start',
        method: 'POST',
        url: '/api/rounds/quick-start',
        body: { latitude: 37.5665, longitude: 126.9780 },
        expectedStatus: 200,
        validateResponse: (data) => data.round && data.course
      },
      {
        name: 'quick_start_invalid',
        method: 'POST',
        url: '/api/rounds/quick-start',
        body: { latitude: 'invalid' },
        expectedStatus: 400
      },
      {
        name: 'voice_upload',
        method: 'POST',
        url: '/api/voice/upload',
        body: new FormData(),
        setupBody: (formData) => {
          // Create a mock audio blob
          const audioBlob = new Blob(['mock audio'], { type: 'audio/webm' });
          formData.append('audio', audioBlob, 'test.webm');
          formData.append('roundId', 'test-round-123');
          return formData;
        },
        expectedStatus: 200,
        validateResponse: (data) => data.transcription
      },
      {
        name: 'betting_odds',
        method: 'GET',
        url: '/api/betting/odds',
        expectedStatus: 200,
        validateResponse: (data) => Array.isArray(data)
      },
      {
        name: 'auth_verify',
        method: 'GET',
        url: '/api/auth/verify',
        headers: { 'Authorization': 'Bearer mock-token' },
        expectedStatus: [200, 401]
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint);
    }
  }

  async testEndpoint(config) {
    this.results.endpoints_tested++;
    const startTime = performance.now();
    
    try {
      const options = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      };
      
      if (config.body) {
        if (config.body instanceof FormData) {
          delete options.headers['Content-Type'];
          options.body = config.setupBody ? config.setupBody(config.body) : config.body;
        } else {
          options.body = JSON.stringify(config.body);
        }
      }
      
      const response = await fetch(this.baseUrl + config.url, options);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Check status
      const expectedStatuses = Array.isArray(config.expectedStatus) 
        ? config.expectedStatus 
        : [config.expectedStatus];
      
      if (!expectedStatuses.includes(response.status)) {
        this.results.failed_tests.push({
          test: config.name,
          reason: `Expected status ${config.expectedStatus}, got ${response.status}`,
          responseTime: `${responseTime.toFixed(2)}ms`
        });
        return;
      }
      
      // Validate response if needed
      if (config.validateResponse && response.ok) {
        const data = await response.json();
        if (!config.validateResponse(data)) {
          this.results.failed_tests.push({
            test: config.name,
            reason: 'Response validation failed',
            response: data
          });
          return;
        }
      }
      
      this.results.endpoints_passed++;
      this.results.performance_metrics[config.name] = responseTime;
      
    } catch (error) {
      this.results.failed_tests.push({
        test: config.name,
        reason: error.message,
        error: true
      });
    }
  }

  async testWebSocketConnections() {
    // Test main WebSocket
    await this.testWebSocket('main', '/ws');
    
    // Test swarm WebSocket
    await this.testWebSocket('swarm', '/swarm');
  }

  async testWebSocket(name, path) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const ws = new WebSocket(`ws://${window.location.host}${path}`);
      let connected = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          this.results.websocket_tests[name] = {
            status: 'fail',
            reason: 'Connection timeout',
            time: performance.now() - startTime
          };
          ws.close();
          resolve();
        }
      }, 5000);
      
      ws.onopen = () => {
        connected = true;
        clearTimeout(timeout);
        const connectionTime = performance.now() - startTime;
        
        // Test echo
        ws.send(JSON.stringify({ type: 'ping' }));
        
        setTimeout(() => {
          ws.close();
          this.results.websocket_tests[name] = {
            status: 'pass',
            connectionTime: `${connectionTime.toFixed(2)}ms`,
            stable: true
          };
          resolve();
        }, 1000);
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        this.results.websocket_tests[name] = {
          status: 'fail',
          reason: 'Connection error',
          error: error.message || 'Unknown error'
        };
        resolve();
      };
    });
  }

  async testDataFlow() {
    // Test complete data flow from frontend to backend
    const testFlow = {
      name: 'complete_data_flow',
      steps: []
    };
    
    try {
      // Step 1: Create a round
      const roundResponse = await fetch(this.baseUrl + '/api/rounds/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: 37.5665, longitude: 126.9780 })
      });
      
      if (!roundResponse.ok) {
        testFlow.status = 'fail';
        testFlow.failedAt = 'round_creation';
      } else {
        const roundData = await roundResponse.json();
        testFlow.steps.push('round_created');
        
        // Step 2: Submit a score
        const scoreResponse = await fetch(`${this.baseUrl}/api/rounds/${roundData.round.id}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hole: 1,
            score: 4,
            playerId: 'user'
          })
        });
        
        if (scoreResponse.ok) {
          testFlow.steps.push('score_submitted');
          testFlow.status = 'pass';
        } else {
          testFlow.status = 'fail';
          testFlow.failedAt = 'score_submission';
        }
      }
    } catch (error) {
      testFlow.status = 'fail';
      testFlow.error = error.message;
    }
    
    if (testFlow.status === 'fail') {
      this.results.failed_tests.push(testFlow);
    }
  }

  async testAuthentication() {
    const authTests = {
      name: 'authentication_flow',
      tests: {}
    };
    
    try {
      // Test registration
      const registerResponse = await fetch(this.baseUrl + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test_${Date.now()}@example.com`,
          password: 'TestPass123!',
          name: 'Test User'
        })
      });
      
      authTests.tests.registration = registerResponse.ok ? 'pass' : 'fail';
      
      if (registerResponse.ok) {
        const { token } = await registerResponse.json();
        
        // Test token verification
        const verifyResponse = await fetch(this.baseUrl + '/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        authTests.tests.verification = verifyResponse.ok ? 'pass' : 'fail';
      }
    } catch (error) {
      authTests.error = error.message;
      this.results.failed_tests.push(authTests);
    }
  }

  calculateWebSocketStability() {
    const wsTests = Object.values(this.results.websocket_tests);
    const passedTests = wsTests.filter(t => t.status === 'pass').length;
    return wsTests.length > 0 ? (passedTests / wsTests.length * 100).toFixed(0) + '%' : '0%';
  }

  generateReport() {
    const avgResponseTime = Object.values(this.results.performance_metrics).reduce((a, b) => a + b, 0) / 
      Object.keys(this.results.performance_metrics).length || 0;
    
    return {
      agent: this.name,
      status: this.results.failed_tests.length === 0 ? 'pass' : 'fail',
      endpoints_tested: this.results.endpoints_tested,
      endpoints_passed: this.results.endpoints_passed,
      websocket_stability: this.calculateWebSocketStability(),
      websocket_tests: this.results.websocket_tests,
      average_response_time: `${avgResponseTime.toFixed(2)}ms`,
      failed_tests: this.results.failed_tests,
      performance_metrics: this.results.performance_metrics,
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.IntegrationTestAgent = IntegrationTestAgent;
}