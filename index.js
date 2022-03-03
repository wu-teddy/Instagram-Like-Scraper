const express = require('express');
const app = express();
const port = 3000;


require('dotenv').config();

const axios = require('axios');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function scrapeInstagram(username) {
    const payload = {
        "username": [
            username
        ],
        "resultsLimit": 20
    };
    const response = await axios.post(`https://api.apify.com/v2/acts/zuzka~instagram-post-scraper/runs?token=${process.env.API_TOKEN}`, payload);
    const { actId, id, defaultDatasetId } = response.data.data;
    console.log({ actId, id, defaultDatasetId });

    let success = true;
    while (success) {
        const resp = await axios.get(`https://api.apify.com/v2/acts/${actId}/runs/${id}`);
        const isCompleted = resp.data.data.status;
        console.log({ actId, id, isCompleted });
        if (isCompleted === 'SUCCEEDED') {
            break;
        } else if (isCompleted === 'FAILED') {
            success = false;
            break;
        }
        await sleep(5000);
    }

    if (!success) {
        return res
            .status(400)
            .json({ message: 'failed' });
    }

    return await axios.get(`https://api.apify.com/v2/datasets/${defaultDatasetId}/items`);
}

app.get('/', async (req, res) => {
    const posts = await scrapeInstagram(req.query.username || "lebron");
    res.json({
        data: posts.data
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
