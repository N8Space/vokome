import { google } from 'googleapis';
import * as path from 'path';

// SCOPES for Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive'];

export class GoogleDriveService {
    private drive;

    constructor() {
        const keyFilePath = path.join(process.cwd(), 'service_account_key.json');

        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: SCOPES,
        });

        this.drive = google.drive({ version: 'v3', auth });
    }

    /**
     * Uploads a file to Google Drive and sets it to be publicly readable.
     * @param buffer The file content as a Buffer.
     * @param filename The name of the file.
     * @param mimeType The MIME type of the file.
     * @param parentFolderId The ID of the folder to upload to (optional).
     */
    async uploadFile(buffer: Buffer, filename: string, mimeType: string, parentFolderId?: string) {
        try {
            // 1. Create a readable stream from the buffer
            const { Readable } = require('stream');
            const stream = Readable.from(buffer);

            // 2. Metadata
            const requestBody: any = {
                name: filename,
                mimeType,
            };
            if (parentFolderId) {
                requestBody.parents = [parentFolderId];
            }

            // 3. Upload
            const response = await this.drive.files.create({
                requestBody,
                media: {
                    mimeType,
                    body: stream,
                },
                fields: 'id, webContentLink, webViewLink',
                supportsAllDrives: true,
            });

            const fileId = response.data.id;
            if (!fileId) throw new Error('File upload failed (no ID returned)');

            // 4. Make Public (Anyone with link can view)
            try {
                await this.drive.permissions.create({
                    fileId,
                    requestBody: {
                        role: 'reader',
                        type: 'anyone',
                    },
                });
            } catch (permError: any) {
                console.warn("Warning: Could not make file public (Org Policy?):", permError.message);
                // Proceed anyway, maybe the user has other ways to access it
            }

            return {
                id: fileId,
                webContentLink: response.data.webContentLink,
                webViewLink: response.data.webViewLink,
            };

        } catch (error) {
            console.error('Google Drive Upload Error:', error);
            throw error;
        }
    }
}
