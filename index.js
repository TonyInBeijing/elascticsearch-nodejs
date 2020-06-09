// index.js
const express = require('express');
const elasticsearch = require('elasticsearch');
const fs = require('fs');
const app = express();

const PORT = 5000;

const verify = require('./verify');
const searchData = require('./search');
const client = new elasticsearch.Client({
    host: '127.0.0.1:9200',
    log: 'error'
});

client.ping({ requestTimeout: 30000 }, function (error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('Everything is ok');
    }
});

const bulkIndex = function bulkIndex(index, type, data) {
    let bulkBody = [];
    data.forEach(item => {
        bulkBody.push({
            index: {
                _index: index,
                _type: type,
                _id: item.id
            }
        });

        bulkBody.push(item);
    });

    client.bulk({ body: bulkBody })
        .then(response => {
            let errorCount = 0;
            response.items.forEach(item => {
                if (item.index && item.index.error) {
                    console.log(++errorCount, item.index.error);
                }
            });
            console.log(
                `Successfully indexed ${data.length - errorCount}
         out of ${data.length} items`
            );
        })
        .catch(console.err);
};


async function indexData() {
    const twittersRaw = await fs.readFileSync('./data2.json');
    const twitters = JSON.parse(twittersRaw);
    console.log(`${twitters.length} items parsed from data file`);
    bulkIndex('twitter2', '_doc', twitters);
};

// indexData();
// verify();
searchData();

app.listen(PORT, function () {
    console.log('Server is running on PORT:', PORT);
});