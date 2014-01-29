/**
* Paste.js - paste and share documents with links
* Version 1.0.2 beta
*/
var myApp = angular.module('Paste.js', [], function ($httpProvider) {
    // code from: http://victorblog.com/2012/12/20/make-angularjs-http-service-behave-like-jquery-ajax/
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function (data) {
        /**
         * The workhorse; converts an object to x-www-form-urlencoded serialization.
         * @param {Object} obj
         * @return {String}
         */
        var param = function (obj) {
            var query = '';
            var name, value, fullSubName, subName, subValue, innerObj, i;

            for (name in obj) {
                value = obj[name];

                if (value instanceof Array) {
                    for (i = 0; i < value.length; ++i) {
                        subValue = value[i];
                        fullSubName = name + '[' + i + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value instanceof Object) {
                    for (subName in value) {
                        subValue = value[subName];
                        fullSubName = name + '[' + subName + ']';
                        innerObj = {};
                        innerObj[fullSubName] = subValue;
                        query += param(innerObj) + '&';
                    }
                }
                else if (value !== undefined && value !== null) {
                    query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
                }
            }

            return query.length ? query.substr(0, query.length - 1) : query;
        };

        return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
});
myApp.controller('ServiceController', function ($scope, $http, debounce) {
    //Program Constants
    $scope.APP = {
        NAME: "Paste.js",
        VERSION: "1.1.0 beta"
    };
    //Document properties
    $scope.DocumentMeta = {
        isSaved: false,
        isReadOnly: false,
        Title: "unnamed document",
        Content: "Welcome to " + $scope.APP.NAME + "."
    };
    //Globals
    $scope.isSaving = false;
	$scope.textChanged = false;
    $scope.StatusText = "Idle";
    $scope.willDeletePad = false;
    $scope.PadDeletionDuration = 80;
    $scope.EditMode = false;
    //The datalayer. Can be changed if you have another datalayer.
    $scope.datalayer = "./Core/datalayer.php";
    $scope.taskParam = {
        savePad: "?task=0x1",
        updatePad: "?task=0x5",
        openPad: "?task=0x2",
        getTicks: "?task=0x4",
        getStats: "?task=0x3"
    };
    //Tooltips
    $scope.tooltip = {
        information: false,
        error: false,
        download: false,
        statistics: false
    };
    $scope.resetTooltips = function () {
        $scope.tooltip.information = false;
        $scope.tooltip.error = false;
        $scope.tooltip.download = false;
        $scope.tooltip.statistics = false;
    }
    $scope.showTooltip = function (name) {
        if (name) {
            $scope.resetTooltips();
            $scope.tooltip[name] = true;
        }
        var width = jQuery("div#parentNav").width();
        jQuery("#tooltip").css("width", width);
        jQuery("#tooltip").slideDown(300);
    };
    $scope.hideTooltip = function () {
        $scope.resetTooltips();
        jQuery("#tooltip").slideUp(300);
    };
    $scope.refreshTitle = function (newname) {
        $scope.DocumentMeta.Title = newname;
    };
    $scope.toggleDownloadBox = function () {
		$scope.save();
		if($scope.tooltip.download)
			$scope.hideTooltip();
		else
			$scope.showTooltip("download");
    }
    $scope.save = function () {
		if($scope.textChanged){
			if ($scope.DocumentMeta.isSaved === false) {
				$scope.savePad();
				console.log("saved");
			} else {
				$scope.updatePad();
				console.log("updated");
			}
		}
    };
    $scope.saveDebounced = debounce($scope.save, 2000, false);
    $scope.savePad = function () {
        $scope.isSaving = true;
        var data = {
            action: "read",
            content: $scope.DocumentMeta.Content,
            date: new Date().toISOString().slice(0, 19).replace("T", " "),
        };
        $http.post($scope.datalayer + $scope.taskParam.savePad, data)
            .success(function (data) {
                $scope.isSaving = false;
				$scope.textChanged = false;
                $scope.DocumentMeta.isSaved = true;
                $scope.DocumentMeta.ReadOnlyGuid = data[0];
                $scope.DocumentMeta.EditableGuid = data[1];
            }).error(function () {
                $scope.isSaving = false;
                alert("Error!");
            });
    };
    $scope.updatePad = function () {
        $scope.isSaving = true;
        var data = {
            action: "read",
            content: $scope.DocumentMeta.Content,
            PrivateGuid: $scope.DocumentMeta.EditableGuid,
            date: new Date().toISOString().slice(0, 19).replace("T", " ")
        };
        $http.post($scope.datalayer + $scope.taskParam.updatePad, data)
        .success(function (data) {
            $scope.isSaving = false;
			$scope.textChanged = false;
            $scope.DocumentMeta.ReadOnlyGuid = data[0]; //should be
            $scope.DocumentMeta.EditableGuid = data[1]; //unneccessary
        }).error(function () {
            $scope.isSaving = false;
        });
    };
    $scope.setTitle = function () {
        if ($scope.DocumentMeta.Content === null) {
            $scope.DocumentMeta.ErrorMessage = "The pad is not existing";
            $scope.showTooltip("error");
            return;
        }
        var title = $scope.DocumentMeta.Content.substring(0, 8);
        $scope.refreshTitle(title);
    }
    $scope.showStatus = function (text) {
        $scope.StatusText = text;
        $scope.showTooltip("status");
    }
    $scope.getUrlParameters = function () {
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            if (hash[0] === "pad") {
                $scope.openPad(hash[1], false);
                return;
            }
            if (hash[0] === "epad") {
                $scope.openPad(hash[1], true);
                return;
            }
        }
        $scope.openPad("start", false);
    }
    $scope.openPad = function (pad, edit) {
        $scope.DocumentMeta.CreationDate = new Date();
        jQuery.ajax({
            global: false,
            async: false,
            type: "POST",
            cache: false,
            dataType: "json",
            data: ({
                action: 'read',
                pad: pad
            }),
            url: $scope.datalayer + $scope.taskParam.openPad,
            success: function (data) {
                $scope.DocumentMeta.Content = data;
                if (pad != "start") {
                    if (edit == false) {
                        $scope.DocumentMeta.isReadOnly = true;
                        $scope.DocumentMeta.isSaved = true;
                        $scope.DocumentMeta.ReadOnlyGuid = pad;
                        $scope.DocumentMeta.EditableGuid = null;
                        $scope.EditMode = false;
                    }
                    else {
                        $scope.DocumentMeta.EditableGuid = pad;
                        $scope.EditMode = true;
                    }
                }
                else {
                    $scope.DocumentMeta.isSaved = false;
                }
                $scope.setTitle();
                return data;
            },
            error: function (data) {
                results = [];
        $scope.showTooltip("error");
                return [];
            }
        });
    }
    $scope.toggleInfoBox = function () {
        if(!$scope.tooltip.information)
            $scope.showTooltip("information");
        else
            $scope.hideTooltip();
    }
    $scope.toggleStatsBox = function () {
        $scope.getStats();
        if (!$scope.tooltip.statistics)
            $scope.showTooltip("statistics");
        else
            $scope.hideTooltip();
    }
    $scope.drawStats = function (s1) {
        var myvalues = s1;
        var config = {
            type: 'line',
            lineColor: '#057AAD',
            width: "200",
            height: "50"
        };
        jQuery('#stats').sparkline(myvalues, config);
    }
    $scope.getStats = function () {
        $http.get($scope.datalayer + $scope.taskParam.getStats).success(function (data) {
            $scope.drawStats(data);
        });
    }

    $scope.$watch("DocumentMeta.Content", function (newVal, oldVal) {
        if (oldVal !== newVal) {
			$scope.textChanged = true;
            $scope.saveDebounced();
        }
    });
});

//code from https://gist.github.com/adamalbrecht/7226278
myApp.factory("debounce", function ($timeout, $q) {
    return function (func, wait, immediate) {
        var timeout;
        var deferred = $q.defer();
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    deferred.resolve(func.apply(context, args));
                    deferred = $q.defer();
                }
            };
            var callNow = immediate && !timeout;
            if (timeout) {
                $timeout.cancel(timeout);
            }
            timeout = $timeout(later, wait);
            if (callNow) {
                deferred.resolve(func.apply(context, args));
                deferred = $q.defer();
            }
            return deferred.promise;
        };
    };
});

