/**
 * Function: Sleeps for ms milliseconds
 * @param {number} ms
 * @returns promise after ms milliseconds passes
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// Export sleep function
module.exports = sleep;
