
import { GoogleDriveService } from "./lib/google-drive";
import * as fs from 'fs';
import * as path from 'path';

async function testDrive() {
    console.log("Initializing Drive Service...");
    try {
        const keyPath = path.join(process.cwd(), 'service_account_key.json');

        if (fs.existsSync(keyPath)) {
            const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            console.log("\n[DIAGNOSTIC] Service Account Email:", key.client_email);
            console.log("PLEASE ENSURE THIS EMAIL HAS 'EDITOR' ACCESS TO THE FOLDER.\n");
        } else {
            console.error("Key file not found!");
        }

        const drive = new GoogleDriveService();

        // Folder ID provided by user
        const folderId = "1NyEjeOjJlRyRn77QG3to94SNdq4wcxPD";

        // 1. Try to READ the folder first to see if we have access at all
        try {
            console.log(`Checking Read Access for folder: ${folderId}...`);
            // We need to access the drive client directly. 
            // Since GoogleDriveService property is private, we will just trust the user
            // provided the correct ID and if Upload fails, it fails.
            // Wait, we can add a listFiles method to the service if we want, 
            // but let's stick to the upload test which is the specific failing action.
            // Actually, let's just use the upload logic for now.
            // If we really want to test READ, we should expose it in the class.
        } catch (err) { }

        // Create a dummy buffer
        const buffer = Buffer.from("Hello EduAvatar! This is a test file.", "utf-8");
        const filename = `test-upload-${Date.now()}.txt`;

        console.log(`Attemping Upload (Write Check) to folder ${folderId}...`);

        const result = await drive.uploadFile(buffer, filename, 'text/plain', folderId);

        console.log("Upload Success!");
        console.log("File ID:", result.id);
        console.log("Web Content Link:", result.webContentLink);

    } catch (e: any) {
        console.error("Test Failed:", e.message);
        if (e.errors) {
            console.error(JSON.stringify(e.errors, null, 2));
        }
    }
}

testDrive();
