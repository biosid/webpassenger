(function (app) {
    'use strict';

    app.controller('codeConfirmCtrl', codeConfirmCtrl);

    codeConfirmCtrl.$inject = ['$scope', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'systemConfig'];

    function codeConfirmCtrl($scope, membershipService, notificationService, $rootScope, $location, apiService, systemConfig) {

        var serviceBase = systemConfig.BaseUrl;
        $scope.pageClass = 'page-login';
        $scope.confirm = confirm;
        $scope.user = {};

        function confirm() {
            membershipService.loginByPhoneCode($rootScope.tempUser.phone, $scope.user.code, completed);
        }

        function completed() {
            if ($rootScope.previousState)
                $location.path('/orders/add');
            else
                $location.path('/orders/add');

            $scope.userData.displayUserInfo();
        }

        if (!$rootScope.tempUser) {
            if ($rootScope.previousState)
                $location.path('/login');
            else
                $location.path('/login');
        }


    }

})(angular.module('common.core'));