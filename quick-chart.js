var subChartProto = {
    title:  'The very important chart',
                           // to be replaced, when applying this configuration (not a c3 parameter)
    bindto: '#subchart',   // to be replaced, when applying this configuration
    data: {
        x: 'Period Month', // to be replaced, when applying this configuration
        y: 'timestamp',    // to be replaced, when applying this configuration (not a c3 parameter)
        columns: [         // to be replaced, when applying this configuration
            ['Period Month', '2016/01', '2016/02', '2016/03', '2016/04', '2016/05', '2016/06', '2016/07', '2016/08', '2016/09', '2016/10', '2016/11', '2016/12'],
            ['AWS', 200, 1000, 14000, 200, 200000, 100000, 90000, 100000, 140000, 20000, 10000, 40000],
            ['Azure', 300, 1500, 1400, 20000, 10000, 4000, 9000, 1000, 1400, 2000, 1000, 400],
            ['Google', 3000, 15000, 10000, 50000, 80000, 70000, 9000, 10000, 14000, 12000, 8000, 4000],
        ],
        columnsRaw : [     // to be replaced, when applying this configuration (not a c3 parameter)
            [ // line
                {}, // rows
                {},
                {},
            ],
            [ // line
                {}, // rows
                {},
                {},
            ],
            [ // line
                {}, // rows
                {},
                {},
            ],
        ],
        lineColors: ['#112233', '#223344', '#556677'], // by count of lines
                                                       // to be replaced, when applying this configuration (not a c3 parameter)
        partitionDim: 'cloud_provider',                // to be replaced, when applying this configuration (not a c3 parameter)
        type: 'line'
    },
    grid: {
        x: {
            show: true
        },
        y: {
            show: true
        }
    },
    axis: {
        x: {
            label: {
                text: 'Name Of X Axis', // to be replaced, when applying this configuration
            },
            type: 'category',
            tick: {
                rotate: 90,
                multiline: false
            }
        },
        y: {
            label: {
                text: 'Name Of Y Axis', // to be replaced, when applying this configuration
                position: 'outer-middle',
            },
            tick: {
                format: d3.format('$,'),
                //or format: function (d) { return '$' + d; }

            }
        }
    }
};

function prepareSubChartColumns(businessData, dim1Elem, dim2Elem, partitionByDim2, scoreColId) {
    var chartColumns = [];
    var relevantData = _.filter(businessData, function(row) {
        var isRelevant = true;
        isRelevant = isRelevant && row[dim1Elem.dim] === dim1Elem.elem;
        if(!_.isUndefined(dim2Elem))
            isRelevant = isRelevant && row[dim2Elem.dim] === dim2Elem.elem;
        return isRelevant;
    });

    // if multiple charts
    if(_.isUndefined(dim2Elem)) {
        relevantData = _.values(_.groupBy(relevantData, partitionByDim2));
    } else { // only one line
        relevantData = [relevantData];
    }

    var xAxis = ['timestamp'];
    _.forEach(relevantData[0], function(row) {
        xAxis.push(row['timestamp']);
    });
    chartColumns.push(xAxis);

    _.forEach(relevantData, function(line) {
        var dataCol = [scoreColId];
        _.forEach(relevantData, function(row) {
            dataCol.push(row[scoreColId]);
        });

        chartColumns.push(dataCol);
    });

    return {
        c3: chartColumns,
        raw: relevantData,
    };
}

function prepareSubChartConfig(bindto, title, nameOfX, nameOfY, chartColumns, xColumnId, yColumnId, partitionDim, lineColors) {
    var cfg = _.cloneDeep(subChartProto);

    cfg.bindto = bindto;
    cfg.axis.x.label.text = nameOfX;
    cfg.axis.y.label.text = nameOfY;
    cfg.data.x = xColumnId;
    cfg.data.y = yColumnId;
    cfg.data.columns    = chartColumns.c3;
    cfg.data.columnsRaw = chartColumns.raw;
    cfg.data.partitionDim = partitionDim;
    cfg.data.lineColors   = lineColors;
    cfg.data.lineColors   = lineColors;
    cfg.title = title;

    return cfg;
}

var subChartInstance = undefined;
function drawChart(cfg) {
    if(!_.isUndefined(subChartInstance)) {
        subChartInstance.destroy();
    }

    subChartInstance = drawChart_(cfg);
}

function drawChart_(cfg) {
    var data = _.cloneDeep(cfg.data.columnsRaw);
    // set the dimensions and margins of the graph
    var margin = {
            top: 60,
            right: 20,
            bottom: 60,
            left: 80
        },
        width = 450,
        height = 450;

    // set the ranges
    var x = d3.scaleTime()  .range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) {
            return x(d[cfg.data.x]);
        })
        .y(function(d) {
            return y(d[cfg.data.y]);
        });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select(cfg.bindto).append("svg")
        .attr("width",  width  + margin.left + margin.right)
        .attr("height", height + margin.top  + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // title
    d3.select(cfg.bindto + ' svg').append("text")
        .style("text-anchor", "left")
        .attr("transform", "translate(" + margin.left + ", 30)")
        .text(cfg.title);

    // Scale the range of the data
    x.domain(d3.extent(_.flatten(data), function(d) {
        return d[cfg.data.x];
    }));

    var maxY = d3.max(_.flatten(data), function(d) {
        return d[cfg.data.y];
    });
    maxY = maxY * 1.1;
    y.domain([0, maxY]);

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr('class', 'grid')
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%Y %b"))
            .tickSize(-height)
        )
        .selectAll("text")
            .attr("transform", "rotate(90)")
            .style("text-anchor", "start")
            .attr("y", 0)
            .attr("x", 9)
            .attr("dy", ".35em")

        ;

    // Add the Y Axis
    svg.append("g")
        .attr('class', 'grid')
        .call(d3.axisLeft(y)
            .tickSize(-width)
        );


    _.forEach(data, function(lineData, i) {
        // Add the valueline path.
        svg.append("path")
            .data([lineData])
            .attr("class", "subchart-line")
            .attr("data-legend", function(d) { return cfg.data.partitionDim ? d[0][cfg.data.partitionDim] : '' })
            .attr('stroke', cfg.data.lineColors[i])
            .attr("d", valueline)
            .attr("fill", "none");
    });

    if(cfg.data.partitionDim) {
        svg.append("g")
            .attr("class","legend")
            .attr("transform","translate(250,-50)")
            .style("font-size","12px")
            .call(d3.legend)
    }

    return {
        destroy: function() {
            d3.select(cfg.bindto + ' > *').remove();
        }
    };

}
