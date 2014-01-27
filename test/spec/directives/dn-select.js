'use strict';

describe('Directive: dnSelect', function () {

  // load the directive's module
  beforeEach(module('ldapApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<dn-select></dn-select>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the dnSelect directive');
  }));
});
