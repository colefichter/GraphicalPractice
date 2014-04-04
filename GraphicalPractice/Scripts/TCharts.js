//Provide an inheritance mechanism... See http://javascript.crockford.com/prototypal.html
if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        function F() { }
        F.prototype = o;
        return new F();
    };
}

function Box(left, right, top, bottom) {
    this.left = left ? left : 0,
    this.right = right ? right : 0,
    this.top = top ? top : 0,
    this.bottom = bottom ? bottom : 0,
    this.parent = null;

    this.width = function() { return this.right - this.left; };
    this.height = function () { return this.bottom - this.top; };

    this.translation = function () { return "translate(" + (this.left) + "," + (this.top) + ")"; };

    ///Create new boxes, adjacent to this one...
    this.north = function (height) { return new Box(this.left, this.right, this.top - height, this.top); };
    this.south = function (height) { return new Box(this.left, this.right, this.bottom, this.bottom + height); };
    this.east = function (width) { return new Box(this.right, this.right + width, this.top, this.bottom); };
    this.west = function (width) { return new Box(this.left - width, this.left, this.top, this.bottom); };
};

/* Base class for features common to all charts. */
function TChartBase() {
    //Enums    
    this.orientationEnum = {
        HORIZONTAL: "horizontal",
        VERTICAL: "vertical"
    };

    //Default options
    this.autoHeight = true;
    this.backgroundColor = "#000000";
    this.containerSelector = '#chart';
    this._data = []; //The data to display.
    this.datum = { //Display properties for graphically representing data.
        radius: 2,
        stroke: "#000000",
        strokeWidth: 1,
        fill: "#000000",
        secondaryFill: "#B1DCFE",
        secondaryOpacity: 0.3,
        text: {
            anchor: "middle",
            dy: 12,
            fontSize: "75%"
        }
    };
    this.format = d3.format(".1f");
    this.height = 300;
    this._labels = [];
    this.margin = {
        top: 15,
        left: 15,
        bottom: 15,
        right: 15
    };
    this.smallMultipleHeight = 25;
    this.title = "My Chart";
    this.width = 500;
    this.xAxis = {
        grid: {
            opacity: 0.4,
            stroke: "#FFFFFF",
            strokeWidth: 1
        },
        scale: {
            type: d3.scale.linear //should always be one of the d3.scale functions (used as a callback to create the scale, when needed)
        },
        stroke: "#000000",
        strokeWidth: 1,
        text: {
            anchor: "middle",
            fontSize: "75%",
            color: "#000000"
        },
        tick: 10
    };
    this.yAxis = {
        labelMargin: 10,
        text: {
            anchor: "end",
            fontSize: "100%",
            color: "#000000"
        },
        scale: {
            type: d3.scale.linear //should always be one of the d3.scale functions (used as a callback to create the scale, when needed)
        },
        stroke: "#000000",
        strokeWidth: 1
    };

    this.data = function (data) {
        this._data = data;
        return this;
    };

    this.labels = function (labels) {
        this._labels = labels;
        return this;
    };

    /* Execute an aggregate against an array or nested array. Example, finding the minimum:
        var a = [[3,5],[1,2]];
        var b = [1,2,3]
        this._global(b, d3.max); //3
        this._global(a, d3.max); //5
    */
    this._global = function (data, callback) {
        if (data[0] instanceof Array) {
            return callback(data.map(function (array) {
                return callback(array);
            }));

        } else {
            return callback(data);
        }
    };

    this._getBoundingBox = function () {
        //return {
        //    left: this.margin.left,
        //    top: this.margin.top,
        //    right: this.width - this.margin.right,
        //    bottom: this.height - this.margin.bottom
        //};
        return new Box(this.margin.left, this.width - this.margin.right, this.margin.top, this.height - this.margin.bottom);
    };

    /* Generates a function that represents a scaled p-quantile of the data bound to a selection. When the callback created here is invoked
        on an array of data, it will first compute the p-tile, then scale that p-tile value and return the scaled result.
            p = the p value to base the quantile on. For example, use p=0.25 for the first (lowest) quartile.
            scale = the d3.scale instance.            
    */
    this._getScaledQuantileCallback = function (p, scale) {
        return function (d) {
            //console.log("Quantile: ", p, d);
            var sorted = d.sort(function (a, b) { return a - b }); //Jesus... JS can't sort integers automatically!  WTF?
            var nTile = d3.quantile(sorted, p);
            //console.log("nTile", nTile);
            return scale(nTile);
        };
    };

    //Use the "measure()" technique described here: http://stackoverflow.com/questions/14605348/title-and-axis-labels
    // to dynamically calculate the best dimensions for things like axes and labels.
    // Create a dummy element, apply the appropriate classes, and then measure the element.
    this._measure = function (text, classname) {
        if (!text || text.length === 0) return { height: 0, width: 0 };

        var container = d3.select('body').append('svg').attr('class', classname);
        container.append('text')
            .attr({ x: -1000, y: -1000 })
            .attr("font-size", this.yAxis.text.fontSize)
            .text(text);

        var bbox = container.node().getBBox();
        container.remove();

        return { height: bbox.height, width: bbox.width - 0 };
    };

    this._maxLabelWidth = function (labels) {
        var self = this;
        return Math.ceil(d3.max(labels.map(function (value) { return self._measure(value).width; })));
    };

    this._renderLabels = function (container, labelData, width, translation) {
        var labels = container.selectAll("g.label").data(labelData);
        labels.enter().append("g")
            .attr("class", "label")
            .attr("width", width)
            .attr("transform", translation);

        labels.append("text")
            .attr("text-anchor", this.yAxis.text.anchor)
            .attr("fill", this.yAxis.text.color)
            .attr("font-size", this.yAxis.text.fontSize)
            .text(function (d) { return d; });

        return labels;
    };
};

