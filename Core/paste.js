/**
* Paste.js - paste and share documents with links
* Version 1.0.2 beta
*/
var myApp = angular.module('Paste.js', []);
myApp.controller('ServiceController', function ($scope, $http) {
    //Program Constants
    $scope.APP = {
        NAME: "Paste.js",
        VERSION: "1.0.3 beta"
    };
    //Document properties
    $scope.DocumentMeta = {
        isSaved: false,
        isReadOnly: false,
        Title: "unnamed document",
        Content: "Welcome to " + $scope.APP.NAME + "."
    };
    //Globals
    $scope.isBoxOpen = false;
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
    $scope.refreshTitle = function (newname) {
        $scope.DocumentMeta.Title = newname;
    }
    $scope.showOrHideDownloadBox = function () {
        if ($scope.DocumentMeta.isSaved === false && $scope.DocumentMeta.isReadOnly === false) {
            console.log("store isn't saved");
            if (!$scope.storePad()) {
                jQuery("#errorBox").fadeIn(1400, function () {
                    jQuery("#errorBox").delay(4000);
                    jQuery("#errorBox").fadeOut(1400);
                });
                return;
            }
        }
        if ($scope.isBoxOpen) {
            jQuery("#downloadBox").fadeOut();
            $scope.isBoxOpen = false;
        }
        else {
            jQuery("#downloadBox").fadeIn();
            $scope.isBoxOpen = true;
        }
    }
    $scope.hideDownloadBox = function () {
        jQuery("#downloadBox").fadeOut();
        jQuery("#InfoBox").fadeOut();
        jQuery("#StatusBox").fadeOut();
        $scope.isBoxOpen = false;
        $scope.hideStatus();
    }
    $scope.storePad = function () {
        var stored = $scope.savePad();
        console.log(stored);
        if (stored.length != 0) {
            if ($scope.EditMode === false && $scope.isReadOnly === true) {
                $scope.DocumentMeta.Guid = stored[0];
                $scope.DocumentMeta.PrivateGuid = stored[0];
            }
            else if ($scope.EditMode) {
                $scope.DocumentMeta.Guid = stored[0];
                $scope.DocumentMeta.PrivateGuid = stored[1];
            }
            else {
                $scope.DocumentMeta.Guid = stored[0];
                $scope.DocumentMeta.PrivateGuid = stored[1];
            }
            return true;
        }
        return false;
    }
    $scope.savePad = function () {
        var results = [];
        $scope.DocumentMeta.CreationDate = new Date();
        if ($scope.EditMode === false && (!$scope.DocumentMeta.Guid || !$scope.DocumentMeta.PrivateGuid)) {
            jQuery.ajax({
                global: false,
                async: false,
                type: "POST",
                cache: false,
                dataType: "json",
                data: ({
                    action: 'read',
                    content: $scope.DocumentMeta.Content,
                    date: $scope.DocumentMeta.CreationDate.toISOString().slice(0, 19).replace('T', ' '),
                }),
                url: $scope.datalayer + $scope.taskParam.savePad,
                success: function (data) {
                    results = data;
                },
                error: function (data) {
                    results = [];
                    $scope.DocumentMeta.ErrorMessage = data.responseText;
                }
            });
            $scope.showStatus("Pad saved " + $scope.DocumentMeta.CreationDate.toISOString());
        }
        else {
            jQuery.ajax({
                global: false,
                async: false,
                type: "POST",
                cache: false,
                dataType: "json",
                data: ({
                    action: 'read',
                    content: $scope.DocumentMeta.Content,
                    PrivateGuid: $scope.DocumentMeta.PrivateGuid,
                    date: $scope.DocumentMeta.CreationDate.toISOString().slice(0, 19).replace('T', ' '),
                }),
                url: $scope.datalayer + $scope.taskParam.updatePad,
                success: function (data) {
                    results = data;
                },
                error: function (data) {
                    results = [];
                    $scope.DocumentMeta.ErrorMessage = data.responseText;
                }
            });
            $scope.showStatus("Pad updated " + $scope.DocumentMeta.CreationDate.toISOString());
        }
        return results;
    }
    $scope.setTitle = function () {
        if ($scope.DocumentMeta.Content === null) {
            $scope.DocumentMeta.ErrorMessage = "The pad is not existing";
            jQuery("#errorBox").fadeIn(1400, function () {
            });
            return;
        }
        var title = $scope.DocumentMeta.Content.substring(0, 8);
        $scope.refreshTitle(title);
    }
    $scope.showStatus = function (text) {
        $scope.StatusText = text;
        jQuery("#statusText").fadeIn(400);
    }
    $scope.hideStatus = function () {
        jQuery("#statusText").fadeOut(400);
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
                pad: pad,
            }),
            url: $scope.datalayer + $scope.taskParam.openPad,
            success: function (data) {
                $scope.DocumentMeta.Content = data;
                if (pad != "start") {
                    if (edit == false) {
                        $scope.DocumentMeta.isReadOnly = true;
                        $scope.DocumentMeta.isSaved = true;
                        $scope.DocumentMeta.Guid = pad;
                        $scope.DocumentMeta.PrivateGuid = null;
                        $scope.EditMode = false;
                    }
                    else {
                        $scope.DocumentMeta.PrivateGuid = pad;
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
                jQuery("#errorBox").fadeIn(1400, function () {
                    jQuery("#errorBox").delay(4000);
                    jQuery("#errorBox").fadeOut(1400);
                });
                return [];
            }
        });
    }
    $scope.showOrHideInfoBox = function () {
        if (jQuery("#InfoBox").css("display") != "none") {
            jQuery("#InfoBox").fadeOut();
        }
        else {
            jQuery("#InfoBox").fadeIn();
        }
    }
    $scope.showOrHideStatsBox = function () {
        $scope.getStats();
        if (jQuery("#StatusBox").css("display") != "none") {
            jQuery("#StatusBox").fadeOut();
        }
        else {
            jQuery("#StatusBox").fadeIn();
        }
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
    $scope.getTicks = function () {
        $http.get($scope.datalayer + $scope.taskParam.getTicks).success(function (data) {
            return data;
        }).error(function () {
            return [];
        });
    }
});

