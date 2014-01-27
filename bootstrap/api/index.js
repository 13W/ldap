/**
 * User: Vladimir Bulyga <zero@ccxx.cc>
 * Project: LDAP
 * Date: 23.01.14 0:37
 */

var restify = require('restify'),
    conf = require('easy-config'),
    Loader = require('sl').Loader,
    logger = require('bunyan').createLogger({
        name: 'lwa',
        serializers: restify.bunyan.serializers,
        level: 'trace'
    }),
    loader = new Loader('api', {
        log: logger
    });

loader.registerWrapper(function config() {
    return conf;
});

loader.load(__dirname + '/');

if (require.main !== module) {
    module.exports = loader;
} else {
    loader.invoke(function start($app, config) {
        $app.listen(config.http.port, config.http.host, function() {
            logger.info('Application started %s:%d', config.http.host || '0.0.0.0', config.http.port);
        });
    });
}

