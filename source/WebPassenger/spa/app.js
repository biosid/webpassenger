(function () {
    'use strict';

    var settings = settingsHttpGet();

    var app = angular
        .module('webPassenger', ['common.core', 'common.ui'])
        .config(config)
        .constant('systemConfig', {
            AppName: 'webPassenger',
            GoogleAnalitycsId: '',
            BaseUrl: settings.Host + '/api/v1/Passenger/',
            SiteUrl: settings.Host,
            debugMode: true,
            disableAuthorization: false,
            GoogleApiKey: "",
        })
        .run(run);

    config.$inject = ['$routeProvider', '$httpProvider', 'uiGmapGoogleMapApiProvider', 'KeepaliveProvider'];
    function config($routeProvider, $httpProvider, uiGmapGoogleMapApiProvider, KeepaliveProvider) {

        KeepaliveProvider.interval(120);

        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyBdPSq0KI8S_Ctpd2eqCEcRXP1KEeH2G2s',
            v: '3.20', //defaults to latest 3.X anyhow
            libraries: 'weather,geometry,visualization'
        });

        $httpProvider.interceptors.push('authInterceptorService');

        $httpProvider.defaults.useXDomain = true;

        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        $routeProvider
            .when("/login", {
                templateUrl: "spa/account/login.html",
                controller: "loginCtrl",
                resolve: { isAuthenticated: isAuthenticated }
            }).when("/code-confirm", {
                templateUrl: "spa/account/codeConfirm.html",
                controller: "codeConfirmCtrl"
            })
            .when("/orders/add", {
                templateUrl: "spa/orders/add.html",
                controller: "ordersAddCtrl",
                // resolve: { isAuthenticated: isAuthenticated }
            })
            .when("/orders/current/", {
                templateUrl: "spa/orders/current.html",
                controller: "ordersEditCtrl"
            })
            .otherwise({ redirectTo: '/orders/add' });
    }

    run.$inject = ['$rootScope', '$location', '$cookieStore', '$http','Keepalive'];

    function run($rootScope, $location, $cookieStore, $http, Keepalive) {
        // handle page refreshes

        Keepalive.start();

        $rootScope.authorization = $cookieStore.get('authorization') || {};

        $(document).ready(function () {
            $(".fancybox").fancybox({
                openEffect: 'none',
                closeEffect: 'none'
            });
            $('.fancybox-media').fancybox({
                openEffect: 'none',
                closeEffect: 'none',
                helpers: {
                    media: {}
                }
            });
            $('[data-toggle=offcanvas]').click(function () {
                $('.row-offcanvas').toggleClass('active');
            });
        });
    }

    isAuthenticated.$inject = ['membershipService', '$rootScope', '$location'];

    function isAuthenticated(membershipService, $rootScope, $location) {
        if (!membershipService.isUserLoggedIn()) {
            $rootScope.previousState = $location.path();
            $location.path('/login');
        }
    }

    app.factory('authInterceptorService', ['$q', '$location', '$cookieStore', '$rootScope', function ($q, $location, $cookieStore, $rootScope) {

        var authInterceptorServiceFactory = {};

        var request = function (config) {
            config.headers = config.headers || {};
            var authData = $cookieStore.get('authorization');
            if (authData) {
                config.headers.Authorization = 'Bearer ' + authData.loggedUser.token;
            }
            return config;
        }

        var responseError = function (rejection) {
            if (rejection.status === 401 || rejection.status === 403) {
                $rootScope.authorization = {};
                $cookieStore.remove('authorization');
                $location.path('/login');
            }
            return $q.reject(rejection);
        }

        var response = function (response) {
            if (response.status === 401 || response.status === 403) {
                $rootScope.authorization = {};
                $cookieStore.remove('authorization');
                $location.path('/login');
            }

            return response;
        }

        authInterceptorServiceFactory.request = request;
        authInterceptorServiceFactory.response = response;
        authInterceptorServiceFactory.responseError = responseError;
        return authInterceptorServiceFactory;
    }]);

    function settingsHttpGet() {
        var r;

        function settingsParser(xml) {
            var configuration = $(xml).find('configuration');

            var host = configuration.find('Host').text();

            r = { Host: host };
        };

        // чтение конфигурации
        $.ajax({
            type: "GET",
            url: "../spa/settings.xml",
            dataType: "xml",
            success: settingsParser,
            async: false
        });

        return r;
    }

})();