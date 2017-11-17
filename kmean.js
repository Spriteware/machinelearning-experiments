/* jshint esversion: 6 */

var Node = function(data) { 

    this.data     = data;
    this.centroid = undefined;
};

Node.prototype.randomValues = function(dimensions) {

    for (var dim = 0; dim < dimensions; dim++)
        this.data[dim] = Math.random();
};

var NodeList = function(dimensions) {

    this.dimensions = dimensions;
    this.nodes      = [];
    this.ranges     = [];
    this.centroids  = [];
};

NodeList.prototype.add = function(node) {

    this.nodes.push(node);
};

NodeList.prototype.calculateRanges = function() {  

    var i, l, dim;

    for (i = 0, l = this.nodes.length; i < l; i++)
    {
        for (dim = 0; dim < this.dimensions; dim++)
        {
            if (this.ranges[dim] === undefined)
                this.ranges[dim] = {min: _MAX_VALUE, max: _MIN_VALUE};

            if (this.nodes[i].data[dim] < this.ranges[dim].min)
                this.ranges[dim].min = this.nodes[i].data[dim];

            if (this.nodes[i].data[dim] > this.ranges[dim].max)
                this.ranges[dim].max = this.nodes[i].data[dim];
        }
    }
};

NodeList.prototype.normalizeValues = function(node) {

    var dim, min, delta;

    for (dim = 0; dim < this.dimensions; dim++)
    {
        min = this.ranges[dim].min;
        delta = this.ranges[dim].max - min;

        node.data[dim] = (node.data[dim] - min) / delta;
    }
};

NodeList.prototype.initCentroids = function(nb_clusters) {
    
    var i, dim, values;

    for (i = 0; i < nb_clusters; i++)
    {
        values = [];

        for (dim = 0; dim < this.dimensions; dim++)
            values.push( Math.random() );

        this.centroids[i] = new Node(values);
        this.centroids[i].id = i;
    }
};

NodeList.prototype.makeAssignments = function() {
    
    var i, l, dim, distance;
    var nearest_centroid, nearest_centroid_distance;

    var nb_centroids = this.centroids.length;

    for (i = 0, l = this.nodes.length; i < l; i++)
    {
        data = this.nodes[i].data;
        nearest_centroid = undefined;
        nearest_centroid_distance = undefined;

        for (j = 0; j < nb_centroids; j++)
        {
            distance = 0;

            for (dim = 0; dim < this.dimensions; dim++)
                distance += (this.centroids[j].data[dim] - data[dim]) * (this.centroids[j].data[dim] - data[dim]);

            if (nearest_centroid === undefined || distance < nearest_centroid_distance)
            {
                nearest_centroid = j;
                nearest_centroid_distance = distance;
            }
        }

        if (nearest_centroid === undefined)
            console.error("Warning: unable to find centroïd for node:", this.nodes[i]);
        else
            this.nodes[i].centroid = this.centroids[nearest_centroid];
    }
};

NodeList.prototype.moveCentroids = function() {

    this.makeAssignments();

    var i, j, l, dim, node;
    var nb_centroids   = this.centroids.length;
    var means_quantity = [];
    var means          = [];

    // Initialisation
    for (i = 0; i < nb_centroids; i++)
    {
        means_quantity[i] = 0;
        means[i] = [];

        for (dim = 0; dim < this.dimensions; dim++)
            means[i].push(0);
    }

    // Register every mean
    for (i = 0, l = this.nodes.length; i < l; i++)
    {
        node = this.nodes[i];
        means_quantity[node.centroid.id]++;

        for (dim = 0; dim < this.dimensions; dim++)
            means[node.centroid.id][dim] += node.data[dim];
    }

    // Compute mean
    for (i = 0; i < nb_centroids; i++)
    {
        if (means_quantity[i] === 0) {
            console.error("Warning: centroïd n=%d doesn't have any attached node (avoiding division by 0). New random values will be attached", i);
            this.centroids[i].randomValues(this.dimensions);
            continue;
        }

        for (dim = 0; dim < this.dimensions; dim++)
            this.centroids[i].data[dim] = means[i][dim] / means_quantity[i];
    } 
};

/******** MAIN *********/

var refresh = function(nodes_list) {

    nodes_list.moveCentroids();
    draw(nodes_list);
};

