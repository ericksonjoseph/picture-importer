'use strict';

const fs = require('fs')
const LOG = require('../Logger');
const s3 = require('../services/S3.js');
const gm = require('gm').subClass({imageMagick: true});

const BUCKET = "net.itfu.images";
const TARGET_S3_FOLDER = 'sq240/';
const SOURCE_S3_FOLDER = 'original/';

module.exports = class CreateThumbnailsController {

    static run() {
        LOG.trace("Running CreateThumbnailsController");

        // List S3 Bucket
        var params = {
            Bucket: BUCKET,
            Prefix: SOURCE_S3_FOLDER,
        };

        s3.listObjects(params, function(err, data) {

            if (err) return console.log(err, err.stack);

            for (let object of data.Contents) {

                if (object.Key == SOURCE_S3_FOLDER) {
                    continue;
                }

                CreateThumbnailsController.processObject(object);
            }

        });

    }

    static processObject(object) {

        LOG.trace("Processing Object", object);

        var params = {
            Bucket: BUCKET,
            Key: object.Key
        };

        // Download each one
        s3.getObject(params, function(err, data) {

            if (err) return LOG.error(err, err.stack);

            LOG.trace("Got Object", data);

            // original
            let name = object.Key.substring(SOURCE_S3_FOLDER.length);

            gm(data.Body, name).size(function (err, size) {

                if (err) return LOG.error(err, err.stack);

                LOG.trace("Size", size);

                let windowSize = 240;

                if (size.width < windowSize || size.height < windowSize) {
                    LOG.error("Picture too small to resize", object, BUCKET)
                    return;
                }

                let w = (size.width < size.height) ? windowSize : null;
                let h = (size.width < size.height) ? null : windowSize;

                let x = 0;
                let y = CreateThumbnailsController.findSweetSpot(windowSize, size.width, size.height);

                //for landscape
                if (size.width > size.height) {
                    x = CreateThumbnailsController.findSweetSpot(windowSize, size.height, size.width);
                    y = 0;
                }

                LOG.trace(w, h, x , y );

                let croppedFile = './tmp/' + name;

                gm(data.Body, croppedFile)
                .resize(w, h)
                .crop(windowSize, windowSize, x, y)
                .write(croppedFile, function (err) {
                    if (err) return LOG.error(err, err.stack);

                    CreateThumbnailsController.uploadToS3(croppedFile, object.Key);
                });
            });
        });
    }

    static uploadToS3(filename, key) {

        let name = key.substring(SOURCE_S3_FOLDER.length);

        let params = {
            Bucket: BUCKET,
            Key: TARGET_S3_FOLDER + name,
            Body: fs.readFileSync(filename)
        }

        s3.putObject(params, function(err, data) {

            if (err) return LOG.error(err);

            LOG.info("Successfully uploaded file to S3", params.Bucket, params.Key);

        });
    }

    static findSweetSpot(ws, x, y) {
        return (((y/(x/ws))/2)-(ws/2));
    }
        // Cut thumbnail

        // Upload thumbnail
}
