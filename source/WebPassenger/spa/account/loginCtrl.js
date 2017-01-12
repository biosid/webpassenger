(function (app) {
    'use strict';

    app.controller('loginCtrl', loginCtrl);

    loginCtrl.$inject = ['$scope', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'systemConfig'];

    function loginCtrl($scope, membershipService, notificationService, $rootScope, $location, apiService, systemConfig) {

        var serviceBase = systemConfig.BaseUrl;
        $scope.pageClass = 'page-login';
        $scope.getCode = getCode;
        $scope.user = {};

        function getCode() {
            /*  var user = { username: "a@taxys.ru", password: "123" }
              membershipService.login(user, function () { $location.path('/orders/add'); });*/

            var serviceBase = systemConfig.BaseUrl;
            var data = {
                phone: "7" + $scope.user.phoneNumber
            }
            if (systemConfig.debugMode) {
                console.log("entered phone number");
                console.log(data);
            }
            apiService.post(serviceBase + 'accounts/phone/code', data, completed);
        }

        function completed() {

            $rootScope.tempUser = {};
            $rootScope.tempUser.phone = "7" + $scope.user.phoneNumber;

            if ($rootScope.previousState)
                $location.path('/code-confirm');
            else
                $location.path('/code-confirm');
        }
    }

})(angular.module('common.core'));