/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 23.01.14 0:39
 */

var restify = require('restify');

exports.$app = function inject(logger, Storage) {
    var server = restify.createServer({
        name: 'api',
        log: logger
    });
    
    var prefix = '/api';

    function route(path) {
        return new RegExp('^' + prefix + path, '');
    }

    server.use(restify.bodyParser());
    
    server.get(prefix + '/ping', function(req, res, next) {
        res.end('pong');
    });
    
    server.get(route('/dn/(.*)'), function (req, res, next) {
        req.log.info(req.params, 'request dn');
        Storage.findByDn(req.params[0], {}, function (error, result) {
            if(error) {
                next(error);
            } else {
                res.json(result);
            }
        });
    });
    
    server.put(prefix + '/dn/:dn', function (req, res, next) {
        
    });
    
    server.post(prefix + '/dn/find', function (req, res, next) {
        var filter = req.body;
        console.log(filter);
        Storage.findByFilter(filter, {}, function (error, result) {
            if (error) {
                next(error);
            } else {
                res.json(result);
            }
        });
    });
    
    server.post(route('/dn/(.*)'), function (req, res, next) {
        req.log.warn(req.body);
        Storage.saveRecord(req.body, {}, function (error, result) {
            console.log('server.post: ', arguments);
            
            if(error) {
                next(error);
            } else {
                res.json(result);
            }
        });
    });
    
    server.del(route('/dn/(.*)'), function (req, res, next) {
        var dn = req.params[0];
        if (!dn) {
            return next(new Error('DN Required, but not defined'));
        }
        dn = dn.replace('%20', ' ');
        console.warn('Delete ByDn', dn);
        Storage.removeByDn(dn, {}, function (error) {
            if (error) {
                next(error);
            } else {
                res.end();
            }
        })
    });
    
    return server;
};