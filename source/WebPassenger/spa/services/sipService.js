(function (app) {
    'use strict';

    app.factory('sipService', sipService);

    apiService.$inject = ['$scope', '$http', '$location', 'notificationService', '$rootScope', 'systemConfig'];

    function sipService($scope, $http, $location, notificationService, $rootScope, systemConfig) {

       

        var service = {
            init: init,
            logIn: login,
            logOut: logOut,
            audioCall: audioCall,
            videoCall: videoCall,
            screenShare: screenShare
        };

        function init(sipSettings) {
            $scope.sipSettings = sipSettings;




        }
        function login() { }
        function logOut() { }
        function audioCall() { }
        function videoCall() { }
        function screenShare() { }
        return service;
    }

})(angular.module('common.core'));