//code from http://code.google.com/p/gaequery/source/browse/trunk/src/static/scripts/jquery.autogrow-textarea.js
myApp.directive("autoGrow", function() {
    return function(scope, element, attr){
        var minHeight = element[0].offsetHeight,
			paddingLeft = element.css("paddingLeft"),
			paddingRight = element.css("paddingRight");
 
        var $shadow = angular.element("<div></div>").css({
            position: "absolute",
            top: -10000,
            left: -10000,
            width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
            fontSize: element.css("fontSize"),
            fontFamily: element.css("fontFamily"),
            lineHeight: element.css("lineHeight"),
            padding: "10px",
            resize: "none"
        });
        angular.element(document.body).append($shadow);
 
        var update = function() {
            var times = function(string, number) {
                for (var i = 0, r = ""; i < number; i++) {
                    r += string;
                }
                return r;
            }
 
            var val = element.val().replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/&/g, "&amp;")
				.replace(/\n$/, "<br/>&nbsp;")
				.replace(/\n/g, "<br/>")
				.replace(/\s{2,}/g, function(space) { return times("&nbsp;", space.length - 1) + " " });
            $shadow.html(val);
 
            element.css("height", Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + "px");
        }
		
        if(attr.ngModel){
            scope.$watch(attr.ngModel, update);
        }
 
        element.bind("keyup", update);
        update();
    }
});