var draw = function(nodes_list) {

    var nodes = nodes_list.nodes.concat(nodes_list.centroids);

    var canvas  = document.querySelector("canvas");
    var ctx     = canvas.getContext("2d");
    var width   = canvas.width;
    var height  = canvas.height;
    var padding = 0;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "gray";
    ctx.fillStyle   = 'red';

    for (var i = 0, l = nodes.length; i < l; i++)
    {
        ctx.save();

        if (nodes[i].id === undefined) // centroid
            ctx.globalAlpha = 0.3;

        var x1 = nodes[i].data[0] * width;
        var y1 = height - nodes[i].data[1] * height;

        ctx.beginPath();
        ctx.arc(Math.round(x1), Math.round(y1), 8, 0, Math.PI*2, true);
        ctx.fill();

        // Draw connections
        if (nodes[i].centroid !== undefined) {

            var x2 = nodes[i].centroid.data[0] * (width-2*padding) + padding;
            var y2 = height - nodes[i].centroid.data[1] * (height-2*padding) + padding;
    
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.closePath();
        ctx.restore();
    }
};


var run = function() {

    var i, l, list = new NodeList(_DIMENSIONS);

    for (i = 0, l = data.length; i < l; i++)
        list.add( new Node(data[i] ));

    list.calculateRanges();

    for (i = 0, l = list.nodes.length; i < l; i++)
        list.normalizeValues(list.nodes[i]);

    list.initCentroids(_NB_CLUSTERS);
    draw(list);

    //////////////////////////////////////////

    window.addEventListener("load", function() {

        var canvas = document.querySelector("canvas");

        canvas.addEventListener("click", function(e) {

            // var x = (e.pageX - canvas.offsetLeft) * 2 - canvas.width;
            // var y = (e.pageY - canvas.offsetTop) * -2 + _CANVAS_HEIGHT;

            var dim1 = (e.clientX - canvas.offsetLeft) * 2 / canvas.width * (list.ranges[0].max - list.ranges[0].min) + list.ranges[0].min;
            var dim2 = (canvas.height - (e.clientY - canvas.offsetTop) * 2) / canvas.height * (list.ranges[1].max - list.ranges[1].min) + list.ranges[1].min;
            dim1 = Math.round(dim1 * 10) / 10;
            dim2 = Math.round(dim2 * 10) / 10;

            var node = new Node([dim1, dim2]);
            list.normalizeValues(node);
            list.add(node);

            console.log( e ) ;

            console.info("New node: ", node.data[0], node.data[1]);
            refresh(list);
        });

        canvas.addEventListener("contextmenu", function(e) {

            e.preventDefault();

            var dim1 = (e.clientX - canvas.offsetLeft) * 2 / canvas.width * (list.ranges[0].max - list.ranges[0].min) + list.ranges[0].min;
            var dim2 = (canvas.height - (e.clientY - canvas.offsetTop) * 2) / canvas.height * (list.ranges[1].max - list.ranges[1].min) + list.ranges[1].min;
            dim1 = Math.round(dim1 * 10) / 10;
            dim2 = Math.round(dim2 * 10) / 10;

            var centroid = new Node([dim1, dim2]);
            centroid.id = list.centroids.length;
            list.normalizeValues(centroid);
            list.centroids.push(centroid);

            console.info("New centroïd: ", centroid.data[0], centroid.data[1]);
            draw(list);
        });
    });

    window.addEventListener("keypress", function(e) {

        if (e.charCode === 32)
            refresh(list);
    });

    window.addEventListener("wheel", function(e) {
        refresh(list);
    });
};

/******** DATA *********/

const _NB_CLUSTERS = 3;
const _DIMENSIONS  = 2;
const _MAX_VALUE   = 1000000;
const _MIN_VALUE   = 0;

var data = [  
    [1, 2],
    [2, 1],
    [2, 4], 
    [1, 3],
    [2, 2],
    [3, 1],
    [1, 1],

    [7, 3],
    [8, 2],
    [6, 4],
    [7, 4],
    [8, 1],
    [9, 2],

    [10, 8],
    [9, 10],
    [7, 8],
    [7, 9],
    [8, 11],
    [9, 9],
];

run();