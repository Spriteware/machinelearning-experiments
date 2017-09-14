const _NB_POINTS = 200;
const _CANVAS_WIDTH = 600;
const _CANVAS_HEIGHT = 600;
const _POINT_RADIUS = 8;

var Perceptron = function(n) {

    this.lr = 0.01;
    this.weights = [];
    this.randomWeights(n);
};

Perceptron.prototype.randomWeights = function(n) {

    if (n === undefined)
        console.error("ERROR: undefined weights quantity");

    this.weights = [];
    while(n--)
        this.weights.push(Math.random() * 2 - 1);
};

Perceptron.prototype.guess = function(inputs) {
    
    var sum = 0;

    for (var i = 0, l = this.weights.length; i < l; i++)
        sum += inputs[i] * this.weights[i];

    return sum > 0 ? 1 : -1;
};

Perceptron.prototype.guessY = function(x) {

    var w = this.weights;
    return -(w[0]/w[1]) * x - (w[2]/w[1]); 
};

Perceptron.prototype.train = function(inputs, target) {
    
    var guess = this.guess(inputs);
    var error = target - guess;

    for (var i = 0, l = this.weights.length; i < l; i++)
        this.weights[i] += error * inputs[i] * this.lr;
};

////////////////////////////////////////////

var Point = function() {

    this.x = Math.random() * _CANVAS_WIDTH - _CANVAS_WIDTH / 2;
    this.y = Math.random() * _CANVAS_HEIGHT - _CANVAS_HEIGHT / 2;
    this.biais = 1;
    this.flag = this.train(training_function);
};

Point.prototype.train = function(f) {
    
    return this.y > f(this.x) ? 1 : -1;
};

//////////////////////////////////////////////

function create() {

    for (var pts = [], i = 0; i < _NB_POINTS; i++) 
        pts.push( new Point() );

    return pts;
}

function init() {

    ctx.translate(_CANVAS_WIDTH / 2, _CANVAS_HEIGHT / 2);
    ctx.scale(1, -1);
}

function update() {

    setTimeout(function() { update(); }, 100);

    var mid_w = _CANVAS_WIDTH / 2;
    var mid_h = _CANVAS_HEIGHT / 2;

    ctx.clearRect(-mid_w, -mid_h, _CANVAS_WIDTH, _CANVAS_HEIGHT);

    // Update one point
    pt = points[index];
    inputs = [pt.x, pt.y, pt.biais];
    brain.train(inputs, pt.flag);
    index = (index + 1) % points.length; 

    // Draw line
    ctx.beginPath();
    ctx.moveTo(-mid_w, training_function(-mid_h));
    ctx.lineTo(mid_w, training_function(mid_h));
    ctx.stroke();

    // Draw guessed line
    ctx.beginPath();
    ctx.moveTo(-mid_w, brain.guessY(-mid_h));
    ctx.lineTo(mid_w, brain.guessY(mid_h));
    ctx.stroke();

    // Draw points
    var i, l, pt, inputs, trained = false;

    for (i = 0, l = points.length; i < l; i++)
    {
        pt = points[i];
        inputs = [pt.x, pt.y, pt.biais];

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, _POINT_RADIUS, 0, Math.PI * 2, false);
 
        if (brain.guess(inputs) !== pt.flag) {
            if (!trained) {
                brain.train(inputs, pt.flag);
                trained = true;
            }

            ctx.fillStyle = "red";
        }

        else {
            ctx.fillStyle = pt.flag === 1 ? "black" : "transparent";
        }

        ctx.fill();
        ctx.stroke();
    }
}

function training_function(x) {
    return 0.2 * x + 3;
}

var brain = new Perceptron(3);
var points = create();
var index = 0;

var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");

window.onload = function() {
    
    init();
    update();
};