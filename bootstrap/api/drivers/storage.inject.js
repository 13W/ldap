/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 23.01.14 15:30
 */

var async = require('async'),
    schema = require('./schemas/common'),
    ObjectId = require('mongoose').Types.ObjectId,
    Storage = schema.Storage,
    User = schema.User;

var objectClass = exports.objectClasses = {};

exports.Storage = function inject(logger, config, $db) {
    
    Storage.statics.Authenticate = function (dn, password, options, callback) {
        options = options || {};
        options.lean = true;
        this.findOne({_dn: dn, _password: password}, {}, options, callback);
    };
    
    Storage.statics.findByDn = function (dn, options, callback) {
        var self = this;
        options = options || {};
        options.lean = true;
        async.parallel([
            function (callback) {
                self.find({_dn: dn}, {}, options, callback);
            },
            function (callback) {
                self.findByFilter({_tags: dn}, {}, callback);
            }
        ], function (error, result) {
            callback(error, !error && [].concat.apply([], result));
        });
    };
    
    Storage.statics.findByFilter = function (filter, options, callback) {
        options = options || {};
        options.lean = true;
        this.find(filter, {}, options, function (error, result) {
            if (error) {
                logger.error(JSON.stringify(filter), error);
            } else {
                callback(error, result);
            }
        })
    };

    Storage.statics.saveRecord = function (attributes, options, callback) {
        var objClass = objectClass[attributes.objectclass];
        if (!objClass) {
            callback(new Error('object Class not found "' + attributes.objectclass + '"'));
        } else {
            var id = attributes._id || new ObjectId;
            delete attributes._id;
            if (objClass.schema.methods.preset) {
                objClass.schema.methods.preset.call(attributes);
            }
            objectClass[attributes.objectclass].update({_id: id}, attributes, {upsert: true}, function (error, result) {
                attributes._id = id;
                console.log('After update', attributes);
                callback(error, attributes);
            });
        }
    };

    Storage.statics.removeByDn = function (dn, options, callback) {
        var self = this;
        this.remove({$or: [{_dn: dn}, {_tags: dn, objectclass: {$in: ['fingerprint']}}]}, function () {
            self.update({$or: [{memberof: dn}, {_tags: dn}, {owner: dn}]}, {$pull: {memberof: dn, _tags: dn, owner: dn}}, {}, callback);
        });
    };

    var schemas = Object.getOwnPropertyNames(schema),
        length = schemas.length,
        k;
    
    for (k = 0; k < length; k += 1) {
        objectClass[schemas[k].toLowerCase()] = $db.model(schemas[k], schema[schemas[k]], 'storage');
    }
    
    return $db.model('Storage');
};
