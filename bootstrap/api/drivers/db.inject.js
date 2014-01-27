/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 24.01.14 1:30
 */

var mongoose = require('mongoose');

exports.$db = function inject(config, logger) {
    //noinspection JSUnresolvedVariable
    var $db = mongoose.createConnection(
            config.mongodb.connect.host || 'localhost',
            config.mongodb.connect.db || 'ldapdb',
            config.mongodb.connect.port || 27017,
            config.mongodb.options || {}
        );

    mongoose.connection.on('error', function (error) {
        logger.error(error);
    });

    return $db;
};