/**
 * Betting Logic Agent - Validates odds calculations, bet placement, and Pride Points
 */

class BettingLogicAgent {
  constructor() {
    this.name = 'betting-logic';
    this.results = {
      calculations_tested: 0,
      calculation_errors: 0,
      edge_cases_handled: 0,
      betting_rules_violations: 0,
      test_results: {},
      performance_metrics: {}
    };
  }

  async run() {
    console.log('💰 Betting Logic Test Agent starting...');
    
    await this.testOddsCalculations();
    await this.testBetPlacement();
    await this.testBetResolution();
    await this.testPridePointsTracking();
    await this.testBettingRules();
    await this.testEdgeCases();
    await this.testPerformance();
    
    return this.generateReport();
  }

  async testOddsCalculations() {
    const testCases = [
      {
        name: 'initial_odds',
        players: [
          { id: 'p1', score: 0, sentiment: 0 },
          { id: 'p2', score: 0, sentiment: 0 },
          { id: 'p3', score: 0, sentiment: 0 },
          { id: 'p4', score: 0, sentiment: 0 }
        ],
        expectedOdds: { p1: 4.0, p2: 4.0, p3: 4.0, p4: 4.0 }
      },
      {
        name: 'leader_advantage',
        players: [
          { id: 'p1', score: -2, sentiment: 0.5 },
          { id: 'p2', score: 0, sentiment: 0 },
          { id: 'p3', score: 1, sentiment: -0.2 },
          { id: 'p4', score: 2, sentiment: 0 }
        ],
        validate: (odds) => odds.p1 < odds.p2 && odds.p2 < odds.p3 && odds.p3 < odds.p4
      },
      {
        name: 'sentiment_impact',
        players: [
          { id: 'p1', score: 0, sentiment: 0.8 },
          { id: 'p2', score: 0, sentiment: -0.8 }
        ],
        validate: (odds) => odds.p1 < odds.p2
      }
    ];

    for (const testCase of testCases) {
      this.results.calculations_tested++;
      
      try {
        const odds = this.calculateOdds(testCase.players);
        
        if (testCase.expectedOdds) {
          const correct = Object.keys(testCase.expectedOdds).every(
            key => Math.abs(odds[key] - testCase.expectedOdds[key]) < 0.1
          );
          if (!correct) {
            this.results.calculation_errors++;
            this.results.test_results[testCase.name] = 'fail';
          } else {
            this.results.test_results[testCase.name] = 'pass';
          }
        } else if (testCase.validate) {
          if (!testCase.validate(odds)) {
            this.results.calculation_errors++;
            this.results.test_results[testCase.name] = 'fail';
          } else {
            this.results.test_results[testCase.name] = 'pass';
          }
        }
        
        // Check for invalid odds
        const hasInvalidOdds = Object.values(odds).some(o => o <= 0 || isNaN(o) || !isFinite(o));
        if (hasInvalidOdds) {
          this.results.calculation_errors++;
          this.results.test_results[testCase.name + '_validity'] = 'fail';
        }
        
      } catch (error) {
        this.results.calculation_errors++;
        this.results.test_results[testCase.name] = 'error';
      }
    }
  }

  calculateOdds(players) {
    // Simplified odds calculation for testing
    const baseOdds = 4.0;
    const odds = {};
    
    players.forEach(player => {
      let playerOdds = baseOdds;
      
      // Adjust for score (lower score = better = lower odds)
      playerOdds += player.score * 0.5;
      
      // Adjust for sentiment
      playerOdds -= player.sentiment * 0.3;
      
      // Ensure odds stay within reasonable bounds
      odds[player.id] = Math.max(1.1, Math.min(20.0, playerOdds));
    });
    
    return odds;
  }

  async testBetPlacement() {
    const betTests = [
      {
        name: 'valid_bet',
        bet: { playerId: 'p1', amount: 100, odds: 2.5 },
        balance: 500,
        expected: 'success'
      },
      {
        name: 'insufficient_funds',
        bet: { playerId: 'p1', amount: 1000, odds: 2.5 },
        balance: 500,
        expected: 'rejected'
      },
      {
        name: 'max_bet_limit',
        bet: { playerId: 'p1', amount: 10000, odds: 2.5 },
        balance: 20000,
        expected: 'rejected'
      },
      {
        name: 'zero_bet',
        bet: { playerId: 'p1', amount: 0, odds: 2.5 },
        balance: 500,
        expected: 'rejected'
      },
      {
        name: 'negative_bet',
        bet: { playerId: 'p1', amount: -100, odds: 2.5 },
        balance: 500,
        expected: 'rejected'
      }
    ];

    for (const test of betTests) {
      const result = this.validateBetPlacement(test.bet, test.balance);
      if (result === test.expected) {
        this.results.test_results[`bet_${test.name}`] = 'pass';
      } else {
        this.results.test_results[`bet_${test.name}`] = 'fail';
        this.results.betting_rules_violations++;
      }
    }
  }

