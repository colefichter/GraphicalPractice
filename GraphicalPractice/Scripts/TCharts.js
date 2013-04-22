function QuartilePlot(options) {
    //Enums
    this.typeENum = {
        QUARTILE: "quartile"
    };

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
    this.type = "quartile";
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
        text: {
            anchor: "middle",
            fontSize: "75%"
        },
        tick: 10
    };
    this.yAxis = {
        text: {
            anchor: "end",
            fontSize: "75%"
        }
    };

    /* Apply options specified in constructor. First param, true, forces a deep copy!
        Deep copy allows us to easily override a subset of properties, eg:
            new TChart({ margin: { top: 50 } }) //does not affect other margin default values! */
    $.extend(true, this, options);

    this.init = function () {
        this.svg = d3.select(this.containerSelector).append("svg")
            .attr("width", this.width /*+ margin.left + margin.right*/)
            .attr("height", this.height /*+ margin.top + margin.bottom*/);
    };

    this.data = function (data) {
        this._data = data;
        return this;
    };

    this.labels = function (labels) {
        this._labels = labels;
        return this;
    };

    this.render = function () {
        switch (this.type) {
            case this.typeENum.QUARTILE:
                if (this._data[0] instanceof Array) {
                    this._renderQuartilePlot(this._data);
                } else {
                    this._renderQuartilePlot([this._data]);
                }
                break;
        };

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
        return {
            left: this.margin.left,
            top: this.margin.top,
            right: this.width - this.margin.right,
            bottom: this.height - this.margin.bottom
        };
    };

    /* Generates a function that represents a scaled p-quantile of the data bound to a selection. When the callback created here is invoked
        on an array of data, it will first compute the p-tile, then scale that p-tile value and return the scaled result.
            p = the p value to base the quantile on. For example, use p=0.25 for the first (lowest) quartile.
            scale = the d3.scale instance.            
    */
    this._getScaledQuantileCallback = function (p, scale) {
        return function (d) {
            //console.log("Quantile: ", p, d);
            var sorted = d.sort(function(a,b){return a-b}); //Jesus... JS can't sort integers automatically!  WTF?
            var nTile = d3.quantile(sorted, p);
            console.log("nTile", nTile);
            return scale(nTile);
        };
    };

    this._renderQuartilePlot = function (data) {
        var self = this;
        var globalMin = this._global(this._data, d3.min);
        var globalMax = this._global(this._data, d3.max);

        var box = this._getBoundingBox();
        var plotHeight = box.top + this.smallMultipleHeight * (data.length - 1);

        //TODO: orientation... ?



        //TODO: Try the "measure()" technique described here: http://stackoverflow.com/questions/14605348/title-and-axis-labels
        var tempLabelWidth = 100;

        var wrapper = this.svg.append("svg:g")
            .attr("class", "wrapper")
            .attr("transform", "translate(" + box.left + ", " + box.top + ")");

        var left = wrapper.append("svg:g")
            .attr("class", "left");

        //Labels
        var labels = left.selectAll("g.label").data(this._labels);
        labels.enter().append("g")
            .attr("class", "label")
            .attr("width", tempLabelWidth)
            //.attr("transform", function (d, i) { return "translate(" + box.left + ", " + (box.top + (i) * self.smallMultipleHeight) + ")"; });
            .attr("transform", function (d, i) { return "translate(100, " + (box.top + (i) * self.smallMultipleHeight) + ")"; });

        labels.append("text")
            .attr("text-anchor", this.yAxis.text.anchor)
            .text(function (d) { return d; });
        //End labels

        var right = wrapper.append("svg:g")
            .attr("class", "right")
            .attr("transform", "translate(" + tempLabelWidth + ", 0)");


        var scale = this.xAxis.scale.type() //e.g. d3.scale.linear evaluated as a callback
           .domain([globalMin > 0 ? 0 : globalMin, globalMax])
           .range([0, box.right - box.left - tempLabelWidth]);

        var line = d3.svg.line()
                        .x(function (d, i) { return scale(d); })
                        .y(function (d, i) { return i * 10; });

        //var containers = this.svg.selectAll("g").data(data);
        var containers = right.selectAll("g").data(data);

        containers.enter().append("g")
            //.attr("transform", function (d, i) { return "translate(" + box.left + ", " + (box.top + (i) * self.smallMultipleHeight) + ")"; });
            .attr("transform", function (d, i) { return "translate(0, " + (box.top + (i) * self.smallMultipleHeight) + ")"; });

        containers.append("circle") //Dots represent the median value of each quartile plot
            .attr("r", this.datum.radius)
            .attr("stroke", "none")
            .attr("fill", this.datum.fill)
            .attr("transform", function (d, i) {
                return "translate(" + scale(d3.median(d)) + ",0)";
            });
        containers.append("text")
            .text(function (d) { return self.format(d3.median(d)); })
            .attr("transform", function (d) { return "translate(" + scale(d3.median(d)) + ",0)"; })
            .attr("dy", this.datum.text.dy)
            .attr("text-anchor", this.datum.text.anchor)
            .attr("font-size", this.datum.text.fontSize);

        containers.insert("line") //Draw line representing first quartile
            .attr("x1", function (d, i) { return scale(d3.min(d)); })
            .attr("y1", 0)
            .attr("x2", this._getScaledQuantileCallback(0.25, scale))
            .attr("y2", 0)
            .style("stroke", this.datum.stroke)
            .attr("stroke-width", this.datum.strokeWidth)
            .attr('fill', this.datum.fill);

        containers.insert("line") //Draw line representing fourth quartile
            .attr("x1", this._getScaledQuantileCallback(0.75, scale))
            .attr("y1", 0)
            .attr("x2", function (d, i) { return scale(d3.max(d)); })
            .attr("y2", 0)
            .style("stroke", this.datum.stroke)
            .attr("stroke-width", this.datum.strokeWidth)
            .attr('fill', this.datum.fill);

        /* xAxis*/
        var axisOffset = 10 + box.top + data.length * (self.smallMultipleHeight - 1);
        //var rules = this.svg.selectAll("g.rule").data(scale.ticks(this.xAxis.tick))            
        var rules = right.selectAll("g.rule").data(scale.ticks(this.xAxis.tick))
          .enter().append("svg:g")
            .attr("class", "rule")
            .attr("transform", function (d) { return "translate(" + (scale(d)) + ", 0)"; });

        rules.append("svg:line") //axis lines
            .attr("y1", box.top)
            .attr("y2", axisOffset)
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("stroke", this.xAxis.grid.stroke)
            .attr("stroke-width", this.xAxis.grid.strokeWidth)
            .attr("stroke-opacity", this.xAxis.grid.opacity);

        rules.append("svg:text") //axis text
            .attr("y", axisOffset)
            .attr("x", 0)
            .attr("text-anchor", this.xAxis.text.anchor)
            .text(scale.tickFormat(this.xAxis.tick));
        //end of xAxis

        if (this.autoHeight) {
            this.svg.attr("height", axisOffset + this.smallMultipleHeight + this.margin.bottom);
        };
    };

    this.init();
};