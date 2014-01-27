'use strict';

angular.module('ldapApp')
    .controller('MainCtrl', function ($scope, $location) {
        $scope.location = {
            get path() {
                return $location.$$path;
            },
            set path(val) {

            }
        };
        $scope.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    });
