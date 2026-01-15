
async function testN8n() {
    const webhookUrl = "https://n8n.srv1133159.hstgr.cloud/webhook/75bdb611-5f13-4c09-a2b9-42185744bdd0";

    // Dummy "Audio" file (just text for testing)
    const content = "Hello N8N! This is a test file.";
    const base64Data = Buffer.from(content).toString('base64');

    console.log("Sending data to n8n Webhook...");

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: `test-audio-${Date.now()}.mp3`, // Pretend to be MP3
                mimeType: 'audio/mpeg',
                data: base64Data
            })
        });

        if (!response.ok) {
            throw new Error(`n8n responded with ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        console.log("Raw Response:", text);

        if (!text) throw new Error("Empty response from n8n");

        const json = JSON.parse(text);
        console.log("Success! Response from n8n:");
        console.log(JSON.stringify(json, null, 2));

        if (json.webContentLink) {
            console.log("\n✅ Web Content Link found:", json.webContentLink);
        } else {
            console.log("\n⚠️ Warning: 'webContentLink' missing from response. verify n8n 'Respond to Webhook' node.");
        }

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testN8n();
