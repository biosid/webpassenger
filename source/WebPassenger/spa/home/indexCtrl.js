(function (app) {
    'use strict';

    app.controller('indexCtrl', indexCtrl);

    indexCtrl.$inject = ['$scope', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'uiGmapGoogleMapApi', 'uiGmapIsReady', 'systemConfig'];
    function indexCtrl($scope, membershipService, notificationService, $rootScope, $location, apiService, uiGmapGoogleMapApi, uiGmapIsReady, systemConfig) {
        $scope.pageClass = 'page-home';

       
    }

})(angular.module('webPassenger'));