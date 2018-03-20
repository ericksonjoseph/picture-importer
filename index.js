'use strict'

const ARTIST_ID = 1;
const DIR = '/Users/eli/Desktop/itfu/gallery/';
const BUCKET = "net.itfu.images";

const readline = require('readline');
const mysql = require('mysql');
const fs = require('fs')
const md5 = require('md5')
const AWS = require('aws-sdk');
const log4js = require('log4js');
const moment = require('moment');

const LOG = log4js.getLogger();
const level = process.env.LOG_LEVEL || 'trace'
LOG.setLevel(level);
var s3 = new AWS.S3();

var con = mysql.createConnection({
    host: "docker.local",
    user: "root",
    password: "root",
    database: "itfu"
});

con.connect(function(err) {

    if (err) throw err;

    LOG.trace("Connected!");

    var lineReader = readline.createInterface({
        input: fs.createReadStream(process.argv[2])
    });

    lineReader.on('line', function (line) {

        LOG.trace("Processing", line);

        let file = fs.readFileSync(DIR + line);
        let hash = md5(file)

        let params = {
            Bucket: BUCKET,
            Key: line, 
            Body: file
        }

        s3.putObject(params, function(err, data) {

            if (err) return LOG.error(err);

            LOG.trace("Successfully uploaded file to S3", params.Bucket, params.Key);

            persist(con, ARTIST_ID, line, hash);
        });

    });
});

function persist(con, artistId, line, hash) {

    let vals = [ artistId, hash, line, '', 'Automatically generated', 'ITFU', moment().format('YYYY-MM-DD HH:mm:ss')];

    let sql = buildQuery(vals);

    LOG.trace("Inserting record into database");

    con.query(sql, function (err, result) {
        if (err) {
            return LOG.error("Failed to persist record into database", line, artistId);
        }

        LOG.trace("Record inserted");
    });
}

function buildQuery(vals) {

    //var sql = "INSERT INTO pictures (name, address) VALUES ('Company Inc', 'Highway 37')";
    var sql = "INSERT INTO pictures (`artist_id`, `signiture`, `name`, `image`, `caption`, `description`, `date_added`) VALUES";
    sql += "('"; 
    sql += vals.join("','")
    sql += "');";

    return sql;
}