function QuartilePlot(options) {
    //Inherit from TCharts base.
    $.extend(this, new TChartBase());

    /* Apply options specified in constructor. First param, true, forces a deep copy!
        Deep copy allows us to easily override a subset of properties, eg:
            new TChart({ margin: { top: 50 } }) //does not affect other margin default values! */
    $.extend(true, this, options);

    this._init = function () {
        this.svg = d3.select(this.containerSelector).append("svg")
            .attr("width", this.width /*+ margin.left + margin.right*/)
            .attr("height", this.height /*+ margin.top + margin.bottom*/);
    };

    this.render = function () {
        if (this._data[0] instanceof Array) {
            this._renderQuartilePlot(this._data);
        } else {
            this._renderQuartilePlot([this._data]);
        }

        return this;
    };

    this._renderQuartilePlot = function (data) {
        var self = this;
        var globalMin = this._global(data, d3.min);
        var globalMax = this._global(data, d3.max);

        var box = this._getBoundingBox();
        var plotHeight = box.top + this.smallMultipleHeight * (data.length - 1);
        var labelWidth = this._maxLabelWidth(this._labels);

        //TODO: orientation... ?

        var wrapper = this.svg.append("svg:g")
            .attr("class", "wrapper")
            .attr("transform", "translate(" + box.left + ", " + box.top + ")");

        var left = wrapper.append("svg:g")
            .attr("class", "left");

        var labelLineHeight = Math.round(this._measure("Not a real label!").height / 3);
        var labels = this._renderLabels(left,
            this._labels,
            labelWidth,
            function (d, i) { return "translate(" + labelWidth + ", " + ((i + 1) * self.smallMultipleHeight) + ")"; }
        );

        //Setup the right-hand-side box (with the quartiles)
        var right = wrapper.append("svg:g")
            .attr("class", "right")
            //Shift the left edge over to the right of the labels (plus a margin)
            .attr("transform", "translate(" + (labelWidth + this.yAxis.labelMargin) + ", 0)");

        //The scale range is from 0 (the left of of the RHS box) to the width (the right side) of the RHS box.        
        var scale = this.xAxis.scale.type() //e.g. d3.scale.linear evaluated as a callback
           .domain([globalMin > 0 ? 0 : globalMin, globalMax])
           .range([0, box.right - box.left - labelWidth - this.yAxis.labelMargin]);

        var line = d3.svg.line()
                        .x(function (d, i) { return scale(d); })
                        .y(function (d, i) { return i * 10; });

        var containers = right.selectAll("g").data(data);

        containers.enter().append("g")
            .attr("transform", function (d, i) { return "translate(0, " + ((i + 1) * self.smallMultipleHeight) + ")"; });

        containers.append("circle") //Dots represent the median value of each quartile plot
            .attr("r", this.datum.radius)
            .attr("stroke", "none")
            .attr("fill", this.datum.fill)
            .attr("transform", function (d, i) {
                return "translate(" + scale(d3.median(d)) + "," + -labelLineHeight + ")";
            });
        containers.append("text") //Label each dot
            .text(function (d) { return self.format(d3.median(d)); })
            .attr("transform", function (d) { return "translate(" + scale(d3.median(d)) + "," + -labelLineHeight + ")"; })
            .attr("dy", this.datum.text.dy)
            .attr("text-anchor", this.datum.text.anchor)
            .attr("font-size", this.datum.text.fontSize);

        containers.insert("line") //Draw line representing first quartile
            .attr("x1", function (d, i) { return scale(d3.min(d)); })
            .attr("y1", -labelLineHeight)
            .attr("x2", this._getScaledQuantileCallback(0.25, scale))
            .attr("y2", -labelLineHeight)
            .style("stroke", this.datum.stroke)
            .attr("stroke-width", this.datum.strokeWidth)
            .attr('fill', this.datum.fill);

        containers.insert("line") //Draw line representing fourth quartile
            .attr("x1", this._getScaledQuantileCallback(0.75, scale))
            .attr("y1", -labelLineHeight)
            .attr("x2", function (d, i) { return scale(d3.max(d)); })
            .attr("y2", -labelLineHeight)
            .style("stroke", this.datum.stroke)
            .attr("stroke-width", this.datum.strokeWidth)
            .attr('fill', this.datum.fill);

        /* xAxis */
        var axisOffset = 10 /*+ box.top*/ + data.length * (self.smallMultipleHeight);
        var rules = right.selectAll("g.rule").data(scale.ticks(this.xAxis.tick))
          .enter().append("svg:g")
            .attr("class", "rule")
            .attr("transform", function (d) { return "translate(" + (scale(d)) + ", 0)"; });

        rules.append("svg:line") //axis lines
            .attr("y1", /*box.top*/0)
            .attr("y2", axisOffset + this.smallMultipleHeight)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("stroke", this.xAxis.grid.stroke)
            .attr("stroke-width", this.xAxis.grid.strokeWidth)
            .attr("stroke-opacity", this.xAxis.grid.opacity);

        rules.append("svg:text") //axis text
            .attr("y", axisOffset + this.smallMultipleHeight)
            .attr("x", 0)
            .attr("fill", this.xAxis.text.color)
            .attr("text-anchor", this.xAxis.text.anchor)
            .text(scale.tickFormat(this.xAxis.tick));
        //end of xAxis

        if (this.autoHeight) {
            this.svg.attr("height", axisOffset + this.smallMultipleHeight + this.margin.bottom + this.margin.top);
        };
    };

    this._init();
};

