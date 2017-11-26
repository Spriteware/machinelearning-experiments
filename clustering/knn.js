/* jshint esversion: 6 */

var Node = function(object) {

    for (var key in object)
        this[key] = object[key];
};

Node.prototype.createNeighbors = function(k) {

    this.neighbors = [];
    for (var i = 0; i < k; i++)
        this.neighbors[i] = undefined;
};

Node.prototype.guessType = function() {

    var n, types = {};

    for (var i = 0, l = this.neighbors.length; i < l; i++)
    {
        n = this.neighbors[i];

        if (n === undefined) {
            console.error("Warning: undefined neighbor[%d]", i);
            continue;
        }

        if (!types[n.type])
            types[n.type] = 0;

        types[n.type] += 1;
    }

    var guess = {type: undefined, count: 0};
    for (var type in types)
    {
        if (types[type] > guess.count)
        {
            guess.type = type;
            guess.count = types[type];

        }
    }

    this.type = parseInt(guess.type);
    console.log("guess:", guess);
};


var NodeList = function(k) {

    this.nodes = [];
    this.k     = k;
    this.area  = undefined;
    this.rooms = undefined;
};

NodeList.prototype.add = function(node) {

    this.nodes.push(node);
};

NodeList.prototype.calculateRanges = function() {  

    this.area = {min: 1000000, max: 0};
    this.rooms = {min: 1000000, max: 0};

    for (var i = 0, l = this.nodes.length; i < l; i++)
    {
        if (this.nodes[i].rooms < this.rooms.min)
            this.rooms.min = this.nodes[i].rooms;

        if (this.nodes[i].rooms > this.rooms.max)
            this.rooms.max = this.nodes[i].rooms;

        if (this.nodes[i].area < this.area.min)
            this.area.min = this.nodes[i].area;

        if (this.nodes[i].area > this.area.max)
            this.area.max = this.nodes[i].area;
    }
};

NodeList.prototype.normalizeValues = function(node) {

    var rmin = this.rooms.min, rdelta = this.rooms.max - this.rooms.min;
    var amin = this.area.min, adelta = this.area.max - this.area.min;

    node.rooms = (node.rooms - rmin) / rdelta;
    node.area = (node.area - amin) / adelta;
};

NodeList.prototype.determineUnknown = function(node) {

    node.createNeighbors(this.k);
    this.normalizeValues(node);

    var d1, d2, i, j, k, l, tmp;

    for (i = 0, l = this.nodes.length; i < l; i++)
    {
        tmp = this.nodes[i];
        d1 = Math.sqrt((tmp.rooms - node.rooms)*(tmp.rooms - node.rooms) + (tmp.area - node.area)*(tmp.area - node.area));

        for (j = 0, k = node.neighbors.length; j < k; j++)
        {
            if (node.neighbors[j] === undefined) {
                node.neighbors.splice(j, 0, this.nodes[i]);
                node.neighbors.pop();
                break;
            }

            tmp = node.neighbors[j];
            d2 = Math.sqrt((tmp.rooms - node.rooms)*(tmp.rooms - node.rooms) + (tmp.area - node.area)*(tmp.area - node.area));

            if (d1 <= d2) {
                node.neighbors.splice(j, 0, this.nodes[i]);
                node.neighbors.pop();
                break;
            }
        }
    }

    node.guessType();
    this.add(node);
};



var draw = function(nodes_list) {

    var nodes = nodes_list.nodes;

    var canvas = document.querySelector("canvas");
    var ctx    = canvas.getContext("2d");
    var width  = canvas.width;
    var height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0, l = nodes.length; i < l; i++)
    {
        ctx.save();

        switch (nodes[i].type)
        {
            case _APARTMENT_:
                ctx.fillStyle = 'red';
                break;
            case _HOUSE_:
                ctx.fillStyle = 'green';
                break;
            case _FLAT_:
                ctx.fillStyle = 'blue';
                break;
            default:
                ctx.fillStyle = '#666666';
        }

        if (nodes[i].undefined === true)
            ctx.globalAlpha = 0.3;

        var x = nodes[i].rooms * width;
        var y = height - nodes[i].area * height;

        ctx.translate(Math.round(x), Math.round(y));
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI*2, true);
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
};

var run = function() {

    var i, l, list = new NodeList(3);

    for (i in data)
        list.add( new Node(data[i] ));

    list.calculateRanges();

    for (i = 0, l = list.nodes.length; i < l; i++)
        list.normalizeValues(list.nodes[i]);

    draw(list);

    //////////////////////////////////////////

    window.addEventListener("load", function () {


        var canvas = document.querySelector("canvas");
        canvas.addEventListener("click", function(e) {

            var rooms = (e.clientX - canvas.offsetLeft) * 2 / canvas.width * (list.rooms.max - list.rooms.min) + list.rooms.min;
            var area = (canvas.height - (e.clientY - canvas.offsetTop) * 2) / canvas.height * (list.area.max - list.area.min) + list.area.min;
            rooms = Math.round(rooms * 10) / 10;
            area = Math.round(area * 10) / 10;
            
            var node = new Node({ rooms: rooms, area: area, undefined: true });
            console.log("New node:", node);

            list.determineUnknown(node);
            draw(list);
        });
    });
};

/******** DATA *********/
const _APARTMENT_ = 1;
const _HOUSE_     = 2;
const _FLAT_      = 3;

var data = [
    { rooms: 1, area: 350, type: _APARTMENT_ },
    { rooms: 2, area: 300, type: _APARTMENT_ },
    { rooms: 3, area: 300, type: _APARTMENT_ },
    { rooms: 4, area: 250, type: _APARTMENT_ },
    { rooms: 4, area: 500, type: _APARTMENT_ },
    { rooms: 4, area: 400, type: _APARTMENT_ },
    { rooms: 5, area: 450, type: _APARTMENT_ },
    { rooms: 7, area: 800, type: _HOUSE_ },
    { rooms: 7, area: 900, type: _HOUSE_ },
    { rooms: 7, area: 1200, type: _HOUSE_ },
    { rooms: 8, area: 1500, type: _HOUSE_ },
    { rooms: 9, area: 1300, type: _HOUSE_ },
    { rooms: 8, area: 1240, type: _HOUSE_ },
    { rooms: 10, area: 1700, type: _HOUSE_ },
    { rooms: 9, area: 1000, type: _HOUSE_ },
    { rooms: 1, area: 800, type: _FLAT_ },
    { rooms: 3, area: 900, type: _FLAT_ },
    { rooms: 2, area: 700, type: _FLAT_ },
    { rooms: 1, area: 900, type: _FLAT_ },
    { rooms: 2, area: 1150, type: _FLAT_ },
    { rooms: 1, area: 1000, type: _FLAT_ },
    { rooms: 2, area: 1200, type: _FLAT_ },
    { rooms: 1, area: 1300, type: _FLAT_ },
];

run();