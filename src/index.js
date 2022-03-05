// Loads variables from .env file to process.env object
//   Although dotenv is also a package import, special case since you want the
//   environment variables to be loaded before any other code runs
require('dotenv').config();

// Define package imports (see package.json)
const express = require('express');
const morgan = require('morgan');

// Define user imports from source code
const scrapeInstagramPosts = require('./apify/instagramPostScraper');

// Express Application = Web Server Framework
const app = express();

// Add morgan (logging) middleware with preset format "tiny"
app.use(morgan('tiny'));

// /posts/:username endpoint - Scrape Instagram Posts for a Username
app.get('/posts/:username', async (req, res) => {

    // Validate username input
    if (!req.params.username) {
        return res
            .status(400)
            .json({ message: 'Missing parameter: "username"' });
    }

    // Scrape instagram posts for username
    const [error, data] = await scrapeInstagramPosts(req.params.username);

    // If there is an error, return error status or default 400
    if (error) {
        return res
            .status(error.status || 400)
            .json({ message: error.message });
    }

    // Otherwise, return the data
    res.json(data);
});

// / endpoint - catch all other traffic with default index.html page
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/views/index.html`);
});

// Define the port for the Web Server
const port = process.env.PORT || 3000;

// Start the web server on the defined port
const server = app.listen(port, () => {
    console.log(`Instagram-Like-Scraper server listening on port ${port}`);
});

// Handle "SIGTERM" or Ctrl+D signals to clean up existing requests and server
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing Instagram-Like-Scraper server');
    // Call close on the server to prevent memory leaks and unfinished requests
    server.close(() => {
        console.log('Instagram-Like-Scraper server closed');
    });
});