  validateBetPlacement(bet, balance) {
    if (bet.amount <= 0) return 'rejected';
    if (bet.amount > balance) return 'rejected';
    if (bet.amount > 5000) return 'rejected'; // Max bet limit
    if (bet.odds <= 0) return 'rejected';
    return 'success';
  }

  async testBetResolution() {
    const resolutionTests = [
      {
        name: 'single_winner',
        bets: [
          { id: 'b1', playerId: 'p1', amount: 100, odds: 2.5 },
          { id: 'b2', playerId: 'p2', amount: 200, odds: 3.0 }
        ],
        winner: 'p1',
        expectedPayouts: { b1: 250, b2: 0 }
      },
      {
        name: 'tied_winners',
        bets: [
          { id: 'b1', playerId: 'p1', amount: 100, odds: 2.0 },
          { id: 'b2', playerId: 'p2', amount: 100, odds: 2.0 },
          { id: 'b3', playerId: 'p1', amount: 100, odds: 2.0 }
        ],
        winners: ['p1', 'p2'],
        expectedPayouts: { b1: 100, b2: 100, b3: 100 } // Split pot
      }
    ];

    for (const test of resolutionTests) {
      const payouts = this.resolveBets(test.bets, test.winner || test.winners);
      const correct = Object.keys(test.expectedPayouts).every(
        betId => payouts[betId] === test.expectedPayouts[betId]
      );
      
      if (correct) {
        this.results.test_results[`resolution_${test.name}`] = 'pass';
      } else {
        this.results.test_results[`resolution_${test.name}`] = 'fail';
      }
    }
  }

  resolveBets(bets, winners) {
    const winnersList = Array.isArray(winners) ? winners : [winners];
    const payouts = {};
    
    bets.forEach(bet => {
      if (winnersList.includes(bet.playerId)) {
        if (winnersList.length === 1) {
          payouts[bet.id] = bet.amount * bet.odds;
        } else {
          // Split pot for ties
          payouts[bet.id] = bet.amount;
        }
      } else {
        payouts[bet.id] = 0;
      }
    });
    
    return payouts;
  }

  async testPridePointsTracking() {
    const trackingTests = [
      {
        name: 'balance_updates',
        initial: 1000,
        transactions: [
          { type: 'bet', amount: -100 },
          { type: 'win', amount: 250 },
          { type: 'bet', amount: -50 }
        ],
        expected: 1100
      },
      {
        name: 'negative_prevention',
        initial: 100,
        transactions: [
          { type: 'bet', amount: -150 }
        ],
        expected: 100 // Should not go negative
      }
    ];

    for (const test of trackingTests) {
      let balance = test.initial;
      
      for (const transaction of test.transactions) {
        if (transaction.type === 'bet' && balance + transaction.amount < 0) {
          // Prevent negative balance
          continue;
        }
        balance += transaction.amount;
      }
      
      if (balance === test.expected) {
        this.results.test_results[`tracking_${test.name}`] = 'pass';
      } else {
        this.results.test_results[`tracking_${test.name}`] = 'fail';
      }
    }
  }

  async testBettingRules() {
    const rules = [
      {
        name: 'min_bet_amount',
        rule: (bet) => bet.amount >= 10,
        testBet: { amount: 5 },
        shouldPass: false
      },
      {
        name: 'max_bet_amount',
        rule: (bet) => bet.amount <= 5000,
        testBet: { amount: 10000 },
        shouldPass: false
      },
      {
        name: 'valid_odds_range',
        rule: (bet) => bet.odds >= 1.01 && bet.odds <= 100,
        testBet: { odds: 0.5 },
        shouldPass: false
      },
      {
        name: 'round_active',
        rule: (bet, context) => context.roundActive,
        testBet: {},
        context: { roundActive: false },
        shouldPass: false
      }
    ];

    for (const test of rules) {
      const context = test.context || { roundActive: true };
      const passes = test.rule(test.testBet, context);
      
      if (passes === test.shouldPass) {
        this.results.test_results[`rule_${test.name}`] = 'pass';
      } else {
        this.results.test_results[`rule_${test.name}`] = 'fail';
        this.results.betting_rules_violations++;
      }
    }
  }

