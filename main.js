// server.js
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Google Sheets API setup
const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Function to check if the sheet exists and create it if it doesn't
async function ensureSheetExists() {
  try {
    // Get the spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    // Check if the "Form Submissions" sheet exists
    const sheetExists = spreadsheet.data.sheets.some(
      sheet => sheet.properties.title === 'Form Submissions'
    );

    if (!sheetExists) {
      // Create the sheet with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Form Submissions'
                }
              }
            }
          ]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Form Submissions!A1:F1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Organization Name', 'Your Name', 'Your Role', 'Country', 'Email Address', 'Your Message', 'Timestamp']]
        }
      });
    }
  } catch (error) {
    console.error('Error ensuring sheet exists:', error);
    throw error;
  }
}

// API endpoint to handle form submissions
app.post('/api/submit-form', async (req, res) => {
  try {
    const { organizationName, name, role, country, email, message } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields' });
    }

    // Ensure the sheet exists
    await ensureSheetExists();

    // Add the form data to the sheet
    const timestamp = new Date().toISOString();
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Form Submissions!A:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[organizationName, name, role, country, email, message, timestamp]]
      }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Form submitted successfully',
      rowNumber: response.data.updates.updatedRange
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ 
      success: false,
      error: 'An error occurred while submitting the form'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
