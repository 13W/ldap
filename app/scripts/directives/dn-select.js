'use strict';

angular.module ('ldapApp').directive ('dnSelect', function () {
    return {
        template: '<input type="text" class="form-control" ui-select2="select2options" value="1">',
        replace : true,
        transclude: true,
        restrict: 'E',
        scope: {
            dn: '=',
            objectclass: '=',
            filter: '=',
            ngModel: '='
        },
        controller: function postLink($scope, $resource) {
            var $api = $resource ('/api/dn/:dn', {dn: '@dn'}, {
                find: {method: 'POST', isArray: true, params: {dn: 'find'}}
            });
            
            $scope.filter = $scope.filter || {};
            var defaultValues = $scope.ngModel.map(function (e) {
                return typeof e === 'string' ? e : e.dn;
            });
            
            $scope.select2options = {
                multiple    : true,
                allowClear  : true,
                id          : function (object) {
                    return typeof object === 'string' ? object : object.dn;                
                },
                initSelection: function (element, callback) {
                    $api.find(JSON.stringify({_dn: {$in: defaultValues}}), function (result) {
                        result = result.map(function (e) {
                            return {cn: e.cn, dn: e._dn, __proto__: {toJSON: function () {return e._dn;}}};
                        });
                        callback(result);
                    });
                },
                formatResult: function (item) {
                    return item.cn;
                },
                formatSelection: function (item) {
                    return typeof item === 'string' ? item : item.cn;
                },
                query       : function (query) {
                    var data = {results: []},
                        filter = angular.extend({}, $scope.filter),
                        currentValues = $scope.ngModel.map(function (e) {
                            return typeof e === 'string' ? e : e.dn;
                        });
                    
                    filter = {$and: [filter, {$or: [{cn: {$regex: query.term, $options: 'i'}}, {name: {$regex: query.term, $options: 'i'}}]}]};
                    $api.query({dn: $scope.dn, filter: JSON.stringify(filter)}, function (result) {
                        data.results = result
                            .filter(function (e) {
                                return !~currentValues.indexOf(e._dn);
                            })
                            .map(function (e) {
                                return {cn: e.cn, dn: e._dn, __proto__: {toJSON: function () {return e._dn;}}};
                            }) || [];
                        query.callback(data);
                    });
                }
            };
        }
    };
});
