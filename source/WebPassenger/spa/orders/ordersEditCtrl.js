(function (app) {
    'use strict';

    app.controller('ordersEditCtrl', ordersEditCtrl);
    ordersEditCtrl.$inject = ['$scope', '$interval', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'uiGmapGoogleMapApi', 'uiGmapIsReady', 'systemConfig', '$routeParams'];
    function ordersEditCtrl($scope, $interval, membershipService, notificationService, $rootScope, $location, apiService, uiGmapGoogleMapApi, uiGmapIsReady, systemConfig, $routeParams) {
        var serviceBase = systemConfig.BaseUrl;
        //model fields
        $scope.order = {};
        //metods
        $scope.returnToOrders = returnToOrders;
        $scope.map = { control: {}, center: { latitude: 0, longitude: 0 }, zoom: 13, polylines: [] };
        $scope.marker = { id: 1, center: { latitude: 0, longitude: 0 } };
        //options
        $scope.autocompleteOptions = { componentRestrictions: { country: 'ru' }, types: ['geocode'] }
        $scope.windowOptions = { visible: false };
        $scope.completionEnabled = true;


        function getOrder() {
            apiService.get(serviceBase + "orders/current", null, function (result) {

                if (!result.data.order) {
                    $location.path('/orders/add/');
                }
                else {
                    $scope.order = result.data.order;
                    $scope.map.center.latitude = result.data.order.route.center.latitude;
                    $scope.map.center.longitude = result.data.order.route.center.longitude;
                    $scope.marker.center.latitude = result.data.order.route.center.latitude;
                    $scope.marker.center.longitude = result.data.order.route.center.longitude;
                    $scope.distance = result.data.order.route.distance;
                    $scope.duration = result.data.order.route.duration;
                    function createPolyline(items) {

                        return {
                            id: 1,
                            path: items,
                            stroke: {
                                color: '#FF0000',
                                weight: 3
                            },
                            editable: false,
                            draggable: false,
                            geodesic: true,
                            visible: true
                        };

                    };
                    $scope.map.polylines = [];
                    $scope.map.polylines.push(createPolyline(result.data.order.route.items));
                    $scope.completionEnabled = $scope.order.state.id !== 50;
                }


            });
        }

        function returnToOrders() {
            $location.path('/');
        }

        //todo: code duplicate
        function loadCurrentLocation() {
            var action = "companies/current/location";
            // marker object
            $scope.marker = { id: 1, center: { latitude: 0, longitude: 0 } };
            apiService.get(serviceBase + action, { ignoreLoadingBar: true }, function (result) {
                console.log(result);
                $scope.map.center.latitude = result.data.latitude;
                $scope.map.center.longitude = result.data.longitude;
                $scope.marker.center.latitude = result.data.latitude;
                $scope.marker.center.longitude = result.data.longitude;
            });
        }
        //todo: code duplicate
        function getOfferRoute() {

            uiGmapIsReady.promise().then(function (instances) {                 // instances is an array object
                // pass the map to your function
                uiGmapGoogleMapApi.then(function (maps) {
                    var actionPreffix = "searches/";
                    var actionSuffix = "/route";
                    apiService.get(serviceBase + actionPreffix + $scope.order.searchSessionId + actionSuffix, { ignoreLoadingBar: true }, function (result) {
                        // coordinates center
                        $scope.windowOptions.visible = true;
                        $scope.map.center.latitude = result.data.center.latitude;
                        $scope.map.center.longitude = result.data.center.longitude;
                        $scope.marker.center.latitude = result.data.center.latitude;
                        $scope.marker.center.longitude = result.data.center.longitude;
                        $scope.distance = result.data.distance;
                        $scope.duration = result.data.duration;
                        function createPolyline(items) {

                            return {
                                id: 1,
                                path: items,
                                stroke: {
                                    color: '#FF0000',
                                    weight: 3
                                },
                                editable: false,
                                draggable: false,
                                geodesic: true,
                                visible: true
                            };

                        };
                        $scope.map.polylines = [];
                        $scope.map.polylines.push(createPolyline(result.data.items));
                    });
                });
            });
        }

        //  loadCurrentLocation();
        getOrder();
        // getOfferRoute();
    };


})(angular.module('webPassenger'));