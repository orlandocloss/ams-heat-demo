/**
 * Upload CSV to Vercel Blob Storage
 * Run once: BLOB_READ_WRITE_TOKEN=your_token node upload-to-blob.js
 */

const { put } = require('@vercel/blob');
const fs = require('fs');

async function uploadCSV() {
    try {
        console.log('Reading CSV file...');
        const csvData = fs.readFileSync('AMS_3_col.csv', 'utf8');
        console.log(`File size: ${csvData.length} bytes`);
        
        console.log('Uploading to Vercel Blob...');
        const blob = await put('AMS_3_col.csv', csvData, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        });
        
        console.log('✓ Upload complete!');
        console.log('Blob URL:', blob.url);
        console.log('\nAdd this to your Vercel project environment variables:');
        console.log(`BLOB_CSV_URL=${blob.url}`);
    } catch (error) {
        console.error('Error uploading:', error);
    }
}

uploadCSV();

