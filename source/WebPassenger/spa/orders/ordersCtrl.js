(function (app) {
    'use strict';

    app.controller('ordersCtrl', ordersCtrl);
    ordersCtrl.$inject = ['$scope', '$interval', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'uiGmapGoogleMapApi', 'uiGmapIsReady', 'systemConfig'];

    function ordersCtrl($scope, $interval, membershipService, notificationService, $rootScope, $location, apiService, uiGmapGoogleMapApi, uiGmapIsReady, systemConfig) {
        var serviceBase = systemConfig.BaseUrl;

        $scope.ordersGridColumns = initOrderGridColumns();
        $scope.onOrderSelection = onOrderSelection;
        $scope.ordersData = [];
        $scope.currentOrderId = 0;
        $scope.onTabSelect = onTabSelect;
        $scope.getOrdersData = getOrdersData;
        $scope.currentGridFilter = "All";
        $scope.ordersRefreshWork = {};
        $scope.map = { control: {}, center: { latitude: 0, longitude: 0 }, zoom: 13, polylines: [] };
        //options
        $scope.autocompleteOptions = { componentRestrictions: { country: 'ru' }, types: ['geocode'] }
        $scope.windowOptions = { visible: false };
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

        function onTabSelect(e) {
            console.log("Selected: " + $(e.item).find("> .k-link").text());
            $scope.currentGridFilter = $(e.item).find("> .k-link").text();
            $scope.getOrdersData();
        };

        function initOrderGridColumns() {
            return [
                    { field: "employeeName", title: "Сотрудник" },
                   { field: "passengerName", title: "Пассажир" },
                    { field: "passengerPhone", title: "Телефон" },
                     { field: "registrationPlate", title: "Номер автомобиля" },
                    { field: "driverPhone", title: "Номер водителя" },
                    { field: "startAddress", title: "Начальный адрес" },
                    { field: "endAddress", title: "Конечный адрес" },
                      { field: "departedAt", title: "Контрольное время" },
                       { field: "state.name", title: "Статус" },
                     { command: { text: "открыть", click: onOrderGridChange }, title: " " }
            ];
        }

        function onOrderGridChange(e) {
            e.preventDefault();
            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
            console.log(dataItem);
            $location.path('/orders/edit/' + dataItem.id);
        }

        function onOrderSelection(e) {
            var selectedRow = e.sender.select();
            var dataItem = e.sender.dataItem(selectedRow);
            console.log(dataItem);
            $scope.currentOrderId = dataItem.id;
            getOfferRoute();
        }

        function getOrdersData() {
            var action = 'orders';
            apiService.get(serviceBase + action, { ignoreLoadingBar: true }, function (result) {
                $scope.ordersData = [];
                if ($scope.currentGridFilter == "All") {
                    $scope.ordersData = result.data.items;
                } else {
                    for (var i = 0; i < result.data.items.length; i++) {
                        if (result.data.items[i].state.name == $scope.currentGridFilter)
                            $scope.ordersData.push(result.data.items[i]);
                    }
                }

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
                                visible: true,
                                /* icons: [
            {
                icon: {
                    path: google.maps.SymbolPath.BACKWARD_OPEN_ARROW
                },
                offset: '25px',
                repeat: '50px'
            }
                                 ]*/
                            };

                        };
                        $scope.map.polylines = [];
                        $scope.map.polylines.push(createPolyline(result.data.items));
                    });
                });
            });
        }

        loadCurrentLocation();

        $scope.ordersRefreshWork = $interval(function () {
            $scope.getOrdersData();
        }, 2500);


        $scope.$on("$destroy", function () {
            if ($scope.ordersRefreshWork) {
                $interval.cancel($scope.ordersRefreshWork);
            }
        });

    };


})(angular.module('webPassenger'));