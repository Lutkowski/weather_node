const axios = require('axios')
const fs = require('fs')

const configFilePath = "./config.json";

function readConfig() {
    try {
        const data = fs.readFileSync(configFilePath);
        return JSON.parse(data);
    } catch (error) {
        console.error("config reading error:");
        return null;
    }
}
function writeConfig(config) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
        console.log("сonfig updated");
    } catch (error) {
        console.error("config writting error");
    }
}
let config = readConfig();

if (config === null) {
    if (process.argv.includes('-s') && process.argv.includes('-t')) {
        const userCityIndex = process.argv.indexOf('-s') + 1;
        const apiKeyIndex = process.argv.indexOf('-t') + 1;

        if (userCityIndex < process.argv.length && apiKeyIndex < process.argv.length) {
            const newUserConfig = {
                location: process.argv[userCityIndex],
                apiKey: process.argv[apiKeyIndex],
            };

            writeConfig(newUserConfig);
            config = newUserConfig;
        } else {
            console.log('use: node main.js -s "City" -t "API_KEY"');
            process.exit();
        }
    } else {
        console.log('use: node main.js -s "City" -t "API_KEY"');
        process.exit();
    }
}

process.argv.forEach((arg, index) => {
    if (arg === '-s' && process.argv[index + 1]) {
        config.location = process.argv[index + 1];
    } else if (arg === '-t' && process.argv[index + 1]) {
        config.apiKey = process.argv[index + 1];
    } else if (arg === '-h') {
        console.log('Use:');
        console.log('  node index.js -s "City" -t "API_KEY"');
        process.exit();
    }
});

writeConfig(config);

const apiUrl = 'http://dataservice.accuweather.com/locations/v1/cities/search';
const queryParams = {
    apikey: config.apiKey,
    q: config.location,
};

axios.get(apiUrl, { params: queryParams })
    .then(response => {
        if (response.data.length > 0) {
            const cityKey = response.data[0].Key;
            console.log(`Weather forecast for ${config.location}:`);
            const weatherURL = `http://dataservice.accuweather.com/forecasts/v1/daily/1day/${cityKey}`;
            axios.get(weatherURL, { params: { apikey: config.apiKey } })
                .then(response => {
                    console.log("Success");
                    console.log(response.data.DailyForecasts[0]);
                })
                .catch(error => {
                    console.log("Failed to fetch weather forecast");
                    console.log(error);
                });
        } else {
            console.log(`No information for ${config.location}`);
        }
    })
    .catch(error => {
        console.error(error);
    });
