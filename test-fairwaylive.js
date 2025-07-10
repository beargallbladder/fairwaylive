// FairwayLive Comprehensive Test Suite
// Tests all features and identifies broken functionality

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class FairwayLiveTestSuite {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'http://localhost:3001';
    }

    async setup() {
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.logError(`Console Error: ${msg.text()}`);
            }
        });
        
        // Capture network errors
        this.page.on('pageerror', error => {
            this.logError(`Page Error: ${error.message}`);
        });
        
        // Monitor failed requests
        this.page.on('requestfailed', request => {
            this.logError(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
        });
        
        // Set viewport for mobile
        await this.page.setViewport({
            width: 375,
            height: 812,
            isMobile: true,
            hasTouch: true
        });
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    logTest(feature, expected, actual, passed, error = null) {
        this.testResults.push({
            feature,
            expected,
            actual,
            passed,
            error,
            timestamp: new Date().toISOString()
        });
        
        console.log(`${passed ? '✅' : '❌'} ${feature}`);
        if (!passed) {
            console.log(`   Expected: ${expected}`);
            console.log(`   Actual: ${actual}`);
            if (error) console.log(`   Error: ${error}`);
        }
    }

    logError(message) {
        console.error(`🔴 ${message}`);
    }

    async test1_LandingPageLoads() {
        const feature = "Landing Page Loads";
        const expected = "Landing page displays with START ROUND button";
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Check for app container
            const appExists = await this.page.$('#app') !== null;
            
            // Wait for landing screen
            await this.page.waitForSelector('.screen.landing', { timeout: 5000 });
            
            // Check for logo
            const logoText = await this.page.$eval('.logo', el => el.textContent);
            const hasLogo = logoText.includes('FairwayLive');
            
            // Check for START ROUND button
            const startButton = await this.page.$('button.btn-primary');
            const buttonText = await this.page.evaluate(el => el?.textContent, startButton);
            const hasStartButton = buttonText?.includes('START ROUND');
            
            const passed = appExists && hasLogo && hasStartButton;
            
            this.logTest(
                feature,
                expected,
                passed ? "Landing page loaded correctly" : "Landing page missing elements",
                passed
            );
            
            return passed;
        } catch (error) {
            this.logTest(feature, expected, "Failed to load landing page", false, error.message);
            return false;
        }
    }

    async test2_StartRoundButton() {
        const feature = "START ROUND Button Functionality";
        const expected = "Clicking START ROUND transitions to round screen";
        
        try {
            // Click START ROUND
            await this.page.click('button.btn-primary');
            
            // Wait for loading or round screen
            await this.page.waitForFunction(
                () => document.querySelector('.loading') || document.querySelector('.round-screen'),
                { timeout: 10000 }
            );
            
            // Check if we're on round screen
            const roundScreen = await this.page.$('.round-screen');
            const holeInfo = await this.page.$('.hole-info');
            
            const passed = roundScreen !== null && holeInfo !== null;
            
            this.logTest(
                feature,
                expected,
                passed ? "Successfully transitioned to round screen" : "Failed to start round",
                passed
            );
            
            return passed;
        } catch (error) {
            this.logTest(feature, expected, "Error clicking START ROUND", false, error.message);
            return false;
        }
    }

    async test3_VoiceRecording() {
        const feature = "Voice Recording Feature";
        const expected = "Microphone button triggers recording state";
        
        try {
            // Find voice button
            const voiceBtn = await this.page.$('#voiceBtn');
            if (!voiceBtn) {
                this.logTest(feature, expected, "Voice button not found", false);
                return false;
            }
            
            // Test mousedown/mouseup for recording
            await this.page.evaluate(() => {
                const btn = document.getElementById('voiceBtn');
                btn.dispatchEvent(new MouseEvent('mousedown'));
            });
            
            // Check if recording class is added
            const hasRecordingClass = await this.page.evaluate(() => {
                return document.getElementById('voiceBtn')?.classList.contains('recording');
            });
            
            await this.page.evaluate(() => {
                const btn = document.getElementById('voiceBtn');
                btn.dispatchEvent(new MouseEvent('mouseup'));
            });
            
            this.logTest(
                feature,
                expected,
                hasRecordingClass ? "Voice recording triggered correctly" : "Recording state not activated",
                hasRecordingClass
            );
            
            return hasRecordingClass;
        } catch (error) {
            this.logTest(feature, expected, "Error testing voice recording", false, error.message);
            return false;
        }
    }

    async test4_BettingSystem() {
        const feature = "Betting System and Odds Display";
        const expected = "Betting ticker shows live odds with selectable bets";
        
        try {
            // Check for betting ticker
            const bettingTicker = await this.page.$('.betting-ticker');
            if (!bettingTicker) {
                this.logTest(feature, expected, "Betting ticker not found", false);
                return false;
            }
            
            // Check for bet items
            const betItems = await this.page.$$('.bet-item');
            const hasBets = betItems.length > 0;
            
            // Check for odds display
            const hasOdds = await this.page.evaluate(() => {
                const odds = document.querySelectorAll('.bet-odds');
                return odds.length > 0 && Array.from(odds).some(el => el.textContent.includes('x'));
            });
            
            // Test bet selection
            if (betItems.length > 0) {
                await betItems[0].click();
                const isSelected = await this.page.evaluate(() => {
                    return document.querySelector('.bet-item.selected') !== null;
                });
                
                const passed = hasBets && hasOdds && isSelected;
                this.logTest(
                    feature,
                    expected,
                    passed ? "Betting system functional" : "Betting system has issues",
                    passed
                );
                return passed;
            }
            
            this.logTest(feature, expected, "No bets available to test", false);
            return false;
        } catch (error) {
            this.logTest(feature, expected, "Error testing betting system", false, error.message);
            return false;
        }
    }

    async test5_BookmakerAgents() {
        const feature = "Bookmaker Agents and Social Feed";
        const expected = "Social feed button exists and bookmaker system initialized";
        
        try {
            // Check for social feed button
            const socialBtn = await this.page.$('.social-feed-btn');
            const hasSocialBtn = socialBtn !== null;
            
            // Check if bookmaker agents are loaded
            const hasBookmakers = await this.page.evaluate(() => {
                return window.socialFeed && window.socialFeed.bookmakers && window.socialFeed.bookmakers.agents.length > 0;
            });
            
            // Try to open social feed
            if (socialBtn) {
                await socialBtn.click();
                await this.page.waitForTimeout(500);
                
                const feedVisible = await this.page.evaluate(() => {
                    const feed = document.querySelector('.social-feed');
                    return feed && feed.style.right === '0px';
                });
                
                const passed = hasSocialBtn && hasBookmakers && feedVisible;
                this.logTest(
                    feature,
                    expected,
                    passed ? "Social feed and bookmakers working" : "Social feed issues detected",
                    passed
                );
                return passed;
            }
            
            this.logTest(feature, expected, "Social feed button not found", false);
            return false;
        } catch (error) {
            this.logTest(feature, expected, "Error testing social feed", false, error.message);
            return false;
        }
    }

    async test6_ScoreEntry() {
        const feature = "Score Entry System";
        const expected = "Score buttons clickable and update selection";
        
        try {
            // Find score buttons
            const scoreButtons = await this.page.$$('.score-btn');
            if (scoreButtons.length === 0) {
                this.logTest(feature, expected, "No score buttons found", false);
                return false;
            }
            
            // Click a score button
            await scoreButtons[0].click();
            
            // Check if selected
            const hasSelected = await this.page.evaluate(() => {
                return document.querySelector('.score-btn.selected') !== null;
            });
            
            this.logTest(
                feature,
                expected,
                hasSelected ? "Score entry working" : "Score selection not working",
                hasSelected
            );
            
            return hasSelected;
        } catch (error) {
            this.logTest(feature, expected, "Error testing score entry", false, error.message);
            return false;
        }
    }

    async test7_WebSocketConnection() {
        const feature = "WebSocket Connection";
        const expected = "WebSocket connects to server";
        
        try {
            const wsState = await this.page.evaluate(() => {
                if (window.app && window.app.state.ws) {
                    return {
                        connected: window.app.state.ws.readyState === WebSocket.OPEN,
                        readyState: window.app.state.ws.readyState
                    };
                }
                return { connected: false, readyState: null };
            });
            
            this.logTest(
                feature,
                expected,
                wsState.connected ? "WebSocket connected" : `WebSocket not connected (state: ${wsState.readyState})`,
                wsState.connected
            );
            
            return wsState.connected;
        } catch (error) {
            this.logTest(feature, expected, "Error checking WebSocket", false, error.message);
            return false;
        }
    }

    async test8_APIEndpoints() {
        const feature = "API Endpoints";
        const expected = "API endpoints respond correctly";
        
        try {
            // Test rounds endpoint
            const roundsResponse = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/rounds/quick-start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ latitude: 37.5665, longitude: 126.9780 })
                    });
                    return {
                        ok: response.ok,
                        status: response.status,
                        data: await response.json()
                    };
                } catch (err) {
                    return { ok: false, error: err.message };
                }
            });
            
            const passed = roundsResponse.ok && roundsResponse.data?.round;
            
            this.logTest(
                feature,
                expected,
                passed ? "API endpoints working" : `API error: ${roundsResponse.error || roundsResponse.status}`,
                passed
            );
            
            return passed;
        } catch (error) {
            this.logTest(feature, expected, "Error testing API", false, error.message);
            return false;
        }
    }

    async runAllTests() {
        console.log('🏌️ Starting FairwayLive Test Suite\n');
        
        await this.setup();
        
        try {
            // Run all tests
            await this.test1_LandingPageLoads();
            await this.test2_StartRoundButton();
            await this.test3_VoiceRecording();
            await this.test4_BettingSystem();
            await this.test5_BookmakerAgents();
            await this.test6_ScoreEntry();
            await this.test7_WebSocketConnection();
            await this.test8_APIEndpoints();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('Test suite error:', error);
        } finally {
            await this.teardown();
        }
    }

    generateReport() {
        console.log('\n📊 TEST REPORT\n');
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(t => t.passed).length;
        const failed = total - passed;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} ✅`);
        console.log(`Failed: ${failed} ❌`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);
        
        if (failed > 0) {
            console.log('❌ FAILED TESTS:\n');
            this.testResults.filter(t => !t.passed).forEach(test => {
                console.log(`Feature: ${test.feature}`);
                console.log(`Expected: ${test.expected}`);
                console.log(`Actual: ${test.actual}`);
                if (test.error) console.log(`Error: ${test.error}`);
                console.log('---');
            });
        }
        
        // Save detailed report
        const reportPath = '/Users/samsonkim/developmentsamkim/fairwaylive/test-report.json';
        fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2))
            .then(() => console.log(`\nDetailed report saved to: ${reportPath}`))
            .catch(err => console.error('Error saving report:', err));
    }
}

// Run the tests
const tester = new FairwayLiveTestSuite();
tester.runAllTests();