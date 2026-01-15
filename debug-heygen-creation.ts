
import 'dotenv/config';
import fetch from 'node-fetch';

const API_KEY = process.env.HEYGEN_API_KEY;
// This is the Asset ID we just got, maybe we can use it to create a talking photo?
// Or we upload the file again to the talking_photo endpoint.
const TEST_IMAGE_URL = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60";

if (!API_KEY) {
    console.error("❌ HEYGEN_API_KEY is missing from .env");
    process.exit(1);
}

async function testUploadEndpoint(name: string, url: string) {
    console.log(`\n\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);

    try {
        // Download image first to simulate binary upload
        const imgRes = await fetch(TEST_IMAGE_URL);
        const buffer = await imgRes.arrayBuffer();

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY,
                'Content-Type': 'image/jpeg' // Sending raw binary
            },
            body: Buffer.from(buffer)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response Preview:", text.substring(0, 300));

        try {
            const json = JSON.parse(text);
            if (json.data?.talking_photo_id) console.log(">>> SUCCESS! Found ID:", json.data.talking_photo_id);
        } catch { }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

async function run() {
    // Test 1: upload.heygen.com for talking_photo (Binary)
    await testUploadEndpoint(
        "Upload Banner - v1/talking_photo",
        "https://upload.heygen.com/v1/talking_photo"
    );

    // Test 2: api.heygen.com for talking_photo (but maybe with different headers?)
    // We already tried this and it 404'd as JSON, but let's try binary just in case
    // await testUploadEndpoint("API - v1/talking_photo", "https://api.heygen.com/v1/talking_photo");
}

run();
