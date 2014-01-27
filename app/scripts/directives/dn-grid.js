'use strict';

angular.module('ldapApp')
    .directive('dnGrid', function () {
        return {
            priority: 400,
            template: '<div class="form-group">\
            <button class="btn btn-primary" data-ng-click="detail({}, {add: true})">New</button>\
            <button class="btn btn-danger" data-ng-show="selected.length" data-ng-click="remove(selected)">Delete</button>\
            </div>\
            <div data-ng-grid="options" style="height: 400px;"></div>\
                ',
            restrict: 'EA',
            scope: {
                dn: '=',
                objectclass: '=',
                filter: '='
            },
            controller: function ($scope, $resource, $modal) {
                $scope.dn = $scope.dn.replace(/ /g, '');
                $scope.selected = [];
                
                $scope.columnDef = [];
                
                function createColumnDefinition(data) {
                    var keys = {},
                        length = data.length === 0 ? 0 : 1, // || data.length,
                        k;
                    for (k = 0; k < length; k += 1) {
                        var names = Object.getOwnPropertyNames(data[k]),
                            namesLength = names.length,
                            i;
                        for (i = 0; i < namesLength; i += 1) {
                            if (names[i][0] !== '_' && !Array.isArray(data[k][names[i]])) {
                                keys[names[i]] = names[i].replace(/(^.|[A-Z])/g, function (s, d, i) {
                                    return (i ? ' ' : '') + s.toUpperCase();
                                });
                            }
                        }
                    }
                    Object.getOwnPropertyNames(keys).forEach(function (key) {
                        var column = {
                            field: key,
                            displayName: keys[key]
                        };
                        if (key === 'cn') {
                            column.cellTemplate = '<div class="ngCellText colt{{$index}}" \
                                data-ng-click="detail(row.entity, {edit: true})">\
                                    <a href="JavaScript:{}">{{row.getProperty(col.field)}}</a>\
                                </div>';
                        }
                        $scope.columnDef.push(column);
                    })
                }
                
                $scope.options = {
                    data: 'myData',
                    selectedItems: $scope.selected,
                    columnDefs: 'columnDef',
                    
                    tabIndex: 1,
                    enableCellSelection: false,
                    enableRowSelection: true,
                    multiSelect: false,
                    keepLastSelected: true,
                    enableCellEdit: false
                };

                $scope.myData = [];
                
                var $api = $resource('/api/dn/:dn', {dn: '@_dn'}),
                    $$scope = $scope;
                
                $api.query({dn: $scope.dn}, function (resources) {
                    createColumnDefinition(resources);
                    $scope.myData = resources;
                });
                
                $scope.detail = function (item, options) {
                    $modal.open({
                        resolve: {
                            input: function () {
                                return angular.extend({}, item);
                            }
                        },
                        template: '\
                                <div>\
                                    <div class="modal-header">\
                                        <h3>{{ input.cn }}<span class="text-muted" style="font-size: 0.8em;padding-left: 15px;">' + $scope.dn + '</span></h3>\
                                    </div>\
                                    <div class="modal-body" data-ng-include="\'views/' + $scope.objectclass + '-detail.html\'"></div>\
                                    <div class="modal-footer">\
                                        <button class="btn btn-primary" ng-click="ok()">OK</button>\
                                        <button class="btn btn-warning" ng-click="cancel()">Cancel</button>\
                                    </div>\
                                </div>',
                        controller: function ($scope, $modalInstance, input) {
                            $scope.input = input;
                            $scope.ok = function () {
                                function saveFunc(result) {
                                    angular.extend(item, result);
                                    if (options.add) {
                                        $$scope.myData.push(item);
                                    }
                                }

                                if (item && $scope.input || options.add && $scope.input) {
                                    $scope.input._dn = $scope.input._dn || $$scope.dn;
                                    $scope.input.objectclass = $$scope.objectclass;
                                    
                                    if ($scope.input.save) {
                                        $scope.input.save(saveFunc);
                                    } else {
                                        $api.save($scope.input, saveFunc);
                                    }
                                }
                                $modalInstance.close();
                            };
                            
                            $scope.cancel = function () {
                                $modalInstance.dismiss('cancel');
                            };
                        }
                    });
                };
                
                $scope.remove = function (selected) {
                    selected.forEach(function (e) {
                        e.$remove(function () {
                            var index = $scope.myData.indexOf(e);
                            $scope.myData.splice(index, 1);
                        });
                    });
                };
            }
        };
    });
