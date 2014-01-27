'use strict';

angular.module('ldapApp', [
        'ngCookies',
        'ngResource',
        'ngSanitize',
        'ngRoute',
        'route-segment',
        'view-segment',
        'ui.bootstrap',
        'ui.bootstrap.buttons',
        'ngGrid',
        'ui.select2'
    ])
    .config(function ($routeProvider, $locationProvider, $routeSegmentProvider) {
        $locationProvider.hashPrefix('!');
        $locationProvider.html5Mode(false);
        
        $routeSegmentProvider.options.autoLoadTemplates = true;
        
        $routeSegmentProvider
            .when('/', 'root')
            .when('/users', 'root.users')
            .when('/groups', 'root.groups')
        
            .segment('root', {
                templateUrl: 'views/main.html',
                controller: 'MainCtrl'
            })
            .within()
                .segment('users', {
                    templateUrl: 'views/users.html',
                    controller: 'UsersCtrl'
                })
                .segment('groups', {
                    templateUrl: 'views/groups.html',
                    controller: 'GroupsCtrl'
                });
        
        $routeProvider
            .otherwise({
                redirectTo: '/'
            });
    });
