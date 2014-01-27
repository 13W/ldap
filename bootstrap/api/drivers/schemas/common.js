/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 23.01.14 15:41
 */

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ldapjs = require('ldapjs');

exports.Storage = new Schema({});

var User = exports.User = new Schema({
    objectclass: {type: String, default: 'user'},
    cn: String,
    firstName: String,
    lastName: String,
    login: String,
    _password: String,
    company: [String],
    email: String,
    phone: [String],
    memberof: []
});

function fillDn() {
    var cn = this.cn,
        dn = ldapjs.dn.parse(this._dn),
        exist = dn.rdns.filter(function (e) {
            if (e.hasOwnProperty('cn')) {
                e.cn = cn;
                return true;
            }
            return false;
        }).length;

    if (!exist) {
        dn.rdns.unshift({cn: cn, __proto__: {toString: function () {return 'cn=' + cn;}}});
    }

    this._dn = dn.toString();
    this._tags = [];

    dn.rdns.shift();
    while(dn.rdns.length) {
        this._tags.push(dn.toString());
        dn.rdns.shift();
    }

    this._tags = this._tags.concat(this.memberof || []);
}

User.methods.preset = function() {
    this.cn = this.firstName + ' ' + this.lastName;
    //noinspection JSUnusedGlobalSymbols
    this._updated = new Date();

    fillDn.call(this);
    return this;
};

var Group = exports.Group = new Schema({
    objectclass: {type: String, default: 'group'},
    cn: String,
    name: String,
    description: String
});

Group.methods.preset = function () {
    fillDn.call(this);
};

var schemas = Object.getOwnPropertyNames(exports);

function createSystemProperties(name) {
    var schema = exports[name];
    schema.add({
        _dn: String,
        _tags: [String],
        _uuid: String,
        _created: {type: Date, default: Date.now},
        _updated: Date,
        owner: [String]
    });
}

schemas.forEach(createSystemProperties);

/*
exports.Storage.ensureIndex({uuid: 1});
exports.Storage.ensureIndex({_tags: 1});
exports.Storage.ensureIndex({_dn: 1});
*/
