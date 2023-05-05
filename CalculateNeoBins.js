const fs = require("fs");
const { exit } = require("process");
const readline = require("readline");

const sizes = [];
const ranges = []
const velocities = [];

const percentile1AsDecimal = .25;
const percentile2AsDecimal = .75;

main();

async function main() {
    const fileStream = fs.createReadStream("NEO_Earth_Close_Approaches.csv");

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    var isHeaderLine = true;
    for await (const line of rl) {
        //Skip header line
        if (isHeaderLine)
        {
            isHeaderLine = false;
            continue;
        }
        // Each line in input.txt will be successively available here as `line`.
        parseLine(line);
    }

    //Get Results
    sizes.sort((a, b) => a-b);
    ranges.sort((a, b) => a-b);
    velocities.sort((a, b) => a-b);
    const sizesp1 = calculatePercentileFromSortedArray(sizes, percentile1AsDecimal);
    const sizesp2 = calculatePercentileFromSortedArray(sizes, percentile2AsDecimal)
    const rangesp1 = calculatePercentileFromSortedArray(ranges, percentile1AsDecimal);
    const rangesp2 = calculatePercentileFromSortedArray(ranges, percentile2AsDecimal);
    const velocitiesp1 =calculatePercentileFromSortedArray(velocities, percentile1AsDecimal);
    const velocitiesp2 = calculatePercentileFromSortedArray(velocities, percentile2AsDecimal);
    console.log("------------------------Final Result---------------------------");
    logFinalResult("Size", percentile1AsDecimal, sizesp1, percentile2AsDecimal, sizesp2);
    logFinalResult("Range", percentile1AsDecimal, rangesp1, percentile2AsDecimal, rangesp2);
    logFinalResult("Velocity", percentile1AsDecimal, velocitiesp1, percentile2AsDecimal, velocitiesp2);
}

function parseLine(line) {
    var row = CSVtoArray(line);
    const date = row[1];
    
    const size = getMaxSize(row[7]);
    sizes.push(size);
    const range = parseFloat(row[2]);
    ranges.push(range);
    const velocity = parseFloat(row[4]);
    velocities.push(velocity);

    console.log("------------------------Current Result---------------------------");
    console.log("Date: " + date);
    logCurrentResult("Size", size);
    logCurrentResult("Range", range);
    logCurrentResult("Velocity", velocity);
}

function logCurrentResult(attribute, value) {
    console.log("   Attribute: " + attribute + " value: " + value);
}

function logFinalResult(attribute, percentile1, value1, percentile2, value2) {
    console.log("   Attribute: " + attribute);
    console.log("       Percentile: " + (percentile1 * 100) + " value: " + value1);
    console.log("       Percentile: " + (percentile2 * 100) + " value: " + value2);
}

//everything <= result is in percentile
function calculatePercentileFromSortedArray(array, percentileAsDecimal)
{
    const index  = Math.floor(array.length * percentileAsDecimal);
    return array[index];
}

function getMaxSize(size) {
    //Remove Spacing
    var maxSize = size.replace(/\s+/g, "");
    //Get Unit and remove it
    var conversionToFeet = 3.28084;
    //If Kilometers
    if (maxSize.includes("k")) {
        conversionToFeet *= 1000;
        maxSize = maxSize.replaceAll("k", "");
    }
    maxSize = maxSize.replaceAll("m", "");
    const splitRange = maxSize.split("-");
    if (splitRange.length == 2) {
        maxSize = splitRange[1];
    }
    const splitEstimateError = maxSize.split("±");
    if (splitEstimateError.length == 2) {
        maxSize = parseFloat(splitEstimateError[0]) + parseFloat(splitEstimateError[1]);
    }
    return parseFloat(maxSize) * conversionToFeet;
}

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;
    var a = []; // Initialize array to receive values.
    text.replace(
        re_value, // "Walk" the string using replace with callback.
        function (m0, m1, m2, m3) {
        // Remove backslash from \' in single quoted values.
        if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
        // Remove backslash from \" in double quoted values.
        else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
        else if (m3 !== undefined) a.push(m3);
        return ""; // Return empty string.
    });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push("");
    return a;
}
