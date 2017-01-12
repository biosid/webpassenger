(function (app) {
    'use strict';

    app.controller('ordersAddCtrl', ordersAddCtrl);

    ordersAddCtrl.$inject = ['$scope', 'membershipService', 'notificationService', '$rootScope', '$location', 'apiService', 'uiGmapGoogleMapApi', 'uiGmapIsReady', 'systemConfig', '$window', '$interval'];

    function ordersAddCtrl($scope, membershipService, notificationService, $rootScope, $location, apiService, uiGmapGoogleMapApi, uiGmapIsReady, systemConfig, $window, $interval) {

        var serviceBase = systemConfig.BaseUrl;

        //model fields
        $scope.order = { phone: "" };
        var d = new Date();
        $scope.order.date = d.toLocaleString();
        $scope.offersData = {};
        $scope.offersPanelVisilble = false;
        $scope.currentSuggestionId = 0;

        $scope.dateTimeOptions = {
            min: new Date()
        }
        $scope.connection = {};
        $scope.places = {};

        var checkOrderTimer;

        //metods
        $scope.calculate = calculate;
        $scope.offersGridColumns = initOffersGridColumns();
        $scope.onOffersGridChange = onOffersGridChange;
        $scope.onSelection = getOfferRoute;
        //options
        $scope.autocompleteOptions = { componentRestrictions: { country: 'ru' }, types: ['geocode'] }
        $scope.windowOptions = { visible: false };

        $scope.map = { control: {}, center: { latitude: 0, longitude: 0 }, zoom: 13, polylines: [] };
        $scope.marker = { id: 1, center: { latitude: 0, longitude: 0 } };

        //todo: code duplicate
        function loadCurrentLocation() {
            var action = "companies/current/location";
            // marker object
            $scope.marker = { id: 1, center: { latitude: 0, longitude: 0 } };
            apiService.get(serviceBase + action, { ignoreLoadingBar: true }, function (result) {
                $scope.map.center.latitude = result.data.latitude;
                $scope.map.center.longitude = result.data.longitude;
                $scope.marker.center.latitude = result.data.latitude;
                $scope.marker.center.longitude = result.data.longitude;
            });
        }

        function getCurrentOrder() {

            apiService.get(serviceBase + "orders/current", null, function (result) {

                if (result.data.order) {
                    notificationService.displayInfo("У вас уже есть текущий заказ");
                    $location.path('/orders/current/');
                }
            });
        }

        function calculate() {

            if (!membershipService.isUserLoggedIn()) {
                $scope.$emit('showLogInDialog', getOffers);
            }
            else {
                getOffers();
            }

        }

        function getOffers() {

            var filter = {
                start: {
                    address: $scope.order.startAdress
                },
                end: {
                    address: $scope.order.finishAdress
                },
                preferOrder: {
                    id: 1
                },
                paymentMethod: {
                    id: 1
                }
            }
            var action = "searches";
            apiService.post(serviceBase + action, filter, function (result) {
                $scope.order.searchSessionId = result.data.searchId;
                $scope.offersData = result.data.toAdd;
                if (systemConfig.debugMode) {
                    console.log("searches results");
                    console.log(result);
                }
                suggestionHubStart();
                $scope.offersPanelVisilble = true;
                getOfferRoute();//Получаем маршрут
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

        function initOffersGridColumns() {
            return [
                   // { field: "id", title: "№" },
                    { field: "vehicleModel", title: "Марка" },
                     { field: "vehicleClass", title: "Класс" },
                     { field: "vehicleColor", title: "Цвет" },
                     { field: "arrivalTime", title: "Время прибытия" },
                     { field: "estimatedPrice", title: "Цена" },
                     { command: { text: "выбрать", click: onOffersGridChange }, title: " " }
            ];
        }

        function onOffersGridChange(e) {
            e.preventDefault();
            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
            if (systemConfig.debugMode) {
                console.log("onOffersGridChange: ");
                console.log(dataItem);
            }

            var url = serviceBase + "searches/suggestion-id/" + dataItem.id + "/make-request";
            apiService.post(url, null, function (result) {
                _startCheckOrderTimer(dataItem.id, result.data.seconds);
                $scope.currentSuggestionId = dataItem.id;
                notificationService.displayInfo("Предложение было отправлено водителю " + url);
                notificationService.showLoadingScreen("Ожидаем ответа водителя...");
            });
        }

        function suggestionHubStart() {

            $.signalR.ajaxDefaults.headers = {
                Authorization: "Bearer " + $rootScope.authorization.loggedUser.token
            };

            // Declare a proxy to reference the hub.
            $scope.connection = $.hubConnection(systemConfig.SiteUrl);
            var proxy = $scope.connection.createHubProxy('notificationHub');
            proxy.on('NewSuggestionState', newSuggestionState);
            proxy.on('OrderStateChanged', orderStateChanged);
            // Start the connection.
            $scope.connection.start().done(function () {
                if (systemConfig.debugMode) {
                    console.log('Now connected, connection ID=' + $scope.connection.id);
                }
            }).fail(function (error) {
                if (systemConfig.debugMode) {
                    console.log('Error: ' + error);
                }
            });
        }

        /*suggestionHub methods begin*/
        function _approved() {
            $scope.currentSuggestionId = 0;
            notificationService.displayInfo("Водитель подтвердил заказ");
            $location.path('/orders/current/');
            _stopCheckOrderTimer();
        }

        function _declined() {
            $scope.currentSuggestionId = 0;
            notificationService.displayWarning("Водитель отклонил заказ");
            _stopCheckOrderTimer();
        }

        function _expired() {
            $scope.currentSuggestionId = 0;
            notificationService.displayWarning("Водитель не откликнулся на заказ");
            _stopCheckOrderTimer();
        }

        function newSuggestionState(data) {

            if (systemConfig.debugMode) {
                console.log("Получен ewSuggestionState: ");
                console.log(data);
            }
            if (data.SuggestionId == $scope.currentSuggestionId) {
                notificationService.hideLoadinScreen();

                console.log(data);

                /*
                 * /// <summary>
    /// Диспетчер подготовил предложение.
    /// </summary>
    Created = 1,

    /// <summary>
    /// Пассажир получил предложение.
    /// </summary>
    Sent = 2,

    /// <summary>
    /// Пассажир выбрал предложение. Водителю отправлено уведомление.
    /// </summary>
    Chosen = 3,

    /// <summary>
    /// Водитель подтвердил предложение и начал исполнение заказа.
    /// </summary>
    Approved = 4,

    /// <summary>
    /// Водитель отклонил предложение.
    /// </summary>
    Declined = 5,

    /// <summary>
    /// Предложение просрочено.
    /// </summary>
    /// <remarks>
    /// Водитель не успел отреагировать и предложение ушло другому водителю. Google Translator утверждает, что
    /// формы "Overdued" у слова нет, поэтому Overdue правильно.
    /// </remarks>
    Overdue = 6,

    /// <summary>
    /// Диспетчер отклонил предложение, потому что Водитель был выбран другим Пассажиром.
    /// </summary>
    Expired = 7,
                 */

                suggestionStateSelect(data.Result.Id);
            }
        }

        function suggestionStateSelect(stateId) {
            switch (stateId) {
                /// Водитель подтвердил предложение и начал исполнение заказа.
                // Approved = 4,
                case 4:
                    _approved();
                    break;

                    /// Водитель отклонил предложение.
                    //  Declined = 5,
                case 5:
                    _declined();
                    break;

                    /// Диспетчер отклонил предложение, потому что Водитель был выбран другим Пассажиром.
                    //  Overdue = 6,
                case 6:
                    _expired();
                    break;

                default:
                    break;

            }
        }

        function orderStateChanged(data) {

            if (systemConfig.debugMode) {
                console.log("Получен OrderId: ");
                console.log(data);
            }
            if (data.OrderId == $scope.currentSuggestionId) {
                notificationService.hideLoadinScreen();

                /*
                 *   /// <summary>
    /// Поиск предложений по заказу.
    /// </summary>
    Searching = 1,

    /// <summary>
    /// Доезд. Водитель принял заказ и поехал на адрес.
    /// </summary>
    Arrival = 10,

    /// <summary>
    /// Ожидание. Водитель на адресе ждет выхода пассажира.
    /// </summary>
    Waiting = 20,

    /// <summary>
    /// Исполнение. Водитель везет пассажира.
    /// </summary>
    Executing = 30,

    /// <summary>
    /// Исполнен. Водитель довез пассажира.
    /// </summary>
    Finished = 40,

    /// <summary>
    /// Закрыт. Пассажир расплатился с водителем.
    /// </summary>
    Closed = 50,
                 * 
                 */

                /* switch (data.Result.Id) {
                     case 10:
                         _approved();
                         break;
                     default:
                         break;
                 }*/

                if (data.Result.Id >= 10)
                    _approved();
            }
        }

        function _suggestionHubStop() {
            if ($scope.connection) {
                if (systemConfig.debugMode) {
                    console.log('Now will be disconnect, connection ID=' + $scope.connection.id);
                }
                $scope.connection.stop();
                if (systemConfig.debugMode) {
                    console.log('Now disconnected, connection ID=' + $scope.connection.id);
                }
            }
        }

        /*suggestionHub methods end*/

        function _setFakeModelValues() {
            var d = new Date();
            $scope.order.date = d.toLocaleString();
            $scope.order.phone = '9057408137';
            $scope.order.passengerName = 'Sid';
            $scope.order.startAdress = 'Москва, проспект Вернадского, 29';
            $scope.order.finishAdress = 'Москва, улица Лобачевского, 11';
        }

        function _updateOffersGrid() {
            var timerId = setInterval(function () {
                var action = "searches/";
                apiService.post(serviceBase + action + $scope.order.searchSessionId, null, function (result) {
                    $scope.offersData = result.data.toAdd;
                    console.log(result);
                });
            }, 10000);
        }

        function _startCheckOrderTimer(suggestionId, seconds) {
            checkOrderTimer = $interval(function () {

                apiService.get(serviceBase + "searches/suggestion-id/" + suggestionId, { ignoreLoadingBar: true }, function (result) {
                    console.log(result);

                    var stateId = result.data.stateId;

                    suggestionStateSelect(stateId);

                    notificationService.hideLoadinScreen();

                    _stopCheckOrderTimer();
                });

            }, seconds * 1000);

            console.log("Timer has started");

        }

        function _stopCheckOrderTimer() {
            if (angular.isDefined(checkOrderTimer)) {
                $interval.cancel(checkOrderTimer);
                checkOrderTimer = undefined;
            }
        }

        // getCurrentOrder();

        //todo: временно убрал получение текущей локации
        // loadCurrentLocation();

        $scope.$on("$destroy", function () {
            _suggestionHubStop();
            _stopCheckOrderTimer();
        });

    };

})(angular.module('webPassenger'));