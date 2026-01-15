
import 'dotenv/config'; // Load .env
import fetch from 'node-fetch';

const API_KEY = process.env.HEYGEN_API_KEY;
const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60";

if (!API_KEY) {
    console.error("❌ HEYGEN_API_KEY is missing from .env or .env.local");
    process.exit(1);
}

async function testEndpoint(name: string, url: string, body: any) {
    console.log(`\n\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response Preview:", text.substring(0, 300));

        try {
            const json = JSON.parse(text);
            console.log("✅ Valid JSON Response");
            // Check for known success fields
            if (json.data?.talking_photo_id) console.log(">>> FOUND ID:", json.data.talking_photo_id);
            if (json.data?.id) console.log(">>> FOUND ID:", json.data.id);
        } catch {
            console.log("⚠️ Response is NOT JSON (likely HTML error page)");
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

async function run() {
    console.log("🔍 Checking HeyGen Endpoints...");

    // Test 1: v2 Talking Photo (What we tried)
    await testEndpoint(
        "v2 Talking Photo",
        "https://api.heygen.com/v2/talking_photo",
        { url: TEST_IMAGE_URL }
    );

    // Test 2: v1 Talking Photo
    await testEndpoint(
        "v1 Talking Photo",
        "https://api.heygen.com/v1/talking_photo",
        { url: TEST_IMAGE_URL, name: "test-avatar" }
    );

    // Test 3: Upload Asset
    await testEndpoint(
        "Upload Asset",
        "https://upload.heygen.com/v1/asset",
        { url: TEST_IMAGE_URL, content_type: "image" }
    );
}

run();
