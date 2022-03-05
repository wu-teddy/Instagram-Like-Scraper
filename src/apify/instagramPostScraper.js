// Define package imports (see package.json)
const axios = require('axios');

// Define user imports from source code
const sleep = require('../common/sleep');

/**
 * Runs an instagram post scraper actor task
 * @param {string} username
 * @returns apify actor task run response
 */
async function runInstagramPostScraperActor(username) {
    try {

        // Define how many posts to retrieve
        const limit = 20;

        // Construct the apify instagram post scraper payload
        const payload = {
            "username": [
                username
            ],
            "resultsLimit": limit
        };

        // apify run instagram post scraper url
        const apifyRunScraperUrl = `https://api.apify.com/v2/acts/zuzka~instagram-post-scraper/runs?token=${process.env.API_TOKEN}`;

        // Call the apify post scraper with the payload
        const response = await axios.post(apifyRunScraperUrl, payload);

        // TODO(syall): handle checking for failure call from apify
        ;;;

        // Get the Actor ID, Run ID, and Dataset ID from the apify response
        const { actId: actorId, id: runId, defaultDatasetId: datasetId } = response.data.data;

        // Actor ID, Run ID, and Dataset ID
        return [null, { actorId, runId, datasetId }];
    } catch (error) {
        // If an error is caught, return the error
        return [error, null];
    }
}

/**
 * Check the status of an actor task run
 * @param {string} actorId
 * @param {string} runId
 * @returns the status of the actor task
 */
async function checkInstagramPostScraperStatus(actorId, runId) {
    try {

        // apify check instagram post scraper url
        const apifyCheckStatusUrl = `https://api.apify.com/v2/acts/${actorId}/runs/${runId}`;

        // Get the apify actor task status
        const response = await axios.get(apifyCheckStatusUrl);

        // Find the status enum of the actor task
        // TODO(syall): check if actor task failure has different fields than success
        const status = response.data.data.status;

        // If the actor task failed, return an error
        if (status === 'FAILED') {
            // TODO(syall): check if failure response contains error message
            const errorMsg = `Actor task failed: Actor ID: ${actorId}, Run ID: ${runId}`;
            return [new Error(errorMsg), null];
        }

        // If the actor task succeeded, return the status
        return [null, status];
    } catch (error) {
        // If an error is caught, return the error
        return [error, null];
    }
}

/**
 * Get Instagram Actor Task Results from Dataset
 * @param {string} datasetId
 * @returns scraped posts in dataset
 */
async function getInstagramPostScraperData(datasetId) {
    try {
        // apify get dataset url
        const apifyGetScraperDataUrl = `https://api.apify.com/v2/datasets/${datasetId}/items`;

        // Get the apify post scraper results
        const response = await axios.get(apifyGetScraperDataUrl);

        // TODO(syall): handle checking for failure call from apify
        ;;;

        // Destructure the posts from the response
        const { data: posts } = response;

        // Actor ID, Run ID, and Dataset ID
        return [null, posts];
    } catch (error) {
        // If an error is caught, return the error
        return [error, null];
    }
}

/**
 * Scrape a username's Instagram posts
 * @param {string} username
 * @returns a list of posts
 */
async function scrapeInstagramPosts(username) {

    // Call helper method to run an task of an instagram post scraper actor
    const [runError, runData] = await runInstagramPostScraperActor(username);

    // If there is a error when running the actor, return the error
    if (runError) {
        return [runError, null];
    }

    // Destructure properties from the actor task
    const { actorId, runId, datasetId } = runData;

    // Log the relevant apify response with the username
    console.log({ username, actorId, runId, datasetId });

    // Define maximum waiting time (s)
    const maxTime = 10 * 60;

    // Define poll time (ms)
    const pollTime = 5000;

    // Check up to 10 minutes (wait 5 seconds per check)
    const maxChecks = maxTime / (pollTime / 1000);

    // For loop that will definitely end by the max poll time
    for (let i = 0; i < maxChecks; i++) {

        // Check actor task status
        const [checkError, isCompleted] = await checkInstagramPostScraperStatus(actorId, runId);

        // If there is a error when checking the actor task, return the error
        if (checkError) {
            return [checkError, null];
        }

        console.log({ username, actorId, runId, datasetId, isCompleted });

        // If the actor task is successful, return the stored data in the dataset
        if (isCompleted === 'SUCCEEDED') {
            return await getInstagramPostScraperData(datasetId);
        }

        // Wait poll time to prevent excess traffic to apify
        await sleep(pollTime);
    }

    // Return timeout error if actor task did not finish before the maximum time
    const errorMsg = `Actor task timed out: Actor ID: ${actorId}, Run ID: ${runId}`;
    return [new Error(errorMsg), null];
}

// Export scrapeInstagramPosts function
module.exports = scrapeInstagramPosts;
