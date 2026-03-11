const fetch = require('node-fetch');

async function testRoutes() {
    const baseUrl = 'http://localhost:5000/api';

    // We need a token. I'll try to get one if I can, but even without one, 
    // it should return 401, not ERR_CONNECTION_RESET.

    const routes = [
        '/assessments/instructor',
        '/submissions/pending'
    ];

    for (const route of routes) {
        console.log(`Testing ${route}...`);
        try {
            const res = await fetch(`${baseUrl}${route}`);
            console.log(`${route}: ${res.status} ${res.statusText}`);
        } catch (err) {
            console.error(`${route} FAILED:`, err.message);
        }
    }
}

testRoutes();
