'use strict';

angular.module('ldapApp')
    .directive('validate', function () {
        return {
            require:'ngModel',
            scope: {
                valid: '=validate'
            },
            link: function postLink(scope, element, attrs, ngModelCtrl) {
                ngModelCtrl.$parsers.unshift(function (viewValue) {
                    ngModelCtrl.$setValidity('condition', !scope.valid);
                    return viewValue;
                });
                ngModelCtrl.$formatters.unshift(function (modelValue) {
                    ngModelCtrl.$setValidity('condition', !scope.valid);
                    return modelValue;
                });
            }
        };
    });
