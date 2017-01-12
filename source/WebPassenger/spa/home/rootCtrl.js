(function (app) {
    'use strict';

    app.controller('rootCtrl', rootCtrl);

    rootCtrl.$inject = ['$scope', '$location', 'membershipService', '$rootScope', 'hotkeys', 'ngDialog', 'apiService', 'systemConfig', 'notificationService'];
    function rootCtrl($scope, $location, membershipService, $rootScope, hotkeys, ngDialog, apiService, systemConfig, notificationService) {

        var serviceBase = systemConfig.BaseUrl;
        $scope.userPhoneNumber = "";

        $scope.$on('Keepalive', function () {
            // do something to keep the user's session alive

            if (membershipService.isUserLoggedIn())
                membershipService.refreshToken();
        });

        //methods
        function displayUserInfo() {
            $scope.userData.isUserLoggedIn = membershipService.isUserLoggedIn();
            if ($scope.userData.isUserLoggedIn) {
                $scope.username = $rootScope.authorization.loggedUser.username;
            }
        }

        function logout() {
            membershipService.removeCredentials();
            $location.path('/login');
            $scope.userData.displayUserInfo();

        }

        //utils
        function processHotKeys() {
            hotkeys.add({
                combo: 'f4',
                description: 'This one goes to 11',
                callback: function () {
                    $scope.loginDialog();
                }
            });
        }

        function initLoginModel() {
            $scope.loginModel = {
                phoneNumber: "",
                code: "",
                codeHadSended: false
            }
        }

        function loginDialog() {
            ngDialog.open({
                template: 'spa/home/loginDialog.html',
                className: 'ngdialog-theme-default',
                scope: $scope
            });
        }

        function requestCode() {
            var serviceBase = systemConfig.BaseUrl;
            console.log($scope);
            var data = {
                phone: $scope.loginModel.phoneNumber.replace(/[^0-9\.]+/g, "")
            }
            if (systemConfig.debugMode) {
                console.log("entered phone number");
                console.log(data);
            }
            apiService.post(serviceBase + 'accounts/phone/code', data, completed);

            function completed() {
                $scope.loginModel.phoneNumber = $scope.loginModel.phoneNumber;
                $scope.loginModel.codeHadSended = true;
            }
        }

        function sendCode() {
            membershipService.loginByPhoneCode($scope.loginModel.phoneNumber.replace(/[^0-9\.]+/g, ""), $scope.loginModel.code, completed);

            function completed() {
                initLoginModel();
                ngDialog.closeAll();
                $scope.userData.displayUserInfo();
                if ($scope.loginDialogCallBack);
                $scope.loginDialogCallBack();
            }
        }

        function cancel() {
            ngDialog.closeAll();
            initLoginModel();
        }


        //modeling
        $scope.userData = {};
        $scope.userData.displayUserInfo = displayUserInfo;
        $scope.logout = logout;
        $scope.loginModel = {};
        $scope.roles = {};
        $scope.loginDialog = loginDialog;
        $scope.requestCode = requestCode;
        $scope.sendCode = sendCode;
        $scope.cancel = cancel;
        $scope.loginDialogCallBack = function () { };

        // in controller
        $scope.init = function () {

            $scope.userData.isUserLoggedIn = membershipService.isUserLoggedIn();

        };

        processHotKeys();

        initLoginModel();

        displayUserInfo();

        $scope.$on('LoginRedirectEvent', function (event, args) {
            displayUserInfo();
        });

        $scope.$on('showLogInDialog', function (event, data) {
            console.log(data);
            if (isFunction(data))
                $scope.loginDialogCallBack = data;

            $scope.loginDialog();
        });

        function isFunction(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }
    }

})(angular.module('webPassenger'));