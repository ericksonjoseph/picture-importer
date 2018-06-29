'use strict';

const ARTIST_ID = process.argv[2];
const DIR = process.argv[4] + '/';
const BUCKET = "net.itfu.images";
const SOURCE_S3_FOLDER = 'original/';

const readline = require('readline');
const mysql = require('mysql');
const fs = require('fs')
const md5 = require('md5')
const AWS = require('aws-sdk');
const moment = require('moment');
const path = require('path');

const LOG = require('../Logger');
const s3 = require('../services/S3.js');

module.exports = class ImportPicturesController {

    static run() {

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
                input: fs.createReadStream(process.argv[3])
            });

            let i = 0;

            lineReader.on('line', function (line) {

                i++;

                LOG.trace("Processing", line);

                let file = fs.readFileSync(DIR + line);
                let hash = md5(file)
                let filename = line

                let params = {
                    Bucket: BUCKET,
                    Key: SOURCE_S3_FOLDER + filename, 
                    Body: file
                }

                s3.putObject(params, function(err, data) {

                    if (err) return LOG.error(err);

                    LOG.trace("Successfully uploaded file to S3", params.Bucket, params.Key);

                    ImportPicturesController.persist(con, ARTIST_ID, filename, line, hash);
                });
            });
        });

    }

    static persist(con, artistId, filename, line, hash) {

        let vals = [ artistId, hash, filename, line, 'Automatically generated', 'ITFU', moment().format('YYYY-MM-DD HH:mm:ss')];

        let sql = ImportPicturesController.buildQuery(vals);

        LOG.trace("Inserting record into database");

        con.query(sql, function (err, result) {
            if (err) {
                return LOG.error("Failed to persist record into database", line, artistId);
            }

            LOG.trace("Record inserted");
        });
    }

    static buildQuery(vals) {

        //var sql = "INSERT INTO pictures (name, address) VALUES ('Company Inc', 'Highway 37')";
        var sql = "INSERT INTO pictures (`artist_id`, `signiture`, `name`, `image`, `caption`, `description`, `date_added`) VALUES";
        sql += "('"; 
        sql += vals.join("','")
        sql += "');";

        return sql;
    }
}

