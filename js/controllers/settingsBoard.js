taskBoardControllers.controller('BoardSettingsCtrl',
['$scope', '$interval', 'BoardService',
function ($scope, $interval, BoardService) {
    var pendingResponse = false,
        retryCount = 3,
        loadBoards = function() {
            if (pendingResponse) {
                return;
            }

            pendingResponse = true;
            BoardService.getBoards()
            .success(function(data) {
                $scope.updateBoardsList(data.data);
                pendingResponse = false;
                retryCount = 3;
            }).error(function(data) {
                if (retryCount--) {
                    pendingResponse = false;
                    return;
                }

                $interval.cancel($scope.interval);
                $scope.$parent.loadingBoards = false;
            });
        };

    loadBoards();
    $scope.interval = $interval(loadBoards, 5000);
    $scope.$on('$destroy', function () { $interval.cancel($scope.interval); });

    $scope.userOptions = {
        tasksAt: [
            { id: 0, text: 'bottom of column'},
            { id: 1, text: 'top of column'}
        ],
        taskOrder: 0,
        showAnimations: true,
        showAssignee: true
    };

    $scope.boardSort = {
        options: [
            { sort: 'id', name: 'Creation Date' },
            { sort: 'name', name: 'Board Name' }
        ],
        sort: 'name'
    };

    $scope.boardFilter = {
        options: [
            { filter: 'all', name: 'All Boards' },
            { filter: 'active', name: 'Active' },
            { filter: 'inactive', name: 'Inactive' }
        ],
        filter: 'all',
        userFilter: null
    };

    $scope.boardsFilter = function(element) {
        switch ($scope.boardFilter.filter) {
            case 'all':
                return true;
            case 'active':
                return element.active === '1';
            case 'inactive':
                return element.active === '0';
        }
    };

    $scope.boardsUserFilter = function(element) {
        if (null === $scope.boardFilter.userFilter) {
            return true;
        }

        var retVal = false;

        element.sharedUser.forEach(function(user) {
            console.log(user.id === $scope.boardFilter.userFilter);
            if (user.id === $scope.boardFilter.userFilter) {
                retVal = true;
            }
        });

        return retVal;
    };

    $scope.toggleActiveState = function(boardId) {
        BoardService.toggleActiveState(boardId)
        .success(function(data) {
            $scope.alerts.showAlerts(data.alerts);
            $scope.boards = data.data;
        });
    };

    $scope.isDeleting = [];
    $scope.removeBoard = function(boardId) {
        noty({
            text: 'Deleting a board cannot be undone.<br>Continue?',
            layout: 'center',
            type: 'information',
            modal: true,
            buttons: [
                {
                    addClass: 'btn btn-default',
                    text: 'Ok',
                    onClick: function($noty) {
                        $noty.close();

                        $scope.boards.forEach(function(board) {
                            if (board.id === boardId) {
                                $scope.isDeleting[boardId] = true;
                            }
                        });

                        BoardService.removeBoard(boardId)
                        .success(function(data) {
                            $scope.alerts.showAlerts(data.alerts);
                            $scope.boards = data.data;
                            $scope.updateUsers(data.users);
                        });
                    }
                },
                {
                    addClass: 'btn btn-info',
                    text: 'Cancel',
                    onClick: function($noty) {
                        $noty.close();
                    }
                }
            ]
        });
    };

    // $scope.getUserName = function(userid,shareduser) {
    //     shareduser.forEach(function(user) {
    //         if(user.id == userid) return user.username;
    //     });
    //     return 'undefined';
    // }
    $scope.levelFilter = function(userid,boardid,permissions,level) {
        // console.log(userid);
        // console.log(permissions);

        for (i = 0, len = permissions.length; i < len; ++i) {
            check_userid = (userid == permissions[i].user_id);
            check_boardid = boardid === undefined ? true : (boardid == permissions[i].board_id);
            check_level = level === undefined ? true : (level <= permissions[i].level);

            if(check_userid && check_boardid && check_level)
                return true;
        }

        return false;
    }

    $scope.getHighestLevel = function(userid,boardid,permissions) {
        if(permissions === undefined) return 0;
        
        level = 0;
        for (i = 0, len = permissions.length; i < len; ++i) {
            check_userid = (userid == permissions[i].user_id);
            check_boardid = boardid === undefined ? true : (boardid == permissions[i].board_id);

            if(check_userid && check_boardid) {
                level = permissions[i].level > level ? permissions[i].level : level;
            }
        }
        // console.log(level);

        return level;
    }
}]);