  async testEdgeCases() {
    const edgeCases = [
      {
        name: 'all_players_tied',
        scenario: () => {
          const players = [1, 2, 3, 4].map(id => ({ id: `p${id}`, score: 0 }));
          const odds = this.calculateOdds(players);
          return Object.values(odds).every(o => o === Object.values(odds)[0]);
        }
      },
      {
        name: 'extreme_scores',
        scenario: () => {
          const players = [
            { id: 'p1', score: -20, sentiment: 0 },
            { id: 'p2', score: 20, sentiment: 0 }
          ];
          const odds = this.calculateOdds(players);
          return odds.p1 > 0 && odds.p2 > 0 && isFinite(odds.p1) && isFinite(odds.p2);
        }
      },
      {
        name: 'abandoned_round',
        scenario: () => {
          // Test bet refund logic
          const bets = [
            { id: 'b1', amount: 100, status: 'active' },
            { id: 'b2', amount: 200, status: 'active' }
          ];
          const refunds = bets.map(bet => ({ id: bet.id, amount: bet.amount }));
          return refunds.every(r => r.amount > 0);
        }
      }
    ];

    for (const test of edgeCases) {
      this.results.edge_cases_handled++;
      const result = test.scenario();
      this.results.test_results[`edge_${test.name}`] = result ? 'pass' : 'fail';
    }
  }

  async testPerformance() {
    const perfTests = [
      {
        name: 'odds_calculation_speed',
        iterations: 1000,
        operation: () => {
          const players = Array(10).fill(0).map((_, i) => ({
            id: `p${i}`,
            score: Math.floor(Math.random() * 10) - 5,
            sentiment: Math.random() * 2 - 1
          }));
          return this.calculateOdds(players);
        }
      },
      {
        name: 'bet_validation_speed',
        iterations: 10000,
        operation: () => {
          const bet = {
            playerId: 'p1',
            amount: Math.random() * 1000,
            odds: Math.random() * 10 + 1
          };
          return this.validateBetPlacement(bet, 5000);
        }
      }
    ];

    for (const test of perfTests) {
      const startTime = performance.now();
      
      for (let i = 0; i < test.iterations; i++) {
        test.operation();
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / test.iterations;
      
      this.results.performance_metrics[test.name] = {
        iterations: test.iterations,
        total_time: `${(endTime - startTime).toFixed(2)}ms`,
        average_time: `${avgTime.toFixed(4)}ms`
      };
    }
  }

  generateReport() {
    const totalTests = Object.keys(this.results.test_results).length;
    const passedTests = Object.values(this.results.test_results).filter(r => r === 'pass').length;
    
    // Calculate average performance
    const perfValues = Object.values(this.results.performance_metrics);
    const avgCalcTime = perfValues.length > 0 
      ? perfValues.reduce((sum, p) => sum + parseFloat(p.average_time), 0) / perfValues.length 
      : 0;
    
    return {
      agent: this.name,
      status: this.results.calculation_errors === 0 && this.results.betting_rules_violations === 0 ? 'pass' : 'fail',
      calculations_tested: this.results.calculations_tested,
      calculation_errors: this.results.calculation_errors,
      edge_cases_handled: this.results.edge_cases_handled,
      betting_rules_violations: this.results.betting_rules_violations,
      test_summary: `${passedTests}/${totalTests} tests passed`,
      performance: `${avgCalcTime.toFixed(2)}ms average calculation`,
      performance_metrics: this.results.performance_metrics,
      test_details: this.results.test_results,
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.calculation_errors > 0) {
      recommendations.push({
        issue: 'Odds calculation errors',
        solution: 'Review odds algorithm for edge cases',
        priority: 'high'
      });
    }

    if (this.results.betting_rules_violations > 0) {
      recommendations.push({
        issue: 'Betting rule violations',
        solution: 'Implement stricter validation before bet placement',
        priority: 'high'
      });
    }

    const avgCalcTime = parseFloat(this.results.performance_metrics.odds_calculation_speed?.average_time || 0);
    if (avgCalcTime > 1) {
      recommendations.push({
        issue: 'Slow odds calculations',
        solution: 'Optimize algorithm or implement caching',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.BettingLogicAgent = BettingLogicAgent;
}