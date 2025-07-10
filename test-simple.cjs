// Simple test script for FairwayLive
const http = require('http');
const https = require('https');

async function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('🏌️ FairwayLive Simple Test Suite\n');
    
    const tests = [];
    
    // Test 1: Landing page
    console.log('Test 1: Landing Page');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/',
            method: 'GET'
        });
        
        const hasApp = response.body.includes('<div id="app"></div>');
        const hasScripts = response.body.includes('app.js') && response.body.includes('swarm-client.js');
        const moduleType = response.body.includes('type="module"');
        
        console.log(`  Status: ${response.statusCode}`);
        console.log(`  Has app div: ${hasApp}`);
        console.log(`  Has scripts: ${hasScripts}`);
        console.log(`  Using module type: ${moduleType}`);
        
        tests.push({
            name: 'Landing Page',
            passed: response.statusCode === 200 && hasApp && hasScripts,
            issue: moduleType ? 'Script loaded as module - may cause issues' : null
        });
    } catch (error) {
        console.log(`  Error: ${error.message}`);
        tests.push({ name: 'Landing Page', passed: false, error: error.message });
    }
    
    // Test 2: Static assets
    console.log('\nTest 2: Static Assets');
    const assets = ['/js/app.js', '/js/swarm-client.js', '/js/betting-engine.js', '/css/app.css'];
    
    for (const asset of assets) {
        try {
            const response = await makeRequest({
                hostname: 'localhost',
                port: 3001,
                path: asset,
                method: 'GET'
            });
            
            const exists = response.statusCode === 200;
            console.log(`  ${asset}: ${exists ? '✅' : '❌'} (${response.statusCode})`);
            
            tests.push({
                name: `Asset: ${asset}`,
                passed: exists
            });
        } catch (error) {
            console.log(`  ${asset}: ❌ (${error.message})`);
            tests.push({ name: `Asset: ${asset}`, passed: false, error: error.message });
        }
    }
    
    // Test 3: API Endpoints
    console.log('\nTest 3: API Endpoints');
    
    // Test quick-start endpoint
    try {
        const postData = JSON.stringify({
            latitude: 37.5665,
            longitude: 126.9780
        });
        
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/api/rounds/quick-start',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        }, postData);
        
        const success = response.statusCode === 200;
        let hasRoundData = false;
        
        try {
            const data = JSON.parse(response.body);
            hasRoundData = data.round && data.round.id && data.round.holes;
            console.log(`  /api/rounds/quick-start: ${success ? '✅' : '❌'} (${response.statusCode})`);
            console.log(`  Returns round data: ${hasRoundData ? '✅' : '❌'}`);
        } catch (e) {
            console.log(`  JSON parse error: ${e.message}`);
        }
        
        tests.push({
            name: 'API: quick-start',
            passed: success && hasRoundData
        });
    } catch (error) {
        console.log(`  API Error: ${error.message}`);
        tests.push({ name: 'API: quick-start', passed: false, error: error.message });
    }
    
    // Test 4: Check for common issues
    console.log('\nTest 4: Common Issues Check');
    
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: 3001,
            path: '/js/app.js',
            method: 'GET'
        });
        
        const appJs = response.body;
        
        // Check for problematic patterns
        const usesWindowApp = appJs.includes('window.app = app');
        const usesOnclick = appJs.includes('onclick="app.');
        const hasClassDefinitions = appJs.includes('class FairwayLive');
        const exportsApp = appJs.includes('export ') || appJs.includes('module.exports');
        
        console.log(`  Sets window.app: ${usesWindowApp ? '✅' : '❌'}`);
        console.log(`  Uses inline onclick: ${usesOnclick ? '⚠️  (problematic with modules)' : '✅'}`);
        console.log(`  Has class definitions: ${hasClassDefinitions ? '✅' : '❌'}`);
        console.log(`  Has module exports: ${exportsApp ? '✅' : '❌ (but loaded as module)'}`);
        
        tests.push({
            name: 'Code Pattern Check',
            passed: usesWindowApp && hasClassDefinitions,
            issue: !exportsApp && 'Loaded as module but no exports'
        });
    } catch (error) {
        console.log(`  Error checking patterns: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 SUMMARY\n');
    const passed = tests.filter(t => t.passed).length;
    const total = tests.length;
    
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    
    console.log('\n❌ Issues Found:');
    tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.error || test.issue || 'Failed'}`);
    });
    
    console.log('\n🔍 Root Cause Analysis:');
    console.log('The main issue appears to be that app.js is loaded as type="module"');
    console.log('but the code expects to set global variables (window.app = app)');
    console.log('and uses inline onclick handlers that reference the global app object.');
    console.log('\nThis creates a timing/scope issue where the app object is not');
    console.log('available when the HTML renders, breaking all interactivity.');
}

runTests().catch(console.error);