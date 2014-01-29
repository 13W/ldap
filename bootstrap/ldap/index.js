/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 24.01.14 15:10
 */

var ldapjs = require('ldapjs'),
    config = require('easy-config'),
    logger = require('bunyan').createLogger({
        name: 'LDAP',
        level: 'info'
    }),
    server = ldapjs.createServer({
        log: logger
    }),
    baseDn = config.ldap.baseDn,
    
    api = require('./../api'),
    storage = api.get('Storage');


server.listen(config.ldap.bindPort, config.ldap.bindHost, function () {
    console.log('LDAP server listening at: ' + server.url);
});

function authorize(req, res, next) {
    if (!req.connection.ldap.bindDN.equals('cn=root')) {
        //noinspection JSUnresolvedFunction
        return next(new ldapjs.InsufficientAccessRightsError());
    }

    return next();
}

server.bind(config.ldap.rootDn, function(req, res, next) {
    console.log('bind to server', req.dn.toString(), req.credentials);
    if (req.dn.toString() !== config.ldap.rootDn || req.credentials !== config.ldap.rootPw) {
        //noinspection JSUnresolvedFunction
        return next(new ldapjs.InvalidCredentialsError());
    }

    res.end();
    return next();
});

server.bind(baseDn, function (req, res, next) {
    console.log('bind to server', req.dn.toString(), req.credentials);
    storage.Authenticate(req.dn.toString(), req.credentials, {}, function (error, user) {
        if (error || !user) {
            next(new ldapjs.InvalidCredentialsError());
        } else {
            console.log(user);
            res.end();
            next();
        }
    });
});

server.add(baseDn, authorize, function (req, res, next) {
    if (!req.dn.rdns[0].cn) {
        //noinspection JSUnresolvedFunction
        return next(new ldapjs.ConstraintViolationError('cn required'));
    }

    var entry = req.toObject().attributes;

    if (entry.objectclass.indexOf('unixUser') === -1) {
        return next(new ldap.ConstraintViolation('entry must be a unixUser'));
    }
});

function filter2query(json, result) {
    result = result || {};
    if (!json) {
        return result;
    }
    if (!Array.isArray(json)) {
        json = [json];
    }

    var length = json.length,
        k;

    function set(value, key) {
        if (Array.isArray(result)) {
            if (key) {
                var O = {};
                O[key] = value;
                result.push(O);
            } else {
                result.push(value);
            }
        } else if (key) {
            result[key] = value;
        } else {
            console.log('Set:', key, value, result);
            for (key in value) {
                if (value.hasOwnProperty(key)) {
                    result[key] = value;
                }
            }
        }
        return value;
    }

    for (k = 0; k < length; k += 1) {
        var item = json[k];
        switch (item.type) {
            case 'and'          :
                filter2query(item.filters, set([], '$and'));
                break;
            case 'or'           :
                filter2query(item.filters, set([], '$or'));
                break;
            case 'present'      :
                set({$exists: true}, item.attribute);
                break;
            case 'approx'       :
                set({$regex: item.value, $options: 'i'}, item.attribute);
                break;
            case 'equal'        :
                set(item.value, item.attribute);
                break;
            case 'substring'    :
                var filterString = '';
                if (item.initial) {
                    filterString += '^' + item.initial;
                }
                if (item.any) {
                    filterString += '.*(?:' + item.any.join('|') + ').*';
                }
                if (item.final) {
                    filterString += item.final + '$';
                }
                set({$regex: filterString}, item.attribute);
                break;
            case 'not'          :
                filter2query(item.filter, set([], '$nin'));
                break;
            case 'ge'           :
                set({$gte: item.value}, item.attribute);
                break;
            case 'le'           :
                set({$lte: item.value}, item.attribute);
                break;
            default             :
                console.log('Filter not defined:', item.type, item.filters, item);
                break;
        }
    }
    return result;
}



server.search(baseDn, authorize, function (req, res, next) {
    logger.warn('Search DN: ', req.dn.toString());
    console.log('Request Scope', req.scope.toString());
    console.log('request filter', req.filter.toString());
    var filter = {$and: [
        {$or: [{_dn: req.dn.toString()}, {_tags: req.dn.toString()}]}
    ]};
    
    filter.$and.push(filter2query(req.filter));
    
    storage.findByFilter(filter, {}, function (error, result) {
        if (error) {
            res.send(error);
        } else {
            result.forEach(function (row) {
                res.send({
                    dn: row._dn,
                    attributes: row
                });
            })
        }
        
        res.end();
    });
});
