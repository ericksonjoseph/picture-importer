'use strict'

const AWS = require('aws-sdk');

var s3 = new AWS.S3();

module.exports = class S3 {

    static putObject() {
        s3.putObject.apply(s3, arguments);
    }

    static listObjects() {
        s3.listObjects.apply(s3, arguments);
    }

    static getObject() {
        s3.getObject.apply(s3, arguments);
    }
}
