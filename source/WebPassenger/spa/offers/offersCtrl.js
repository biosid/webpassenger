(function (app) {
    'use strict';

    app.controller('offersCtrl', offersCtrl);
    // ordersCtrl.$inject = ["kendo.directives"];

    function offersCtrl($scope) {

        $scope.mainGridOptions = {
            dataSource: {
                type: "odata",
                transport: {
                    read: "http://demos.telerik.com/kendo-ui/service/Northwind.svc/Employees"
                },
                pageSize: 5,
                serverPaging: true,
                serverSorting: true
            },
            sortable: true,
            pageable: true,
            columns: [
                {
                    field: "FirstName",
                    title: "First Name",

                }, {
                    field: "LastName",
                    title: "Last Name"

                }, {
                    field: "Country"

                }, {
                    field: "City"
                }
            ]
        };
    };


})(angular.module('webPassenger'));