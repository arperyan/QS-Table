define( [

], function () {
    'use strict';

    var dimensions = {
        uses: "dimensions",
        min: 1,
        type: 'items',
        grouped: true,
        items: {
            dimensionCustomLabel: {
                type: 'items',
                items: {
                    dimensionLabel: {
                        label: 'Custom Label',
                        ref: 'qDef.customLabel',
                        type: 'string',
                        expression: 'optional',
                        defaultValue: ''
                    }
                }
            },
            dimensionCondition: {
                type: 'items',
                items: {
                    visibility: {
                        label: 'Visibility condition',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'qDef.showMeasure',
                        defaultValue: false,
                        options: [{
                            value: true,
                            label: 'Conditional'
                        }, {
                            value: false,
                            label: 'Always'
                        }]
                    },
                    exprCondition: {
                        label: 'Condition',
                        ref: 'qDef.qShowHide',
                        type: 'string',
                        expression: 'optional',
                        defaultValue: '',
                        show: function (obj) {
                            return obj.qDef.showMeasure;
                        }
                    }                    
                }
            },            
            cellWidth: {
                type: 'items',
                items: {
                    adjustColumnWidth: {
                        label: 'Adjust column width',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'qDef.adjustColumnWidth',
                        defaultValue: false,
                        options: [{
                            value: false,
                            label: 'calculated width'
                        }, {
                            value: true,
                            label: 'adjusted width'
                        }]
                    },
                    columnWidthExpr: {
                        label: 'Column width (px)',
                        ref: 'qDef.columnWidth',
                        type: 'number',
                        expression: 'optional',
                        defaultValue: 120,
                        show: function (obj) {
                            return obj.qDef.adjustColumnWidth;
                        },
                        change: function(obj) {return true;}                        
                    }                    
                }
            },
            dimTitleSettings :{
                type: 'items',
                component: 'items',
                items: {
                    cellFontColor: {
                        label: 'Text colour (default)',
                        component: 'color-picker',
                        dualOutput: true,
                        type: 'object',
                        ref: 'qDef.textColorPicker',
                        defaultValue: '',
                        show: function (obj, what) {
                            // console.log('obj', obj); // obj gives you qDef, qAttributeDimensions, qAttributeExpressions, qSortBy
                            // console.log('what', what); // interesting, what gives you dimensionand measure definitions and properties....

                            if (typeof obj.qDef.textColorPicker == 'undefined') {
                                var colour = {
                                    color: 'none',
                                    index: 0
                                };
                                obj.qDef.textColorPicker = colour;
                            }
                            return true;
                        }                           
                    },                     
                    cellFontColorExpression: {
                        label: 'Cell text colour (per cell)',
                        type: 'string',
                        expression: 'optional',
                        component: 'expression',
                        ref: 'qAttributeExpressions.0.qExpression',
                        defaultValue: ''
                    },                      
                    cellBackgroundColor: {
                        label: 'Background colour (default)',
                        component: 'color-picker',
                        dualOutput: true,
                        schemaIgnore: true,
                        type: 'object',
                        ref: 'qDef.backgroundColorPicker',
                        defaultValue: '',
                        show: function (obj, what) {
                            // console.log('obj', obj); // obj gives you qDef, qAttributeDimensions, qAttributeExpressions, qSortBy
                            // console.log('what', what); // interesting, what gives you dimensionand measure definitions and properties....

                            if (typeof obj.qDef.backgroundColorPicker == 'undefined') {
                                var colour = {
                                    color: 'none',
                                    index: 0
                                };
                                obj.qDef.backgroundColorPicker = colour;
                            }
                            return true;
                        }                          
                    },
                    cellBackgroundColorExpression: {
                        label: 'Cell background colour (per cell)',
                        type: 'string',
                        component: 'expression',
                        expression: 'optional',
                        ref: 'qAttributeExpressions.1.qExpression',
                        defaultValue: ''
                    },           
                    titleTextAlignment: {
                        type: 'string',
                        component: 'item-selection-list',
                        icon: true,
                        horizontal: true,
                        label: 'Title horizontal alignment',
                        ref: 'qDef.titleTextAlignment',
                        defaultValue: 'left',
                        items: [{
                            value: 'left',
                            component: 'icon-item',
                            icon: 'M'
                        }, {
                            value: 'center',
                            icon: 'O',
                            component: 'icon-item'
                        }, {
                            value: 'right',
                            icon: 'N',
                            component: 'icon-item'
                        }]                        
                    },                                
                    textAlignment: {
                        type: 'string',
                        component: 'item-selection-list',
                        icon: true,
                        horizontal: true,
                        label: 'Column cell horizontal alignment',
                        ref: 'qDef.textAlignment',
                        defaultValue: 'left',
                        items: [{
                            value: 'left',
                            component: 'icon-item',
                            icon: 'M'
                        }, {
                            value: 'center',
                            icon: 'O',
                            component: 'icon-item'
                        }, {
                            value: 'right',
                            icon: 'N',
                            component: 'icon-item'
                        }]                        
                    }               
                }
            },
            cellBorder: {
                label: 'Show right column border',
                type: 'boolean',
                component: 'switch',
                ref : 'qDef.showBorder',
                defaultValue: true,
                options: [{
                    value: false,
                    label: 'Hide'
                }, {
                    value: true,
                    label: 'Show'
                }]
            },            
            dimensionSelectable: {
                label: 'Selectable when clicked',
                type: 'boolean',
                component: 'switch',
                ref : 'qDef.isSelectable',
                defaultValue: true,
                options: [{
                    value: false,
                    label: 'Not selectable'
                }, {
                    value: true,
                    label: 'Selectable'
                }]
            },
            dimensionSearchable: {
                            label: 'Show search icon',
                            type: 'boolean',
                            component: 'switch',
                            ref : 'qDef.isSearchable',
                            defaultValue: true,
                            options: [{
                                value: false,
                                label: 'Not Searchable'
                            }, {
                                value: true,
                                label: 'Searchable'
                            }]
                        }            
        }        
    };
    var measures = { 
        uses: "measures",
        min: 0,
        type: 'items',
        grouped: true,
        items: {
            measureCustomLabel: {
                type: 'items',
                items: {
                    dimensionLabel: {
                        label: 'Custom Label',
                        ref: 'qDef.customLabel',
                        type: 'string',
                        expression: 'optional',
                        defaultValue: ''
                    }
                }
            },            
            measureCondition: {
                type: 'items',
                items: {
                    visibility: {
                        label: 'Visibility condition',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'qDef.showMeasure',
                        defaultValue: false,
                        options: [{
                            value: true,
                            label: 'Conditional'
                        }, {
                            value: false,
                            label: 'Always'
                        }]
                    },
                    exprCondition: {
                        label: 'Condition',
                        ref: 'qDef.qShowHide',
                        type: 'string',
                        expression: 'optional',
                        defaultValue: '',
                        show: function (obj) {
                            return obj.qDef.showMeasure;
                        }
                    }                    
                }
            },
            titleSettings :{
                type: 'items',
                component: 'items',
                items: {
                    cellFontColor: {
                        label: 'Text colour (default)',
                        component: 'color-picker',
                        dualOutput: true,
                        schemaIgnore: true,
                        type: 'object',
                        ref: 'qDef.textColorPicker',
                        defaultValue: '',
                        show: function (obj, what) {
                            // console.log('obj', obj); // obj gives you qDef, qAttributeDimensions, qAttributeExpressions, qSortBy
                            // console.log('what', what); // interesting, what gives you dimensionand measure definitions and properties....

                            if (typeof obj.qDef.textColorPicker == 'undefined') {
                                var colour = {
                                    color: 'none',
                                    index: 0
                                };
                                obj.qDef.textColorPicker = colour;
                            }
                            return true;
                        }                          
                    },                     
                    cellFontColorExpression: {
                        label: 'Cell text colour (per cell)',
                        type: 'string',
                        expression: 'optional',
                        component: 'expression',
                        ref: 'qAttributeExpressions.0.qExpression',
                        defaultValue: ''
                    },                      
                    cellBackgroundColor: {
                        label: 'Background colour (default)',
                        component: 'color-picker',
                        dualOutput: true,
                        schemaIgnore: true,
                        type: 'object',
                        ref: 'qDef.backgroundColorPicker',
                        defaultValue: '',
                        show: function (obj, what) {
                            // console.log('obj', obj); // obj gives you qDef, qAttributeDimensions, qAttributeExpressions, qSortBy
                            // console.log('what', what); // interesting, what gives you dimensionand measure definitions and properties....

                            if (typeof obj.qDef.backgroundColorPicker == 'undefined') {
                                var colour = {
                                    color: 'none',
                                    index: 0
                                };
                                obj.qDef.backgroundColorPicker = colour;
                            }
                            return true;
                        }                          
                    },
                    cellBackgroundColorExpression: {
                        label: 'Cell background colour (per cell)',
                        type: 'string',
                        expression: 'optional',
                        component: 'expression',
                        ref: 'qAttributeExpressions.1.qExpression',
                        defaultValue: ''
                    },                    
                    titleTextAlignment: {
                        type: 'string',
                        component: 'item-selection-list',
                        icon: true,
                        horizontal: true,
                        label: 'Title horizontal alignment',
                        ref: 'qDef.titleTextAlignment',
                        defaultValue: 'left',
                        items: [{
                            value: 'left',
                            component: 'icon-item',
                            icon: 'M'
                        }, {
                            value: 'center',
                            icon: 'O',
                            component: 'icon-item'
                        }, {
                            value: 'right',
                            icon: 'N',
                            component: 'icon-item'
                        }]                        
                    },                                
                    textAlignment: {
                        type: 'string',
                        component: 'item-selection-list',
                        icon: true,
                        horizontal: true,
                        label: 'Column cell horizontal alignment',
                        ref: 'qDef.textAlignment',
                        defaultValue: 'left',
                        items: [{
                            value: 'left',
                            component: 'icon-item',
                            icon: 'M'
                        }, {
                            value: 'center',
                            icon: 'O',
                            component: 'icon-item'
                        }, {
                            value: 'right',
                            icon: 'N',
                            component: 'icon-item'
                        }]                        
                    }   
                }
            },
            cellWidth: {
                type: 'items',
                items: {
                    adjustColumnWidth: {
                        label: 'Adjust column width',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'qDef.adjustColumnWidth',
                        defaultValue: false,
                        options: [{
                            value: false,
                            label: 'calculated width'
                        }, {
                            value: true,
                            label: 'adjusted width'
                        }]
                    },
                    columnWidthExpr: {
                        label: 'Column width (px)',
                        ref: 'qDef.columnWidth',
                        type: 'number',
                        expression: 'optional',
                        defaultValue: 120,
                        show: function (obj) {
                            return obj.qDef.adjustColumnWidth;
                        },
                        change: function(obj) {return true;}                    
                    }        
                }
            },
            representationSelection: {
                type: 'items',
                items: {
                    representation: {
                        type: 'string',
                        component: 'item-selection-list',
                        icon: true,
                        horizontal: true,
                        label: 'Representation',
                        ref: 'qDef.cellRepresentation',
                        defaultValue: 'text',
                        items: [{
                            value: 'text',
                            component: 'icon-item',
                            labelPlacement: 'bottom',
                            label: 'Text',
                            icon: '/'
                        }, {
                            value: 'progressbar',
                            component: 'icon-item',
                            labelPlacement: 'bottom',
                            label: 'Progress',
                            icon: '⌂'
                        }]
                    },
                    gText: {
                        type: 'items',
                        items: {
                            textisHTML: {
                                type: 'boolean',
                                label: 'Text is HTML',
                                ref: 'qDef.useHTML',
                                defaultValue: false,
                                change: function (obj) {
                                    if (obj.qDef.useHTML) {
                                        obj.qDef.Showtotal = false;
                                        obj.qDef.useURL = false;
                                    }
                                }
                            },
                            textisURL: {
                                type: 'boolean',
                                label: 'Text is URL',
                                ref: 'qDef.useURL',
                                defaultValue: false,
                                change: function (obj) {
                                    if (obj.qDef.useURL) {
                                        obj.qDef.useHTML = false;
                                        obj.qDef.Showtotal = false;
                                    }
                                }
                            },
                            urlLabel: {
                                type: 'string',
                                ref: 'qAttributeExpressions.2.qExpression',
                                component: 'expression',
                                defaultValue: '',
                                label: 'URL Label',
                                show: function (obj) {
                                    return obj.qDef.useURL;
                                }
                            }
                        },
                        show: function (obj) {
                            return obj.qDef.cellRepresentation == 'text';
                        }
                    },                    
                    gprogress: {
                        type: 'items',
                        items: {
                            progressMaxValueSel: {
                                type: 'boolean',
                                component: 'switch',
                                label: 'Progress bar scale',
                                ref: 'qDef.progressMaxIsDynamic',
                                defaultValue: true,
                                trueOption: {
                                    value: true,
                                    label: 'Dynamic'
                                },
                                falseOption: {
                                    value: false,
                                    label: 'Fixed'
                                }
                            },
                            progressMaxValueFixed: {
                                type: 'number',
                                ref: 'qDef.progressMaxFixedValue',
                                expression: 'optional',
                                label: 'Max value',
                                defaultValue: 100,
                                show: function (obj) {
                                    return !obj.qDef.progressMaxIsDynamic;
                                }
                            },
                            progressBarColorPicker: {
                                component: 'color-picker',
                                type: 'object',
                                label: 'Progress bar colour',
                                dualOutput: true,
                                schemaIgnore: true,
                                ref: 'qDef.progressBarColorPicker',
                                show: function (obj, what) {
                                    // console.log('obj', obj); // obj gives you qDef, qAttributeDimensions, qAttributeExpressions, qSortBy
                                    // console.log('what', what); // interesting, what gives you dimensionand measure definitions and properties....

                                    if (typeof obj.qDef.progressBarColorPicker == 'undefined') {
                                        var colour = {
                                            color: 'none',
                                            index: 0
                                        };
                                        obj.qDef.progressBarColorPicker = colour;
                                    }
                                    return true;
                                }                                
                            },
                            progressBarColorExpression: {
                                label: '',
                                type: 'string',
                                expression: 'optional',
                                component: 'expression',
                                ref: 'qAttributeExpressions.3.qExpression',
                                defaultValue: ''
                            },
                            progressBarShowValue: {
                                type: 'boolean',
                                label: 'Show value',
                                ref: 'qDef.progressBarShowValue',
                                defaultValue: false
                            }
                        },
                        show: function (obj) {
                            return obj.qDef.cellRepresentation == 'progressbar';
                        }
                    }
                }
            },
            cellBorder: {
                label: 'Show right column border',
                type: 'boolean',
                component: 'switch',
                ref : 'qDef.showBorder',
                defaultValue: true,
                options: [{
                    value: false,
                    label: 'Hide'
                }, {
                    value: true,
                    label: 'Show'
                }]
            },
            showTotal: {
                label: 'Show Total',
                type: 'boolean',
                ref : 'qDef.Showtotal',
                defaultValue: true,
                change: function(obj) {
                    if (obj.qDef.Showtotal) {
                        obj.qDef.useHTML = false;
                        obj.qDef.useURL = false;
                    }
                }
            }                              
        }
    };
    var sorting = { uses: "sorting" };
    var addons = { uses: "addons" };
    var appearancePanel = { uses: "settings" };
    var tablePanel = {
        type: 'items',
        component: 'expandable-items',        
        label: 'Table settings',
        items: {
            header: {
                label: 'Header',
                component: 'items',
                type: 'items',
                items: {
                    showHeaderRow: {
                        label: 'Show header',
                        type: 'boolean',
                        ref : 'props.header.showHeader',
                        defaultValue: true
                    },                    
                    headerFontColour: {
                        label: 'Font colour',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.header.fontColor',
                        defaultValue: ''
                    },
                    headerFontSize: {
                        label: 'Font Size',
                        type: 'number',
                        expression: 'optional',
                        ref: 'props.header.fontsize',
                        defaultValue: 13,
                        change: function(obj) {}
                    },
                    headerFontFamily: {
                        label: 'Font Family',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.header.fontfamily',
                        defaultValue: ''
                    },
                    headerFontWeight: {
                        label: 'Bold',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'props.header.fontBold',
                        defaultValue: false,
                        options: [{
                            value: false,
                            label: 'Normal'
                        }, {
                            value: true,
                            label: 'Bold'
                        }]
                    },
                    headerFontStyle: {
                        label: 'Italic',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'props.header.fontItalic',
                        defaultValue: false,
                        options: [{
                            value: false,
                            label: 'Normal'
                        }, {
                            value: true,
                            label: 'Italic'
                        }]
                    },
                    headerTextDecoration: {
                        label: 'Underlined',
                        type: 'boolean',
                        component: 'switch',
                        ref : 'props.header.textUnderlined',
                        defaultValue: false,
                        options: [{
                            value: false,
                            label: 'Normal'
                        }, {
                            value: true,
                            label: 'Underlined'
                        }]
                    },  
                    headerBgColour: {
                        label: 'Background colour',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.header.headerBackgroundColor',
                        defaultValue: ''
                    }                                                                                  
                }
            },
            rowSettings: {
                label: 'Rows',
                component: 'items',
                type: 'items',
                items: {
                    rowFontColour: {
                        label: 'Font colour',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.rows.fontColour',
                        defaultValue: ''
                    },
                    rowFontSize: {
                        label: 'Font Size',
                        type: 'number',
                        expression: 'optional',
                        ref: 'props.rows.fontsize',
                        defaultValue: 13,
                        change: function(obj) {}
                    },
                    rowFontFamily: {
                        label: 'Font Family',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.rows.fontfamily',
                        defaultValue: ''
                    },
                    rowFontStyle: {
                        label: 'Font Style',
                        type: 'string',
                        component: 'buttongroup',
                        ref: 'props.rows.fontstyle',
                        defaultValue: '',
                        options: [{
                            value:'bold',
                            label: 'Bold',
                            tooltip: 'Select for bold'
                        },
                        {
                            value:'italic',
                            label: 'Italic',
                            tooltip: 'Select for bold'
                        } ,
                        {
                            value:'underline',
                            label: 'Underline',
                            tooltip: 'Select for bold'
                        }                        ]
                    },
                    rowBgColour: {
                        label: 'Background colour',
                        type: 'string',
                        expression: 'optional',
                        ref: 'props.rows.rowsBackgroundColor',
                        defaultValue: ''
                    }, 
                    showRowBorder: {
                        label: 'Show row border',
                        type: 'boolean',
                        ref : 'props.rows.showBorder',
                        defaultValue: true
                    },
                    showRowStripes: {
                        label: 'Show row stripes',
                        type: 'boolean',
                        ref : 'props.rows.useStripes',
                        defaultValue: true
                    },
                    rowHover: {
                        component: 'items',                
                        type: 'items',                        
                        items: {
                            showRowHover: {
                                label: 'Highlight rows',
                                type: 'boolean',
                                ref : 'props.rows.highlightRows',
                                defaultValue: true
                            },                    
                            rowHoverBgColour: {
                                label: 'Hightlight colour',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.rows.rowHighlightColour',
                                defaultValue: '#696969'
                            },
                            rowHoverFontColour: {
                                label: 'Hightlight font colour',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.rows.rowHoverFontColour',
                                defaultValue: '#FFFFFF'
                            }
                        }
                    }                                                                                                                                                     
                }
            },    
            totals: {
                label: 'Totals',
                component: 'items',                
                type: 'items',
                grouped: true,
                items: {
                    totalSettings: {
                        component: 'items',                
                        type: 'items',                        
                        items: {
                            showTotals: {
                                label: 'Show total row',
                                type: 'boolean',
                                ref : 'props.totals.showTotals',
                                defaultValue: true
                            },    
                            totalsPosition: {
                                label: 'Font Style',
                                type: 'string',
                                component: 'buttongroup',
                                ref: 'props.totals.position',
                                defaultValue: '',
                                options: [{
                                    value:'top',
                                    label: 'Top',
                                    tooltip: 'Select for top'
                                },
                                {
                                    value:'bottom',
                                    label: 'Bottom',
                                    tooltip: 'Select for bottom'
                                }                       ]
                            },                                        
                            totalsBackgroundColor: {
                                label: 'Background colour',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.totals.totalsBackgroundColor',
                                defaultValue: ''
                            },
                            totalsFontColor: {
                                label: 'Text colour',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.totals.totalsTextColor',
                                defaultValue: ''
                            },                            
                            totalsLabel: {
                                label: 'Totals label',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.totals.totalsLabel',
                                defaultValue: ''
                            }
                        }
                    }
                }
            },                  
            other: {
                label: 'Other',
                component: 'items',                
                type: 'items',
                grouped: true,
                items: {
                    nullSettings: {
                        component: 'items',                
                        type: 'items',                        
                        items: {
                            nullsymbol: {
                                label: 'Null symbol',
                                type: 'string',
                                ref : 'props.nullsymbol',
                                defaultValue: ''
                            },                    
                            nullCellBackgroundColor: {
                                label: 'Null cell background colour',
                                type: 'string',
                                expression: 'optional',
                                ref: 'props.nullCellBackgroundColor',
                                defaultValue: ''
                            },
                            maxRowCount: {
                                label: 'Maximum number of rows to display',
                                type: 'number',
                                ref: 'props.maxDisplayRows',
                                expression: 'optional',
                                defaultValue: 500
                            }
                        }
                    },
                    exportSetting: {
                        label: 'Enable exporting as image/PDF',
                        type: 'boolean',
                        ref : 'props.enableExport',
                        defaultValue: false
                    },
                    exportDataSetting: {
                        label: 'Enable exporting of data',
                        type: 'boolean',
                        ref : 'props.enableExportData',
                        defaultValue: false
                    },
                    selectOptions: {
                        label: 'Single click select',
                        type: 'boolean',
                        ref : 'props.standardSelect',
                        defaultValue: false
                    },
                    logToConsole: {
                        label: 'debug to console',
                        type: 'boolean',
                        ref: 'props.logToConsole',
                        defaultValue: false
                    }                    
                }
            }
        }
    };
    return {
        type: "items",
        component: "accordion",
        items: {
            dimensions: dimensions,
            measures: measures,
            addons:  {
                uses: 'addons',
                type: 'items',
                component: 'items',                
                items: {
                    zerovalues: {
                        type: 'boolean',
                        ref: 'qHyperCubeDef.qSuppressZero',
                        label: 'Suppress Zero Values',
                        defaultValue: false
                    },
                    dataHandling: {  
                        uses: "dataHandling"  
                   }                    
                }
			},            
            sorting: sorting,
            customSection: tablePanel,
            appearance: appearancePanel,
            support: {
                snapshot: true,
                export: true,
                exportData: true
            }
        }
    };
} );