function Sparkline(options) {
    $.extend(this, new TChartBase());

    //Override defaults here...
    this.expectedRange = [];

    /* Apply options specified in constructor. First param, true, forces a deep copy!
       Deep copy allows us to easily override a subset of properties, eg:
           new TChart({ margin: { top: 50 } }) //does not affect other margin default values! */
    $.extend(true, this, options);
    
    this._init = function () {
        this.svg = d3.select(this.containerSelector).append("svg")
            .attr("width", this.width /*+ margin.left + margin.right*/)
            .attr("height", this.height /*+ margin.top + margin.bottom*/);
    };

    this.render = function () {
        if (this._data[0] instanceof Array) {
            this._renderSparkline(this._data);
        } else {
            this._renderSparkline([this._data]);
        }

        return this;
    };

    this._renderSparkline = function (data) {
        var self = this;
        var globalMin = this._global(data, d3.min);
        var globalMax = this._global(data, d3.max);
        var halfHeight = this.smallMultipleHeight / 2;

        var box = new Box(this.margin.left, this.width - this.margin.right);
        box.top = this.margin.top;
        box.bottom = this.height - this.margin.bottom;

        var labelWidth = this._maxLabelWidth(this._labels);

        //Create latest datapoint labels on right side...
        var dataLabels = data.map(function (d) { return self.format(d[d.length - 1], 2); });
        var dataLabelWidth = this._maxLabelWidth(dataLabels);
        //The numbers all look right, but the rendered version looks too close to the right margin... fudge it a bit.
        dataLabelWidth += 10;

        //This is a bit strange... but since we have the wrapper, which is already translated +15, left still starts at zero (even though it's +15, globally)
        var leftBox = new Box(0, labelWidth);
        var rightBox = new Box(box.right - dataLabelWidth, box.right);
        var centerBox = new Box(leftBox.right + this.yAxis.labelMargin, rightBox.left - this.yAxis.labelMargin);
        
        //Container to force margins
        var wrapper = this.svg.append("g")
            .attr("class", "wrapper")
            .attr("transform", "translate(" + box.left + ", " + box.top + ")");
        
        //Text labels on the left side
        var left = wrapper.append("svg:g")
            .attr("class", "left");
        var labelLineHeight = this._measure("Not a real label!", "").height;
        var labels = this._renderLabels(left, this._labels, labelWidth,
            function (d, i) { return "translate(" + leftBox.right + ", " + ((i) * (2 + self.smallMultipleHeight)) + ")"; }
        );
        labels.selectAll("text")
            .attr("dy", labelLineHeight); //Hack to get the text vertically aligment to something like "middle".
               
        //Setup SVG containers according to box model above
        var center = wrapper.append("svg:g")
            .attr("class", "center")
            .attr("transform", "translate(" + centerBox.left + ", 0)");

        //Labels for final data point in each series on right hand side.
        var right = wrapper.append("svg:g")
            .attr("class", "right")
            .attr("transform", "translate(" + rightBox.left + ", 0)");
        var dataLabels = this._renderLabels(right, dataLabels, 0, 
            function (d, i) { return "translate(0, " + ((i) * (2 + self.smallMultipleHeight)) + ")"; }
        );
        dataLabels.selectAll("text")
            .attr("text-anchor", "start")
            .attr("fill", this.datum.fill)
            .attr("dy", labelLineHeight); //Hack to get the text vertically aligment to something like "middle".
        
        //Sparkline containers
        var containers = center.selectAll("g").data(data);
        containers.enter().append("g")
            .attr("class", "container")
            //The extra 2 pixels is for padding between containers...
            .attr("transform", function (d, i) { return "translate(0, " + ((i) * (2 + self.smallMultipleHeight)) + ")"; });

        //vertically center the sparkline        
        var y = d3.scale.linear()
            .domain([globalMin, globalMax])
            //.range([halfHeight, -halfHeight]); //Note inverted y-scale to work with wonky SVG coordinate plane!
            .range([this.smallMultipleHeight, 0]);
                
        //The scale range is from 0 (the left of of the center box) to the width (the right side) of the center box.
        var maxSubarrayLength = this._global(data.map(function (d, i) { return d.length; }), d3.max);
        var x = this.xAxis.scale.type() //e.g. d3.scale.linear evaluated as a callback
            .domain([0, maxSubarrayLength - 1])
            .range([0, centerBox.width()]);

        // create a line object that models the SVG line we're creating
        var line = d3.svg.line()
			.x(function (d, i) { return x(i); })
			.y(function (d) { return y(d); });

        //Draw the sparklines
        containers.append("path")
            .attr("d", function (d) { return line(d); })
            .attr("stroke", this.datum.stroke)
            .attr("stroke-width", this.datum.strokeWidth)
            .attr("fill", "none");

        //Highlight final points
        containers.append("circle")                
            .attr("r", this.datum.radius)
            .attr("stroke", "none")
            .attr("fill", this.datum.fill)
            .attr("transform", function (d, i) {
                return "translate(" + x(d.length - 1) + ", " + y(d[d.length - 1]) + ")";
            });
        
        //Draw semi-opaque band indicating expected range of values.        
        containers.append("rect")
            .attr("opacity", this.datum.secondaryOpacity)
            .attr("stroke", "none")
            .attr("fill", this.datum.secondaryFill)
            .attr("x", 0)
            .attr("y", function (d, i) {
                //console.log("low/high", y(self.expectedRange[i][0]), y(self.expectedRange[i][1]));
                return y(self.expectedRange[i][1]);
            })
            .attr("width", centerBox.width())
            .attr("height", function (d, i) {
                //console.log("h", y(self.expectedRange[i][0]) - y(self.expectedRange[i][1]));
                return y(self.expectedRange[i][0]) - y(self.expectedRange[i][1]);
            });

        //Autoheight
        if (this.autoHeight) {
            this.svg.attr("height", (this.smallMultipleHeight + 2) * (data.length) + this.margin.top + this.margin.bottom);
        };
    };

    this._init();
};



