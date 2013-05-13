module('Quartile Plot');
test("Default config", function () {
    var q = new QuartilePlot();
    ok(q.autoHeight, "autoHeight");
    ok(q.backgroundColor == "#000000", "backgroundColor");
    ok(q.containerSelector == '#chart', "containerSelector");
    ok(q._data instanceof Array, "_data");
    ok(q._data.length == 0, "_data.length");
    ok(q.datum.radius == 2, "datum.radius");
    ok(q.datum.stroke == "#000000", "datum.stroke");
    ok(q.datum.strokeWidth == 1, "datum.strokeWidth");
    ok(q.datum.fill == "#000000", "datum.fill");
    ok(q.datum.text.anchor == "middle", "datum.text.anchor");
    ok(q.datum.text.dy == 12, "datum.text.dy");
    ok(q.datum.text.fontSize == "75%", "datum.text.fontSize");

    //ok(q.format == d3.format(".1f"), "format"); //How to test this? .format is actually a function
    ok(q.height == 300, "height");
    ok(q._labels instanceof Array , "_labels");
    ok(q._labels.length == 0, "_labels.length");
    ok(q.margin.top == 15, "margin.top");
    ok(q.margin.left == 15, "margin.left");
    ok(q.margin.bottom == 15, "margin.bottom");
    ok(q.margin.right == 15, "margin.right");
    ok(q.smallMultipleHeight == 25, "smallMultipleHeight");
    ok(q.title == "My Chart", "title");
    //ok(q.type == "quartile", "type");
    ok(q.width == 500, "width");

    //TODO: finish checking the other deftault config settings...

    /*
    ok(q. == , "");
    ok(q. == , "");
    ok(q. == , "");
    ok(q. == , "");
    ok(q. == , "");
    ok(q. == , "");
    ok(q. == , "");
    */
});

test("Set data (Quartile Plot)", function () {
    var q = new QuartilePlot();
    ok(q._data instanceof Array, "_data 1");
    ok(q._data.length == 0, "_data.length 1");

    q.data([1, 2, 3, 4, 5]);

    ok(q._data instanceof Array, "_data 2");
    ok(q._data.length == 5, "_data.length 2");
    ok(q._data[0] == 1, "First element");
    ok(q._data[4] == 5, "Last element");
});

test("Set labels (Quartile Plot)", function () {
    var q = new QuartilePlot();
    ok(q._labels instanceof Array, "_labels 1");
    ok(q._labels.length == 0, "_labels.length 1");

    q.labels(["a", "b", "c", "d", "e"]);

    ok(q._labels instanceof Array, "_labels 2");
    ok(q._labels.length == 5, "_labels.length 2");
    ok(q._labels[0] == "a", "First element");
    ok(q._labels[4] == "e", "Last element");
});

test("_global() max (Quartile Plot)", function () {
    var q = new QuartilePlot();
    var a = [[3, 5], [1, 2]];
    var b = [4, 5, 6]

    ok(q._global(a, d3.min) == 1, "Min in 'a'");
    ok(q._global(a, d3.max) == 5, "Max in 'a'");
    ok(q._global(b, d3.min) == 4, "Min in 'b'");
    ok(q._global(b, d3.max) == 6, "Max in 'b'");
});

test("_getBoundingBox() defaults (Quartile Plot)", function () {
    var q = new QuartilePlot();
    var b = q._getBoundingBox();

    ok(b.left == 15, "Left");
    ok(b.top == 15, "Top");
    ok(b.right == 485, "Right");
    ok(b.bottom === 285, "Bottom");
});

test("_renderQuartilePlot()", function () {
    var q = new QuartilePlot();
    var data = [6, 7, 15, 36, 39, 40, 41, 42, 43, 47, 49]; //be sure to sort data!

    var scale = d3.scale.linear(); //for this test case, the scale is essentially absent because Domain = Range = [6,49].
    var firstQuartile = q._getScaledQuantileCallback(0.25, scale); //firstQuartile is a function!
    var thirdQuartile = q._getScaledQuantileCallback(0.75, scale); //also a function.

    /*console.log("first ", firstQuartile(data));
    console.log("third", thirdQuartile(data));*/

    ok(firstQuartile(data) == 25.5, "First quartile (simple)");
    ok(thirdQuartile(data) == 42.5, "Third quartile (simple)");
});


module('Sparkline');

test("Set data (Sparkline)", function () {
    var q = new Sparkline();
    ok(q._data instanceof Array, "_data 1");
    ok(q._data.length == 0, "_data.length 1");

    q.data([1, 2, 3, 4, 5]);

    ok(q._data instanceof Array, "_data 2");
    ok(q._data.length == 5, "_data.length 2");
    ok(q._data[0] == 1, "First element");
    ok(q._data[4] == 5, "Last element");
});

test("Set labels (Sparkline)", function () {
    var q = new Sparkline();
    ok(q._labels instanceof Array, "_labels 1");
    ok(q._labels.length == 0, "_labels.length 1");

    q.labels(["a", "b", "c", "d", "e"]);

    ok(q._labels instanceof Array, "_labels 2");
    ok(q._labels.length == 5, "_labels.length 2");
    ok(q._labels[0] == "a", "First element");
    ok(q._labels[4] == "e", "Last element");
});

test("_global() max (Sparkline)", function () {
    var q = new Sparkline();
    var a = [[3, 5], [1, 2]];
    var b = [4, 5, 6]

    ok(q._global(a, d3.min) == 1, "Min in 'a'");
    ok(q._global(a, d3.max) == 5, "Max in 'a'");
    ok(q._global(b, d3.min) == 4, "Min in 'b'");
    ok(q._global(b, d3.max) == 6, "Max in 'b'");
});

test("_getBoundingBox() defaults (Sparkline)", function () {
    var q = new Sparkline();
    var b = q._getBoundingBox();

    ok(b.left == 15, "Left");
    ok(b.top == 15, "Top");
    ok(b.right == 485, "Right");
    ok(b.bottom === 285, "Bottom");
});

//test("_renderSparkline()", function () {
//    var q = new Sparkline();
//    var data = [6, 7, 15, 36, 39, 40, 41, 42, 43, 47, 49]; //be sure to sort data!

//    var scale = d3.scale.linear(); //for this test case, the scale is essentially absent because Domain = Range = [6,49].
//    var firstQuartile = q._getScaledQuantileCallback(0.25, scale); //firstQuartile is a function!
//    var thirdQuartile = q._getScaledQuantileCallback(0.75, scale); //also a function.

//    /*console.log("first ", firstQuartile(data));
//    console.log("third", thirdQuartile(data));*/

//    ok(firstQuartile(data) == 25.5, "First quartile (simple)");
//    ok(thirdQuartile(data) == 42.5, "Third quartile (simple)");
//});

module("Box");

test("width()", function () {
    var b = new Box(50, 150);

    ok(b.left == 50);
    ok(b.right == 150);
    ok(b.width() == 100);
});