/*
 * Adapted from: http://code.google.com/p/gaequery/source/browse/trunk/src/static/scripts/jquery.autogrow-textarea.js
 *
 * Works nicely with the following styles:
 * textarea {
 *	resize: none;
 *  word-wrap: break-word;
 *	transition: 0.05s;
 *	-moz-transition: 0.05s;
 *	-webkit-transition: 0.05s;
 *	-o-transition: 0.05s;
 * }
 *
 * Usage: <textarea auto-grow></textarea>
 */
myApp.directive('autoGrow', function() {
    return function(scope, element, attr){
        var minHeight = element[0].offsetHeight,
			paddingLeft = element.css('paddingLeft'),
			paddingRight = element.css('paddingRight');
 
        var $shadow = angular.element('<div></div>').css({
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: element[0].offsetWidth - parseInt(paddingLeft || 0) - parseInt(paddingRight || 0),
            fontSize: element.css('fontSize'),
            fontFamily: element.css('fontFamily'),
            lineHeight: element.css('lineHeight'),
            padding: '10px',
            resize: 'none'
        });
        angular.element(document.body).append($shadow);
 
        var update = function() {
            var times = function(string, number) {
                for (var i = 0, r = ''; i < number; i++) {
                    r += string;
                }
                return r;
            }
 
            var val = element.val().replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/&/g, '&amp;')
				.replace(/\n$/, '<br/>&nbsp;')
				.replace(/\n/g, '<br/>')
				.replace(/\s{2,}/g, function(space) { return times('&nbsp;', space.length - 1) + ' ' });
            $shadow.html(val);
 
            element.css('height', Math.max($shadow[0].offsetHeight + 10 /* the "threshold" */, minHeight) + 'px');
        }
		
        if(attr.ngModel){
            scope.$watch(attr.ngModel, update);
        }
 
        element.bind('keyup', update);
        update();
    }
});