function RangeFrame(options) {
    $.extend(this, new TChartBase());

    //Override defaults here...
    this.expectedRange = [];

    /* Apply options specified in constructor. First param, true, forces a deep copy!
       Deep copy allows us to easily override a subset of properties, eg:
           new TChart({ margin: { top: 50 } }) //does not affect other margin default values! */
    $.extend(true, this, options);

    this._init = function () {
        this.svg = d3.select(this.containerSelector).append("svg")
            .attr("width", this.width /*+ margin.left + margin.right*/)
            .attr("height", this.height /*+ margin.top + margin.bottom*/);
    };

    this.render = function () {
        //if (this._data[0] instanceof Array) {
        //    this._renderRangeFrame(this._data);
        //} else {
        //    this._renderRangeFrame([this._data]);
        //}
        this._renderRangeFrame(this._data);

        return this;
    };

    this._renderRangeFrame = function (data) {
        var self = this;
        var globalMin = this._global(data, d3.min);
        var globalMax = this._global(data, d3.max);

        //var box = new Box(this.margin.left, this.width - this.margin.right, this.margin.top, this.height - this.margin.bottom);
        var box = this._getBoundingBox();

        var labelLineHeight = this._measure("Not a real label!").height;
        var numberOfTicks = 5; //TODO: figure out how to calculate this dynamically

        var xMin = d3.min(data, function (d) { return d.x; });
        var xMax = d3.max(data, function (d) { return d.x; });
        var yMin = d3.min(data, function (d) { return d.y; });
        var yMax = d3.max(data, function (d) { return d.y; });

        var xScale = this.xAxis.scale.type()
            .domain([xMin, xMax]); //We set range below...            
        var yScale = this.yAxis.scale.type()
            .domain([yMin, yMax]); //We set range below...
                        
        //Container to force margins
        var wrapper = this.svg.append("g")
            .attr("class", "wrapper")
            .attr("transform", "translate(" + box.left + ", " + box.top + ")");

        //Width of labels on yAxis (vertical)
        var labels = yScale.ticks(numberOfTicks);
        var labelWidth = this._maxLabelWidth(labels);

        var xAxisHeight = labelLineHeight;
        
        var leftBox = new Box(0, labelWidth, 0, box.bottom - xAxisHeight);
        var centerBox = leftBox.east(box.width() - leftBox.width());
        var bottomBox = centerBox.south(labelLineHeight); //?

        /*console.log(box.width());
        console.log("leftBox", leftBox);
        console.log("centerBox", centerBox);
        console.log("bottomBox", bottomBox);*/

        xScale.range([0, centerBox.width()]);
        yScale.range([centerBox.height(), 0]);


        //TODO: rename LEFT/RIGHT/CENTER/BOTTOM classes to NORTH/SOUTH/EAST/WEST/CENTER


        //Container for yAxis
        var left = wrapper.append("svg:g")
            .attr("class", "left");
        this._renderLabels(left, labels, labelWidth,
            function (d, i) { return "translate(" + labelWidth + ", " + (yScale(d)) + ")"; }
        ).attr("fill", this.yAxis.text.color);
        //Draw the Y-Axis
        left.append("svg:line")
            .attr("y1", yScale(yMin))
            .attr("y2", yScale(yMax))
            .attr("x1", leftBox.right)
            .attr("x2", leftBox.right)
            .style("stroke", this.yAxis.stroke)
            .attr("stroke-width", this.yAxis.strokeWidth);
                

        
        
        //Container for xAxis
        var bottom = wrapper.append("svg:g")
            .attr("class", "bottom")
            .attr("transform", bottomBox.translation());

        //Container for data
        var center = wrapper.append("svg:g")
            .attr("class", "center")
            .attr("transform", centerBox.translation());

        center.selectAll("circle")
            .data(this._data)
            .enter().append("circle")
                .attr("r", this.datum.radius)
                .attr("stroke", "none")
                .attr("fill", this.datum.fill)
                .attr("transform", function (d, i) {
                    return "translate(" + xScale(d.x) + ", " + yScale(d.y) + ")";
                });


        /* xAxis */
        //var xContainer = wrapper.append("g")
        //    .attr("transform", function (d) { return "translate("; });














        
            

    };

    this._init();
};