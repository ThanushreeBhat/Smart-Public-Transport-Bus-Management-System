// =============================================================================
// Integration Probe Test for Express Server
// Member A: Database Engineer & Backend Developer
// =============================================================================

const http = require('http');
const app = require('../src/app');

console.log('Testing Express API server startup & route responses...');

const server = app.listen(0, async () => {
    const port = server.address().port;
    console.log(`Test server listening on ephemeral port: ${port}`);

    function get(path) {
        return new Promise((resolve, reject) => {
            http.get(`http://localhost:${port}${path}`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(data) });
                    } catch (e) {
                        resolve({ status: res.statusCode, body: data });
                    }
                });
            }).on('error', reject);
        });
    }

    try {
        // Test 1: Health endpoint
        const healthRes = await get('/api/health');
        console.log('  [TEST 1] GET /api/health -> Status:', healthRes.status);
        if (healthRes.status === 200 && healthRes.body.success === true) {
            console.log('  [PASS] Health endpoint returned expected JSON.');
        } else {
            throw new Error(`Health check failed: ${JSON.stringify(healthRes.body)}`);
        }

        // Test 2: 404 Route handling
        const notFoundRes = await get('/api/unknown-endpoint');
        console.log('  [TEST 2] GET /api/unknown-endpoint -> Status:', notFoundRes.status);
        if (notFoundRes.status === 404 && notFoundRes.body.success === false) {
            console.log('  [PASS] 404 middleware returned clean structured JSON.');
        } else {
            throw new Error(`404 check failed: ${JSON.stringify(notFoundRes.body)}`);
        }

        console.log('\n=======================================================');
        console.log('All Express server integration probes passed!');
        console.log('=======================================================');
        server.close(() => process.exit(0));
    } catch (err) {
        console.error('Probe test failed:', err);
        server.close(() => process.exit(1));
    }
});

