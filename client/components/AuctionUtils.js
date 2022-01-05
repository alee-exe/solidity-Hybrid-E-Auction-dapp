// Utility functions to be used by Auction Components

function convertTimestampToDate(timestamp, mode) {
    if (timestamp <= 0) {
        return 0;
    }

    // convert to JS timestamp in miliseconds from Unix timestamp in seconds since Unix epoch
    const date = new Date(timestamp * 1000);
    var conversion = null;
    if (mode !== "time") {
        conversion = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + " at " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + (date.getHours() < 12 ? ' AM' : ' PM' );
    } else {
        conversion = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
    }
    return conversion;
};

function enumStatus(enum_index) {
    const status = ["CANCELLED", "ONGOING", "ENDED"];
    return (status[enum_index]);
};

module.exports = {
    convertTimestampToDate,
    enumStatus
}