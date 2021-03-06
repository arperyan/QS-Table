define( [
    'qlik',
    './properties',
    './initialproperties',
    './defaults',    
    'jquery', 
    'text!./template.html',
    'angular',
    'qvangular'
    ],
    function (qlik, props, initProps, defaults, $, htmlTemplate, angular, qvangular) {
        'use strict';
        var _app = qlik.currApp();
        var popUpSvc = qvangular.getService('qvListboxPopoverService');

        return {
            definition: props,
            initialProperties: initProps,
            support: {snapshot: true},
            template: htmlTemplate,
            resize: function($element, layout) {
                this.$scope.$parent.component.resizeTable(this.$scope.vm);
            },
            resizeTable: function(vm) {
                var qId = vm.qInfo.qId;
                var table = $('#ccTable_' + qId);
                var head = $('#ccTableHead_' + qId);
                var body = $('#ccTableBody_'  + qId);
                var headHeight = head.length > 0 ? head[0].clientHeight : 40;
                
                if (vm.props.totals.showTotals && vm.props.totals.position === 'bottom') {
                    var foot = $('#ccTableFoot_' + qId);
                    var headHeight = headHeight + (foot.length > 0 ? foot[0].clientHeight : 0);
                }

                var scrollWidth = (body[0].offsetWidth - body[0].clientWidth) < 0 ? 0 : body[0].offsetWidth - body[0].clientWidth;

                if (table.length > 0) {
                    vm.virtualScroll.sbHeight = table[0].parentElement.clientHeight - headHeight - scrollWidth - 8;
                    var h = (vm.virtualScroll.sbHeight) + 'px'; // -8 to allow for horizontal scroll bar
                    if (h == '0px') {
                        body.css('height', '100%');
                        vm.virtualScroll.sbHeightpx = '100%';
                        vm.virtualScroll.sbHeight = '100';
                    } else {        
                        body.css('height', h);
                        vm.virtualScroll.sbHeightpx = h;
                    }

                    vm.virtualScroll.sbToppx = headHeight + 'px';
                    vm.virtualScroll.sbThumbHpx = '20px';
                    vm.virtualScroll.sbThumbH = 20;
                }

                if (head.length > 0) {
                    var scrollWidth = body[0].offsetWidth - body[0].clientWidth;

                    if (body[0].scrollHeight <= body[0].clientHeight || scrollWidth < 0) {
                        head.css('width', '100%');
                    } else {
                        head.css('width', 'calc(100% - ' + Math.max(0, scrollWidth) + 'px)');
                    }
                }

                var tableId = '#ccTable_' + vm.qInfo.qId;
                var top    = $(tableId + ' tbody').offset().top,
                    height = $(tableId + ' tbody').height();

                var visible = $(tableId + ' tbody tr').filter(function() {
                    var elTop    = $(this).offset().top,
                        elHeight = $(this).height();

                    var ret = (elTop >= top) && ((elTop + elHeight) < (top + height));
                    // if (ret) {
                    //     logToConsole('filteredRow', this);
                    //     logToConsole('elTop', elTop);
                    //     logToConsole('elHeight', elHeight);
                    // }
                    return ret;
                });
                
                vm.virtualScroll.rowsVisibleCount = visible.length;
                vm.virtualScroll.showScroll = vm.virtualScroll.rowsVisibleCount < vm.qHyperCube.qSize.qcy;
                //logToConsole('resize: vm.virtualScroll', vm.virtualScroll);
            },
            controller: ['$scope', '$element', function ( $scope, $element ) {
                var isLogToConsole= false;
                var currentLayout = {};
                var qId = $scope.layout.qInfo.qId;
                $scope.qProductVersion = ''
                $scope.columnHeaders = [];
                $scope.totalsRow = [];
                $scope.columnOrder = [];

                function logToConsole(txt, object) {
                  if (!isLogToConsole) { return };
                  if (!object) {
                    console.log(qId + ':' + txt)
                  } else {
                    console.log(qId + ':' + txt, object)
                  }
                }
                
                qlik.getGlobal({}).getProductVersion(function(reply) {
                    logToConsole('getProductVersion: reply', reply)
                    $scope.qProductVersion = reply.qReturn;
                })

                $scope.orderByColumn = function (hdr) {
                    return $scope.columnOrder.indexOf(parseInt(hdr.originalIndex, 10));
                }                
                
                $scope.component.model.Validated.bind(function() {
                    refresh();
                });

                $scope.scrollMouseDown = function($event, isThumb) {
                    // logToConsole('scrollMouseDown', 'page: ' + $event.pageX + ' ' + $event.pageY + ' | offset: ' + $event.offsetX + ' ' + $event.offsetY);
                    //logToConsole('scrollMouseDown', $event);

                    if ($event.buttons != 1) {
                        $scope.tableMouseDown = false;
                        return;
                    }

                    $event.preventDefault();

                    if (!isThumb) {
                        $scope.tableMouseDown = false;
                        setScrollBarTop($event.offsetY, false, false, false);
                    } else {
                        $scope.tableMouseDown = true;
                    }
                }

                $scope.scrollMouseUp = function($event) {
                    // logToConsole('scrollMouseUp', 'page: ' + $event.pageX + ' ' + $event.pageY + ' | offset: ' + $event.offsetX + ' ' + $event.offsetY);
                    // logToConsole('scrollMouseUp', $event);
                    if ($event.buttons == 1) {
                        $event.preventDefault();
                        $scope.tableMouseDown = false;
                    }
                }

                $scope.scrollMouseMove = function($event) {
                    // check button is stil down
                    if ($event.buttons != 1) {
                        $scope.tableMouseDown = false;
                        return;
                    }

                    if ($scope.tableMouseDown) {
                        // logToConsole('scrollMouseMove', 'page: ' + $event.pageX + ' ' + $event.pageY + ' | offset: ' + $event.offsetX + ' ' + $event.offsetY);
                        // logToConsole('scrollMouseMove', $event);
                        setScrollBarTop($event.offsetY, true, false, false);
                    }
                }

                function onTableWheel($event) {
                    setScrollBarTop(0, false, true, $event.deltaY > 0);
                    $scope.$apply();
                }                

                function setScrollBarTop(y, isMoveHere, isMouseWheel, isForward) {
                    // var yPosition = Math.max(0, Math.min($scope.vm.virtualScroll.sbHeightNum - $scope.vm.virtualScroll.sbThumbHNum, y));
                    var scrollBarThumbTop = 0;
                    var pageRowCount = $scope.vm.virtualScroll.rowsVisibleCount;
                    var allRowsCount = $scope.vm.qHyperCube.qSize.qcy;

                    if (!isMouseWheel) {
                        $scope.vm.virtualScroll.isForwardScroll = y > $scope.vm.virtualScroll.sbThumbY;
                    } else {
                        $scope.vm.virtualScroll.isForwardScroll = isForward;
                    }

                    if ($scope.vm.virtualScroll.isForwardScroll) {
                        $scope.vm.virtualScroll.forwardCount++;
                        $scope.vm.virtualScroll.reverseCount = 0;
                    } else {
                        $scope.vm.virtualScroll.reverseCount++;
                        $scope.vm.virtualScroll.forwardCount = 0;
                    }

                    if (isMoveHere) {
                        $scope.vm.virtualScroll.sbThumbY = y;
                        var rowIndex = Math.floor(y / $scope.vm.virtualScroll.sbHeight * $scope.layout.qHyperCube.qSize.qcy);
                        $scope.vm.virtualScroll.rowIndex = rowIndex;
                    } else {
                        if ($scope.vm.virtualScroll.isForwardScroll) {
                            $scope.vm.virtualScroll.sbThumbY += pageRowCount;
                            $scope.vm.virtualScroll.rowIndex += pageRowCount;
                        } else {
                            $scope.vm.virtualScroll.sbThumbY -= (2 * pageRowCount);
                            $scope.vm.virtualScroll.rowIndex -= (2 * pageRowCount);
                        }

                        if ($scope.vm.virtualScroll.sbThumbY < 0 ) {$scope.vm.virtualScroll.sbThumbY = 0};
                        if ($scope.vm.virtualScroll.rowIndex < 0 ) {$scope.vm.virtualScroll.rowIndex = 0};
                    }

                    // scrollBarThumbTop = Math.max(0, Math.min($scope.vm.virtualScroll.sbHeight - $scope.vm.virtualScroll.sbThumbH, $scope.vm.virtualScroll.sbThumbY));
                    scrollBarThumbTop = $scope.vm.virtualScroll.rowIndex / allRowsCount * ($scope.vm.virtualScroll.sbHeight - $scope.vm.virtualScroll.sbThumbH);
                    scrollBarThumbTop = Math.max(0, Math.min(scrollBarThumbTop, ($scope.vm.virtualScroll.sbHeight - $scope.vm.virtualScroll.sbThumbH)));
                    $scope.vm.virtualScroll.sbThumbY = scrollBarThumbTop;
                    $scope.vm.virtualScroll.sbThumbYpx = scrollBarThumbTop + 'px';

                    //logToConsole('setScrollBarTop: $scope.vm.virtualScroll', $scope.vm.virtualScroll);

                    updateLayout();
                }                

                $scope.searchHeader = function($event, header) {
                    if ($event.button != 0) {return; };
                    $event.preventDefault();
                    if (!header.qDimensionType) {return; };

                    var searchFieldName = header.qFallbackTitle;

                    for (var i = 0; i < header.qGroupFallbackTitles.length; i++) {
                        if (header.qGroupFallbackTitles[i] = searchFieldName) {
                            searchFieldName = header.qGroupFieldDefs[i]
                            break;
                        }
                    }

                    logToConsole('_app', _app);

                    if ($scope.currentHeaderSearch == searchFieldName) {
                        $scope.currentHeaderSearch = null;
                        header.isSearchOpen = false;
                        popUpSvc.close();
                    } else {
                        $scope.currentHeaderSearch = searchFieldName;
                        header.isSearchOpen = true;

                        logToConsole('$event.target', $event.target);
                        logToConsole('$scope', $scope );

                        if ($scope.qProductVersion == '4.0.X') {
                            // HSBC qlik desktop
                            popUpSvc.showField(
                                $scope.currentHeaderSearch,
                                _app.model.enigmaModel,
                                {
                                    $alignToElement: [$event.target],
                                    collision: "flipfit",
                                    direction: 'ltr'
                                },
                                {}, 
                                function() {
                                    // callback when popup closing(/clicked outside?)
                                    // $scope.currentHeaderSearch = null
                                    header.isSearchOpen = false;
                                }
                            )
                        } else {
                            // HSBC server install
                            popUpSvc.showField(
                                $scope.currentHeaderSearch,
                                _app.model,
                                {
                                    $alignToElement: [$event.target],
                                    collision: "flipfit",
                                    direction: 'ltr'
                                },
                                null, 
                                function() {
                                    // callback when popup closing(/clicked outside?)
                                    // $scope.currentHeaderSearch = null
                                    header.isSearchOpen = false;
                                }
                            ) 
                        }
                    }
                    
                    $($event.target).toggleClass('columnSearchIconOpen');
                }

                $scope.headerClicked = function($event, header) {
                    $event.preventDefault();
                    if (header.isSearchOpen) {return;};
                    if ($event.target.hasAttribute('search-col')) {return;}

                    var index = header.originalIndex;

                    var qEffectiveInterColumnSortOrder = currentLayout.qHyperCube.qEffectiveInterColumnSortOrder;
                    var isReverseSort = (index === qEffectiveInterColumnSortOrder[0]);

                    if (isReverseSort) {
                        var qPath = '';
                        var qValue = '';

                        if (index < currentLayout.qHyperCube.qDimensionInfo.length) {
                            qPath = '/qHyperCubeDef/qDimensions/' + index + '/qDef/qReverseSort';
                            qValue = JSON.stringify(!currentLayout.qHyperCube.qDimensionInfo[index].qReverseSort);
                        } else {
                            var measureIndex = index - currentLayout.qHyperCube.qDimensionInfo.length;

                            qPath = '/qHyperCubeDef/qMeasures/' + measureIndex + '/qDef/qReverseSort';
                            qValue = JSON.stringify(!currentLayout.qHyperCube.qMeasureInfo[measureIndex].qReverseSort);
                        }

                        $scope.backendApi.applyPatches([
                            {
                                'qPath': qPath,
                                'qOp': 'replace',
                                'qValue': qValue
                            }
                        ], false).then(function(){

                        });
                    } else {
                        // remove this index from the array
                        qEffectiveInterColumnSortOrder.splice(qEffectiveInterColumnSortOrder.indexOf(index), 1 ); 
                        // insert this index at the beginning of the array
                        qEffectiveInterColumnSortOrder.unshift(index);

                        $scope.backendApi.applyPatches([
                            {
                                'qPath': '/qHyperCubeDef/qInterColumnSortOrder',
                                'qOp': 'replace',
                                'qValue': JSON.stringify(qEffectiveInterColumnSortOrder)
                            }                          
                        ], false).then(function(){

                        });

                        // {
                        //     'qOp': 'replace',
                        //     'qPath': '/qHyperCubeDef/qDimensions/0/qDef/qSortCriterias/0/qSortByAscii',
                        // /qHyperCubeDef/qMeasures/1/qSortBy/qSortByNumeric
                        //     'qValue': '-1'
                        // }
                    }
                }

                $scope.getRowTrackBy = function(row) {
                    var ret = '';
                    // for (var i = 0; i < currentLayout.qHyperCube.qDimensionInfo.length; i++) {
                    //     ret += row[i].qElemNumber + '|';
                    // }
                    for (var i = 0; i < row.length; i++) {
                        ret += row[i].qElemNumber + '|';
                    }                    

                    return ret;
                }

                $scope.showTotalRow = function(position) {
                    return currentLayout.props.totals.showTotals && (currentLayout.props.totals.position === position);
                }

                $scope.totalsRowStyle = function() {
                    var ret = {};

                    if (currentLayout.props.totals.totalsBackgroundColor) {
                        ret['background-color'] = currentLayout.props.totals.totalsBackgroundColor;
                    }  

                    if (currentLayout.props.totals.totalsTextColor) {
                        ret['color'] = currentLayout.props.totals.totalsTextColor;
                    }              

                    return ret;     
                }

                // need to work on useHTML !!!!
                $scope.getText = function(col, index) {
                    var dimCount = currentLayout.dimCount; //  currentLayout.qHyperCube.qDimensionInfo.length;
                    var qMeasure = currentLayout.qHyperCube.qMeasureInfo[index - dimCount];

                    if (index >= dimCount) {
                        if (qMeasure.useHTML) {
                            return col.qText;
                        }
                    }
 
                    return col.qText;
                }

                $scope.showHeaderColumn = function(header) {
                    return (showHeaderColumnObject(header));
                }

                $scope.showDimensionColumn = function(measure) {
                    return (showDimensionColumnObject(measure));
                }

                $scope.showMeasureColumn = function(measure) {
                    return (showMeasureColumnObject(measure));
                }

                // local
                function showHeaderColumnObject(header) {
                    return (!header.showMeasure || (header.showMeasure && header.qShowHide != '0'));
                }  
                
                // function showDimensionColumnIdx(index) {
                //     var qDimension = currentLayout.qHyperCube.qDimensionInfo[index];
                //     return (showDimensionColumnObject(qDimension));
                // }  

                // function showDimensionColumnObject(dimension) {
                //     return (!dimension.showMeasure || (dimension.showMeasure && dimension.qShowHide != '0'));
                // }  

                // function showMeasureColumnIdx(index) {
                //     var qMeasure = currentLayout.qHyperCube.qMeasureInfo[index];
                //     return (showMeasureColumnObject(qMeasure));
                // }  

                // function showMeasureColumnObject(measure) {
                //     return (!measure.showMeasure || (measure.showMeasure && measure.qShowHide != '0'));
                // }  

                $scope.showDataColumn = function(index) {
                    var dimCount = currentLayout.dimCount; // currentLayout.qHyperCube.qDimensionInfo.length;
                    if (index < dimCount) { 
                        return showDimensionColumnIdx(index);
                    }

                    var measureIndex = index - dimCount;
                    return showMeasureColumnIdx(measureIndex);
                }   

                // $scope.showDimColumnByIndex = function(index) {
                //     return (showDimensionColumnIdx(index));
                // }  

                // $scope.showMeaColumnByIndex = function(index) {
                //     return (showMeasureColumnIdx(index));
                // }                 

                // $scope.showMeasureTotalValue = function(index) {
                //     var qMeasure = currentLayout.qHyperCube.qMeasureInfo[index];
                //     return (qMeasure.Showtotal == undefined ? true : qMeasure.Showtotal);
                // }                                  

                $scope.showMeasureTotalValue = function(obj) {
                    // var qMeasure = currentLayout.qHyperCube.qMeasureInfo[index];
                    return (obj.Showtotal == undefined ? true : obj.Showtotal);
                }

                $scope.headerCellStyle = function(obj) {
                    var ret = {};

                    if (obj.adjustColumnWidth && obj.columnWidth) {
                        ret['width'] = obj.columnWidth + 'px';
                        ret['max-width'] = obj.columnWidth + 'px';
                    } else {
                        // get defaults - not coded for calculated widths yet
                        ret['width'] = obj.columnWidth + 'px';
                        ret['max-width'] = obj.columnWidth + 'px';                        
                    }

                    if (currentLayout.props.header.fontBold) {
                        ret['font-weight'] = 'bold';
                    } else {
                        ret['font-weight'] = 'normal';
                    }

                    if (currentLayout.props.header.fontItalic) {
                        ret['font-style'] = 'italic';
                    } else {
                        ret['font-style'] = 'normal';
                    }  

                    if (currentLayout.props.header.textUnderlined) {
                        ret['text-decoration'] = 'underline';
                    } else {
                        ret['text-decoration'] = 'none';
                    }

                    if (obj.titleTextAlignment) {
                        ret['text-align'] = obj.titleTextAlignment;
                    }

                    return ret;
                }

                $scope.measureCellStyle = function(index) {
                    return getCellStyle(currentLayout.qHyperCube.qMeasureInfo[index], true, null);
                }                           

                function setRowStyle(row) {
                    if (currentLayout.props.rows.rowsBackgroundColor) {
                        row.style['backgroundColor'] = currentLayout.props.rows.rowsBackgroundColor;
                    }

                    if (currentLayout.props.rows.fontColour) {
                        row.style['color'] = currentLayout.props.rows.fontColour;
                    }                        

                    if (currentLayout.props.rows.fontBold) {
                        row.style['fontWeight'] = 'bold';
                    }

                    if (currentLayout.props.rows.fontItalic) {
                        row.style['fontStyle'] = 'italic';
                    }  

                    if (currentLayout.props.rows.textUnderlined) {
                        row.style['textDecoration'] = 'underline';
                    }       

                    // if (currentLayout.props.rows.textalignment) {
                    //     row.style['textAlign'] = currentLayout.props.rows.textalignment;
                    // }                                       

                    if (currentLayout.props.rows.showBorder) {
                        row.style['borderBottom'] = '1px #f2f2f2 solid';
                    }

                    if (!row.style['textAlign']) {row.style['textAlign'] = 'left';};
                    if (!row.style['color']) {row.style['color'] = 'inherit'};
                    if (!row.style['backgroundColor']) {row.style['backgroundColor'] = 'inherit'};    
                    if (!row.style['fontWeight']) {row.style['fontWeight'] = 'normal';};
                    if (!row.style['textDecoration']) {row.style['textDecoration'] = 'none'};
                    if (!row.style['borderBottom']) {row.style['borderBottom'] = 'none'};                     
                    if (!row.style['fontStyle']) {row.style['fontStyle'] = 'normal'};

                    row.style['showBorder'] = true;
                }

                function setUpCellStyles() {
                    var cellObject = {}, qMatrixRow = {};
                    var dimCount = currentLayout.qHyperCube.qDimensionInfo.length;
                    var measureMaxValue = 0;
                    var isShowValue = false;
                    var qMatrix = currentLayout.grid; // currentLayout.qHyperCube.qDataPages[0].qMatrix;
                    var measureIndex;
                    var meaCount = currentLayout.qHyperCube.qMeasureInfo.length;
                    var columnObject = {};
                    var qDimensionInfoArray = currentLayout.qHyperCube.qDimensionInfo;
                    var qMeasureInfoArray = currentLayout.qHyperCube.qMeasureInfo;

                    // for (var i = 0; i < qDimensionInfoArray.length; i++) {
                    //     columnObject = qDimensionInfoArray[i];
                    //     if (columnObject.isSearchable == undefined) {
                    //         columnObject.isSearchable = currentLayout.qDef.isSearchable;
                    //     }

                    //     columnObject.headerText = (columnObject.customLabel != '' && columnObject.customLabel != undefined) ? columnObject.customLabel : columnObject.qFallbackTitle;
                    // }

                    // for (var i = 0; i < qMeasureInfoArray.length; i++) {
                    //     columnObject = qMeasureInfoArray[i];
                    //     columnObject.headerText = (columnObject.customLabel != '' && columnObject.customLabel != undefined) ? columnObject.customLabel : columnObject.qFallbackTitle;
                    // }                    

                    for (var i = 0; i < $scope.columnHeaders.length; i++) {
                        columnObject = $scope.columnHeaders[i];
                        if (columnObject.isSearchable == undefined && columnObject.qDimensionType) {
                            columnObject.isSearchable = currentLayout.qDef.isSearchable;
                        }

                        columnObject.headerText = (columnObject.customLabel != '' && columnObject.customLabel != undefined) ? columnObject.customLabel : columnObject.qFallbackTitle;
                    }

                    columnObject = {};
                    for (var i = 0; i < qMatrix.length; i++) {
                        qMatrixRow = qMatrix[i];
                        qMatrixRow.style = {};
                        setRowStyle(qMatrixRow);

                        for (var j = 0; j < qMatrixRow.length; j++) {
                            measureIndex = j - dimCount;

                            cellObject = qMatrixRow[j];
                            // columnObject = j < dimCount ? qDimensionInfoArray[j] : qMeasureInfoArray[measureIndex];
                            columnObject = $scope.columnHeaders[j];
                            cellObject.style = {};
                            cellObject.pbStyle = {};

                            cellObject.originalIndex = columnObject.originalIndex;
                            cellObject.style['selectable'] = columnObject.qDimensionType ? columnObject.qDimensionType == 'D' : false;
                            cellObject.style['showColumn'] = (!columnObject.showMeasure || (columnObject.showMeasure && columnObject.qShowHide != '0'));
                            cellObject.style['showBorder'] = j < dimCount ? qDimensionInfoArray[j].showBorder : qMeasureInfoArray[measureIndex].showBorder;
                            cellObject.style['cellRepresentation'] = columnObject.cellRepresentation === 'progressbar' ? 'pb' : 'txt';

                            // cellObject.style.isSelected = cellObject.qState == 'S' && currentLayout.qSelectionInfo.qInSelections;

                            if (columnObject.cellRepresentation === 'progressbar' && measureIndex >= 0) {
                                if (cellObject.qAttrExps) {
                                    if (cellObject.qAttrExps.qValues.length > 3) {
                                        if (cellObject.qAttrExps.qValues[3].qText && cellObject.qAttrExps.qValues[3].qText != '') {
                                            cellObject.pbStyle['backgroundColor'] = cellObject.qAttrExps.qValues[3].qText;
                                        }                            
                                    }
                                }

                                if (!cellObject.pbStyle['backgroundColor']){
                                    if (columnObject.progressBarColorPicker) {
                                        if (columnObject.progressBarColorPicker.color) {
                                            cellObject.pbStyle['backgroundColor'] = columnObject.progressBarColorPicker.color;
                                        }  
                                    } 
                                }

                                if (!cellObject.pbStyle['backgroundColor']){
                                    if (columnObject.progressBarColor) {
                                        if (columnObject.progressBarColor) {
                                            cellObject.pbStyle['backgroundColor'] = columnObject.progressBarColor;
                                        }  
                                    }
                                }

                                if (cellObject.qNum !== 'NaN' && columnObject.maxValue >= cellObject.qNum) {
                                    cellObject.pbStyle['width'] = (cellObject.qNum / columnObject.maxValue * 100).toFixed(0) + '%';
                                }
                            }

                            if (columnObject.adjustColumnWidth && columnObject.columnWidth) {
                                cellObject.style['width'] = columnObject.columnWidth + 'px';
                                cellObject.style['maxWidth'] = columnObject.columnWidth + 'px';
                            } else {
                                // get defaults - not coded for calculated widths yet
                                cellObject.style['width'] = columnObject.columnWidth + 'px';
                                cellObject.style['maxWidth'] = columnObject.columnWidth + 'px';                        
                            }

                            if (columnObject.textAlignment) {
                                cellObject.style['textAlign'] = columnObject.textAlignment;
                            } 

                            if (columnObject.textColorPicker) {
                                if (columnObject.textColorPicker.color) {
                                    cellObject.style['color'] = columnObject.textColorPicker.color;
                                }  
                            } 

                            if (columnObject.backgroundColorPicker) {
                                if (columnObject.backgroundColorPicker.color) {
                                    cellObject.style['backgroundColor'] = columnObject.backgroundColorPicker.color;
                                }
                            }

                            if (cellObject.qAttrExps) {
                                if (cellObject.qAttrExps.qValues.length > 0) {
                                    if (cellObject.qAttrExps.qValues[0].qText && cellObject.qAttrExps.qValues[0].qText != '') {
                                        cellObject.style['color'] = cellObject.qAttrExps.qValues[0].qText;
                                    }                            
                                }

                                if (cellObject.qAttrExps.qValues.length > 1) {
                                    if (cellObject.qAttrExps.qValues[1].qText && cellObject.qAttrExps.qValues[1].qText != '') {
                                        cellObject.style['backgroundColor'] = cellObject.qAttrExps.qValues[1].qText;
                                    }                            
                                }                            
                            }

                            if (!cellObject.style['textAlign']) {cellObject.style['textAlign'] = 'normal';};
                            if (!cellObject.style['color']) {cellObject.style['color'] = 'inherit'};
                            if (!cellObject.style['backgroundColor']) {cellObject.style['backgroundColor'] = 'inherit'};                
                        }
                    }
                }

                // slow
                function getCellStyle(columnObject, isForTotals, cellObject) {
                    var ret = {};

                    if (columnObject.adjustColumnWidth && columnObject.columnWidth) {
                        ret['width'] = columnObject.columnWidth + 'px';
                        ret['max-width'] = columnObject.columnWidth + 'px';
                    } else {
                        // get defaults - not coded for calculated widths yet
                        ret['width'] = columnObject.columnWidth + 'px';
                        ret['max-width'] = columnObject.columnWidth + 'px';                        
                    }

                    if (columnObject.textAlignment) {
                        ret['text-align'] = columnObject.textAlignment;
                    }
                    
                    if (!isForTotals) {
                        if (columnObject.textColorPicker) {
                            if (columnObject.textColorPicker.color) {
                                ret['color'] = columnObject.textColorPicker.color;
                            }  
                        } 

                        if (columnObject.backgroundColorPicker) {
                            if (columnObject.backgroundColorPicker.color) {
                                ret['background-color'] = columnObject.backgroundColorPicker.color;
                            }
                        }

                        if (cellObject.qAttrExps) {
                            if (cellObject.qAttrExps.qValues.length > 0) {
                                if (cellObject.qAttrExps.qValues[0].qText && cellObject.qAttrExps.qValues[0].qText != '') {
                                    ret['color'] = cellObject.qAttrExps.qValues[0].qText;
                                }                            
                            }

                            if (cellObject.qAttrExps.qValues.length > 1) {
                                if (cellObject.qAttrExps.qValues[1].qText && cellObject.qAttrExps.qValues[1].qText != '') {
                                    ret['background-color'] = cellObject.qAttrExps.qValues[1].qText;
                                }                            
                            }                            
                        }
                      
                    }

                    return ret;                    
                }

                $scope.headerStyle = function() {
                    var ret = {}
 
                    if (currentLayout.props.header.headerBackgroundColor) {
                        ret['background-color'] = currentLayout.props.header.headerBackgroundColor;
                    }

                    if (currentLayout.props.header.fontColor) {
                        ret['color'] = currentLayout.props.header.fontColor;
                    }

                    if (currentLayout.props.header.fontsize) {
                        ret['font-size'] = currentLayout.props.header.fontsize;
                    }

                    if (currentLayout.props.header.fontfamily) {
                        ret['font-family'] = currentLayout.props.header.fontfamily;
                    }                        

                    if (currentLayout.props.header.fontBold) {
                        ret['font-weight'] = 'bold';
                    } else {
                        ret['font-weight'] = 'normal';
                    }

                    if (currentLayout.props.header.fontItalic) {
                        ret['font-style'] = 'italic';
                    } else {
                        ret['font-style'] = 'normal';
                    }  

                    if (currentLayout.props.header.textUnderlined) {
                        ret['text-decoration'] = 'underline';
                    } else {
                        ret['text-decoration'] = 'none';
                    }                    

                    // if (currentLayout.props.header.textalignment) {
                    //     ret['text-align'] = currentLayout.props.header.textalignment;
                    // }                                                                             

                    return ret;
                }

                $scope.headerCellClass = function(obj) {
                    var ret = [];

                    if ((obj.showBorder == undefined && currentLayout.qDef.showBorder) || obj.showBorder) {
                        ret.push('cellBorderRight');
                    }

                    if (obj.hasSelections) {
                        ret.push('dimSelection');
                    }                    
                    return ret;                    
                }       

                $scope.meaCellClassByIndex = function(index) {
                    return measureCellClass(index);                    
                }

                function measureCellClass(index) {
                    return currentLayout.qHyperCube.qMeasureInfo[index].showBorder;
                }                                        

                $scope.cellClick = function(event, cell, row) {
                    // if ($scope.layout.props.standardSelect) {return;}

                    var evt = event;
                    evt.stopPropagation();
                    logToConsole('evt', evt);

                    var qElemNumber = cell.qElemNumber;

                    // if (evt.currentTarget.hasAttribute('data-value') && evt.currentTarget.hasAttribute('data-dimension')) {
                    if (qElemNumber >= 0) {
                        // var value = parseInt(evt.currentTarget.getAttribute('data-value'), 10);
                        // var dim = parseInt(evt.currentTarget.getAttribute('data-dimension'), 10);
                        var cellOriginalIndex = cell.originalIndex;
                        var isSelectedDimensionSelectable = false;
                        var isSelectable = false;

                        logToConsole('qElemNumber', qElemNumber);

                        // check whether dimension is clicked,and then see if it is selectable
                        if (cellOriginalIndex < currentLayout.qHyperCube.qDimensionInfo.length) {
                            isSelectedDimensionSelectable = currentLayout.qHyperCube.qDimensionInfo[cellOriginalIndex].isSelectable == undefined ? currentLayout.qDef.isSelectable : currentLayout.qHyperCube.qDimensionInfo[cellOriginalIndex].isSelectable;
                        }

                        if (!isSelectedDimensionSelectable || cellOriginalIndex > currentLayout.qHyperCube.qDimensionInfo.length) 
                        {
                            for (var i = 0; i < currentLayout.qHyperCube.qDimensionInfo.length; i++) {
                                isSelectable = currentLayout.qHyperCube.qDimensionInfo[i].isSelectable == undefined ? currentLayout.qDef.isSelectable : currentLayout.qHyperCube.qDimensionInfo[i].isSelectable;
                                qElemNumber = row[i].qElemNumber;
                                if (isSelectable && qElemNumber >= 0) {
                                    $scope.$parent.backendApi.selectValues(i, [qElemNumber], true);
                                }
                            }
                        } else {
                            $scope.$parent.backendApi.selectValues(cellOriginalIndex, [qElemNumber], true)
                        }
                    }
                }
                
                function waitForRender(callback) {
                    setTimeout(function(){
                        var t = $('#ccTable_' + currentLayout.qInfo.qId).get(0)
                        if (t == undefined) {
                            waitForRender(callback)
                        } else {
                            var position = t.getBoundingClientRect();

                            if (position.top && position.left) {
                                callback.call();
                            } else {
                                waitForRender(callback)
                            }
                        }
                    });
                }                

                function setupSortingDisplayFlags() {
                    var sortByIndex = 0;

                    if (currentLayout.qHyperCube.qEffectiveInterColumnSortOrder.length > 0) {
                        sortByIndex = currentLayout.qHyperCube.qEffectiveInterColumnSortOrder[0];
                    }

                    $scope.columnHeaders[sortByIndex].isOrderedBy = true;

                    // var dimCount = currentLayout.qHyperCube.qDimensionInfo.length;
                    // if (sortByIndex < dimCount) {
                    //     currentLayout.qHyperCube.qDimensionInfo[sortByIndex].isOrderedBy = true;
                    // } else {
                    //     currentLayout.qHyperCube.qMeasureInfo[sortByIndex - dimCount].isOrderedBy = true;
                    // }
                }

                function setupProgressBarData() {
                    // sort out progress bars, if any
                    var dataCell = {}, qMatrixRow = {};
                    var dimCount = currentLayout.qHyperCube.qDimensionInfo.length;
                    var measureMaxValue = 0;
                    var isShowValue = false;

                    // get max value per progressbar measure, for later calcs of bar widths....
                    var meaCount = currentLayout.qHyperCube.qMeasureInfo.length;

                    for (var i = 0; i < meaCount; i++) {
                        if (currentLayout.qHyperCube.qMeasureInfo[i].cellRepresentation == 'progressbar') {
                            isShowValue = currentLayout.qHyperCube.qMeasureInfo[i].progressBarShowValue;

                            for (var j = 0; j < $scope.vm.grid.length; j++) {
                                qMatrixRow = $scope.vm.grid[j];
                                dataCell = qMatrixRow[dimCount + i];
                                dataCell.progressBarDisplayValue = isShowValue ? dataCell.qText : '&nbsp;';
                                if (dataCell.qNum !== 'NaN' && measureMaxValue < dataCell.qNum) {
                                    measureMaxValue = dataCell.qNum;
                                }
                            }

                            currentLayout.qHyperCube.qMeasureInfo[i].maxValue = measureMaxValue;
                        }
                    }
                }

                // function selectionStateCallback(selectionState) {
                //     logToConsole('selectionState', selectionState);

                //     var fieldName = '', dimension = {}, fieldIndex = 0;

                //     for (var i = 0; i < selectionState.qSelectionObject.qSelections.length; i++) {
                //         fieldName = selectionState.qSelectionObject.qSelections[i].qField;

                //         for (var j = 0; j < currentLayout.qHyperCube.qDimensionInfo.length; j++) {
                //             dimension = currentLayout.qHyperCube.qDimensionInfo[j];

                //             if (dimension.qGroupFieldDefs.length > 0) {
                //                 fieldIndex = dimension.qGroupFieldDefs.length - 1;
                //                 if (dimension.qGroupFieldDefs[fieldIndex].replace('=[', '').replace(']','') == fieldName) {
                //                     dimension.hasSelections = true;
                //                 }
                //             }
                //         }                        
                //     }
                // }

                function checkForData() {
                    //var rowCount = currentLayout.qHyperCube.qDataPages[0].qMatrix.length;
                    
                    currentLayout.virtualScroll.rowIndex = currentLayout.virtualScroll.rowIndex < 0 ? 0 : currentLayout.virtualScroll.rowIndex;

                    var currentRowIndex = currentLayout.virtualScroll.rowIndex;
                    var qArea = currentLayout.virtualScroll.qArea;
                    var qSize = currentLayout.qHyperCube.qSize;

                    if ((currentRowIndex < qSize.qcy) && 
                            (qArea.qTop > currentRowIndex || 
                                currentRowIndex > (qArea.qTop + qArea.qHeight) || 
                                (qArea.qTop + qArea.qHeight) < (currentRowIndex + currentLayout.virtualScroll.rowsVisibleCount - 1))) {
                        // need a new data set
                        var requestPage = [{
                            qTop: currentRowIndex > (qSize.qcy - 150)  ? (qSize.qcy - 150) : currentRowIndex,
                            qLeft: 0,
                            qWidth: qSize.qcx,
                            qHeight: 150
                        }];

                        if (requestPage[0].qTop < 0) { return false;}

                        logToConsole('requestPage', requestPage);
                        $scope.backendApi.getData(requestPage).then(function (data) {
                            logToConsole('dataPages', data);
                            var dataPages = getDataPages(data);

                            // keep around 250 rows in cache, can we concatenate with current cache
                            if ((qArea.qTop + qArea.qHeight == dataPages[0].qArea.qTop) && qArea.qHeight <= 300) {
                                logToConsole('caching data');
                                currentLayout.qHyperCube.qDataPages[0].qMatrix = currentLayout.qHyperCube.qDataPages[0].qMatrix.concat(dataPages[0].qMatrix);

                                qArea.qHeight += dataPages[0].qArea.qHeight;
                                currentLayout.virtualScroll.qArea = qArea;
                                logToConsole('cached data', $scope.vm);
                            } else {
                                currentLayout.virtualScroll.qArea = dataPages[0].qArea;
                                currentLayout.qHyperCube.qDataPages[0].qMatrix = dataPages[0].qMatrix;
                            }

                            processNewDataSlice();
                        })

                        return false;
                    } 
                    
                    return true;
                }

                function getDataPages(data) {
                    logToConsole('getDataPages: product version: ', $scope.qProductVersion);
                    return data.qDataPages ? data.qDataPages : data; // handles different qlik versions...
                }

                function processNewDataSlice() {
                    var qArea = currentLayout.virtualScroll.qArea;
                    var qSize = currentLayout.qHyperCube.qSize;
                    var qMatrix = currentLayout.qHyperCube.qDataPages[0].qMatrix;
                    var rowsVisibleCount = currentLayout.virtualScroll.rowsVisibleCount;
                    var currentRowIndex = currentLayout.virtualScroll.rowIndex;

                    if (currentRowIndex > qSize.qcy) {
                        currentRowIndex = qSize.qcy;
                        currentLayout.virtualScroll.rowIndex = currentRowIndex;
                    }

                    var offsetIndex = currentRowIndex - qArea.qTop;
                    logToConsole('processNewDataSlice: offsetIndex:1', offsetIndex);
                    logToConsole('processNewDataSlice: currentLayout.virtualScroll', currentLayout.virtualScroll);

                    // make sure last slice gets moved up into visible rows
                    if (currentRowIndex > (qSize.qcy - rowsVisibleCount)) {
                        offsetIndex = qArea.qHeight - rowsVisibleCount;
                        logToConsole('processNewDataSlice: offsetIndex:2', offsetIndex);
                    }
                    currentLayout.grid = qMatrix.slice(offsetIndex, offsetIndex + Math.max(10, rowsVisibleCount) + 10);

                    setHeadersAndTotals();
                    setupProgressBarData();
                    setUpCellStyles();
                    setupSortingDisplayFlags();
                    setColumnOrder();

                    // logToConsole('processNewDataSlice: finish', currentLayout);
                    
                    $scope.vm = currentLayout;
                }

                function updateLayout() {
                    if (checkForData()){
                        processNewDataSlice();
                    }
                }

                function setColumnOrder() {
                    if ($scope.columnOrder.length != $scope.columnHeaders.length) {
                        $scope.columnOrder = [];
                        for (var i = 0; i < $scope.columnHeaders.length; i++) {
                            $scope.columnOrder.push(i);
                        }
                    }
                }

                function setHeadersAndTotals() {
                    $scope.totalsRow = [];
                    $scope.columnHeaders = [];

                    var currentObject;
                    var dimensionsCount = $scope.layout.qHyperCube.qDimensionInfo.length;

                    for (var i = 0; i < $scope.layout.qHyperCube.qDimensionInfo.length; i++) {
                        currentObject = $scope.layout.qHyperCube.qDimensionInfo[i];
                        currentObject.originalIndex = i;
                        $scope.columnHeaders.push(currentObject);    
                        $scope.totalsRow.push(currentObject);    
                    }

                    for (var i = 0; i < $scope.layout.qHyperCube.qMeasureInfo.length; i++) {
                        currentObject = $scope.layout.qHyperCube.qMeasureInfo[i];
                        currentObject.originalIndex = i + dimensionsCount;
                        $scope.columnHeaders.push(currentObject);
                    }

                    for (var i = 0; i < $scope.layout.qHyperCube.qGrandTotalRow.length; i++) {
                        $scope.totalsRow.push($scope.layout.qHyperCube.qGrandTotalRow[i]);    
                    }

                    for (var i = 0; i < $scope.totalsRow.length; i++) {
                        $scope.totalsRow[i].originalIndex = i;
                        $scope.totalsRow[i].style = {};
                        $scope.totalsRow[i].style.showColumn = showHeaderColumnObject($scope.columnHeaders[i]);
                        $scope.totalsRow[i].Showtotal = $scope.columnHeaders[i].Showtotal;
                    }
                }

                function refresh() {
                    isLogToConsole = $scope.layout.props.logToConsole;

                    logToConsole('refresh:$scope', $scope);
                    logToConsole('refresh: product version: ', $scope.qProductVersion);
                    var isRefresh = true;

                    // let's just make sure all our meta data is preserved..
                    //logToConsole('refresh:2');
                    if ($scope.layout.extensionMeta) {
                        if ($scope.layout.extensionMeta.author !== defaults.extensionMeta.author) {
                            // logToConsole('defaults.extensionMeta', $scope.layout.extensionMeta);
                            //logToConsole('refresh:3');
                            $scope.layout.extensionMeta = angular.copy(defaults.extensionMeta);
                        }
                    }

                    logToConsole('refresh:4');

                    if ($scope.layout.qSelectionInfo.qInSelections) {
                        logToConsole('refresh: qInSelections =  true');
                        // make sure we have the same data set for wherever the user has scrolled to.
                        //if ($scope.layout.qHyperCube.qDataPages[0].qArea.qTop != currentLayout.virtualScroll.qArea.qTop) {
                            isRefresh = false;
                            logToConsole('refresh: isRefresh = false');
                        //}
                    }

                    if (isRefresh) {
                        if (!angular.equals($scope.layout, currentLayout)) {
                            currentLayout =  JSON.parse(JSON.stringify($scope.layout)); // angular.copy($scope.layout);
                            logToConsole('refresh:5.2');
                            logToConsole('currentLayout.qSelectionInfo.qInSelections', currentLayout.qSelectionInfo.qInSelections);
                        } else {
                            logToConsole('refresh:return');
                            return;
                        }

                        if (!currentLayout.virtualScroll) { currentLayout.virtualScroll = {} };

                        currentLayout.virtualScroll.qArea = currentLayout.qHyperCube.qDataPages[0].qArea;
                        currentLayout.virtualScroll.sbThumbYpx = '0px';
                        currentLayout.virtualScroll.sbThumbY = 0;
                        currentLayout.virtualScroll.rowIndex = 0;
                        currentLayout.virtualScroll.rowsVisibleCount = 0;
                        currentLayout.virtualScroll.forwardCount = 0;
                        currentLayout.virtualScroll.reverseCount = 0;
                        if (!$scope.layout.qSelectionInfo.qInSelections) {
                            currentLayout.virtualScroll.selected = [];
                        }
                        
                        currentLayout.dimCount = currentLayout.qHyperCube.qDimensionInfo.length;

                        setHeadersAndTotals();

                        // $scope.layout.props.standardSelect = $scope.layout.props.standardSelect == undefined ? false : $scope.layout.props.standardSelect;                        
                    }

                    updateLayout();

                    var cols;
                    var sourceDragId;

                    function handleDragStart(e) {
                        // this.style.opacity = '0.4';
                        sourceDragId = e.srcElement.getAttribute('data-index');
                        e.dataTransfer.effectAllowed = 'move';
                    }
                
                    function handleDragOver(e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        }
                        e.dataTransfer.dropEffect = 'move';
                        return false;
                    }

                    function handleDragEnter(e) {
                        this.classList.add('over');
                    }

                    function handleDragLeave(e) {
                        this.classList.remove('over');
                    }

                    function handleDrop(e) {
                        if (e.stopPropagation) {
                            e.stopPropagation();
                        }

                        var targetId = this.getAttribute('data-index');
                        if (targetId != sourceDragId) {
                            processColumnMove(sourceDragId, targetId);
                        }
                        return false;
                    }

                    function handleDragEnd(e) {
                        [].forEach.call(cols, function (col) {
                            col.classList.remove('over');
                        });
                    }

                    function processColumnMove(sourceIndex, targetIndex) {
                        $scope.columnOrder.splice(targetIndex, 0, $scope.columnOrder.splice(sourceIndex, 1)[0]);
                        $scope.$apply();
                    }                    

                    waitForRender(function() {
                        var hoverStyle = '<style>.rowHighlight:hover {';
                        var tdOverride = '.rowHighlight:hover > td {';

                        if (currentLayout.props.rows.highlightRows) {
                            logToConsole('add hover style: start');
                            if (currentLayout.props.rows.rowHighlightColour) {
                                hoverStyle += 'background-color: ' + currentLayout.props.rows.rowHighlightColour + '!important;';
                                tdOverride += 'background-color: ' + currentLayout.props.rows.rowHighlightColour + '!important;';
                            } 

                            if (currentLayout.props.rows.rowHoverFontColour) {
                                hoverStyle += 'color: ' + currentLayout.props.rows.rowHoverFontColour + '!important;';
                                tdOverride += 'color: ' + currentLayout.props.rows.rowHoverFontColour + '!important;';
                            }
                    
                            hoverStyle += '}' + tdOverride + '}</style>';

                            $('#ccTable_' + currentLayout.qInfo.qId).append(hoverStyle);

                            logToConsole('add hover style: end');
                        } 


                        cols = document.querySelectorAll('#ccTableHead_'  + currentLayout.qInfo.qId + ' .ccHdrCell');
                        [].forEach.call(cols, function(col) {
                            col.addEventListener('dragstart', handleDragStart, false);
                            col.addEventListener('dragenter', handleDragEnter, false)
                            col.addEventListener('dragover', handleDragOver, false);
                            col.addEventListener('dragleave', handleDragLeave, false);
                            col.addEventListener('drop', handleDrop, false);
                            col.addEventListener('dragend', handleDragEnd, false);
                        });
                    
                        document.getElementById('ccTableBody_'  + currentLayout.qInfo.qId).addEventListener('wheel', onTableWheel);

                        if ($scope.$parent) {
                            $scope.$parent.component.resizeTable($scope.vm);

                            if (!$scope.layout.qSelectionInfo.qInSelections) {
                                $element.find('.selectable').toggleClass('selected', false);
                            } else {
                                var selectedObject = {};
                                if (currentLayout.virtualScroll.selected) {
                                    for (var i = 0; i < currentLayout.virtualScroll.selected.length; i++) {
                                        selectedObject = currentLayout.virtualScroll.selected[i];
                                        $element.find("[data-dimension='" + selectedObject.dim + "'][data-value='" + selectedObject.value + "']").toggleClass('selected', true)
                                    }
                                }
                            }                            
                        }
                    })             

                    // $element.off('qv-activate', '.selectable')
                    // if ($scope.layout.props.standardSelect) {
                    //     $element.on('qv-activate', '.selectable', function() {
                    //         if (this.hasAttribute('data-value')) {
                    //             var value = parseInt(this.getAttribute('data-value'), 10);
                    //             var dim = parseInt(this.getAttribute('data-dimension'), 10);

                    //             if (!currentLayout.virtualScroll.selected) {
                    //                 currentLayout.virtualScroll.selected = [];
                    //             }

                    //             currentLayout.virtualScroll.selected.push({ dim: dim, value: value});
                    //             $scope.selectValues(dim, [value], true)
                    //             $element.find("[data-dimension='" + dim + "'][data-value='" + value + "']").toggleClass('selected')
                    //         }
                    //     })
                    // }

                    logToConsole('refresh:$scope', $scope);
                }

                refresh();

            }] 
        };
    } );
