// Canvas and visualisation related constants
const _CANVAS_WIDTH = 1400;
const _CANVAS_HEIGHT = 800;
const _SHAPE_SCALING = 100;
const _SHAPE_PADDING = 200;

// Physics related constants
const _WHEEL_STEP = 20;
const _BALL_RADIUS = 40;
const _BALL_MASS = 50;
const _BALL_ELASTICITY = 0.4; // Ball can contract itself to (1 - _BALL_ELASTICITY) * size
const _BALL_FRICTION = 0.9;
const _GAME_GRAVITY = 0.1;
const _SPRING_MAX_THRESHOLD = 25;
const _SPRING_AIR_FRICTION = 3.5;
const _NORMAL_AIR_FRICTION = 0.001;
const _K = 0.1;

const X = 0, Y = 1;

// Brain hyperparameters
const _epochs = 100;
const _params = {
    libURI: "http://localhost/machinelearning/lib/neural-network.js",
    momentum: 0,
    lr: 0.001,
    layers: [2, 4, 4, 2],
    activation: "prelu",
    activationParams: {alpha: 0.01}
};

//////////////////////////////////////////////

var Ball = function(params) {
    
    params = params || {};

    this.pos = [params.x || 0, params.y || 0];
    this.vel = [0, 0];
    this.acc = [0, 0];

    this.radius = params.radius || _BALL_RADIUS;
    this.mass = params.mass || _BALL_MASS;
    this.elasticity = params.elasticity || _BALL_ELASTICITY;
    this.friction = params.friction || _BALL_FRICTION;
    this.contraction = 0;

    if (!this.mass)
        console.error("ERROR: invalid ball's mass", {ball: this});
};

Ball.prototype.gravity = function(angle) {

    return [_GAME_GRAVITY * Math.cos(angle) / this.mass, _GAME_GRAVITY * Math.sin(angle) / this.mass];
};

Ball.prototype.update = function(dt, follow) {

    // NF are forces that applies but we don't want into our acceleration
    var F = [0, 0], gravity = this.gravity(mouse.wheel);
    var add_acc = [0, 0], add_vel = [0, 0];

    // Add spring force between mouse and ball
    if (follow)
    {
        var l0 = Math.sqrt( (mouse.x - this.pos[X]) * (mouse.x - this.pos[X]) + (mouse.y - this.pos[Y]) * (mouse.y - this.pos[Y]));
        var f = -_K * (this.radius - l0);

        if (this.radius - l0 <= 0)
        {
            F[X] += f * (mouse.x - this.pos[X]) / l0 - _SPRING_AIR_FRICTION * this.vel[X];
            F[Y] += f * (mouse.y - this.pos[Y]) / l0 - _SPRING_AIR_FRICTION * this.vel[Y];

            // Apply threshold (to avoid really high forces, especially when dt drops down)
            F[X] = Math.abs(F[X]) >= _SPRING_MAX_THRESHOLD ? (F[X] > 0 ? _SPRING_MAX_THRESHOLD : -_SPRING_MAX_THRESHOLD) : F[X];
            F[Y] = Math.abs(F[Y]) >= _SPRING_MAX_THRESHOLD ? (F[Y] > 0 ? _SPRING_MAX_THRESHOLD : -_SPRING_MAX_THRESHOLD) : F[Y];
        }
    }

    // Pre-computing new movement for knowing position
    var acc = [this.acc[X], this.acc[Y]];
    var vel = [this.vel[X], this.vel[Y]];
    var pos = [this.pos[X], this.pos[Y]];

    for (var i = 0; i < 2; i ++)
    {
        acc[i] = F[i] / this.mass + gravity[i];
        vel[i] += acc[i] * dt;
        pos[i] += vel[i] * dt;
    }

    var limX = _CANVAS_WIDTH / 2 - this.radius;
    var limY = _CANVAS_HEIGHT / 2 - this.radius;
    var tmp = [this.vel[X], this.vel[Y]];

    // Bouncing
    if (this.pos[Y] >= limY) { // top
        tmp[Y] *= -this.elasticity;
        this.pos[Y] -= this.pos[Y] - limY;
    } else if (this.pos[Y] <= -limY) { // bottom
        tmp[Y] *= -this.elasticity;
        this.pos[Y] -= this.pos[Y] + limY;
    }
    
    if (this.pos[X] >= limX) { // left
        tmp[X] *= -this.elasticity;
        this.pos[X] -= this.pos[X] - limX;
    } else if (this.pos[X] <= -limX) { // right
        tmp[X] *= -this.elasticity;
        this.pos[X] -= this.pos[X] + limX;
    }

    // Apply new values
    this.vel[X] = tmp[X];
    this.vel[Y] = tmp[Y];

    for (i = 0; i < 2; i ++)
    {
        this.acc[i] = acc[i] + add_acc[i];
        this.vel[i] += this.acc[i] * dt;
        this.pos[i] += this.vel[i] * dt;
    }
};

function euclidian_distance(x, y) {
    return Math.sqrt( x*x + y*y );
}

function normalize(x) {
    return x > 0 ? Math.sqrt(x / 10) : -Math.sqrt(-x / 10);
}

function unormalize(x) {
    return x * x * 10;
}

//////////////////////////////////////////////

function init() {

    DOM.playground.width = _CANVAS_WIDTH;
    DOM.playground.height = _CANVAS_HEIGHT;

    ctx.translate(_CANVAS_WIDTH / 2, _CANVAS_HEIGHT / 2);
    ctx.scale(1, -1);
    ctx.globalAlpha = 0.6;    

    DOM.playground.addEventListener("mousedown", function(e) {

        e.preventDefault();
        e.stopPropagation();

        mouse.click = true;
    }); 
    
    DOM.playground.addEventListener("mouseup", function(e) {

        e.preventDefault();
        e.stopPropagation();

        mouse.click = false;
    });

    DOM.playground.addEventListener("mouseout", function(e) {
        
        e.stopPropagation();
        e.preventDefault();
        
        mouse.click = false;
    });

    DOM.playground.addEventListener("mousemove", function(e) {

        e.preventDefault();
        e.stopPropagation();

        mouse.x = (e.pageX - DOM.playground.offsetLeft) * 2 - _CANVAS_WIDTH / 2;
        mouse.y = (e.pageY - DOM.playground.offsetTop) * -2 + _CANVAS_HEIGHT / 2;
    });

    DOM.playground.addEventListener("wheel", function(e) {

        e.preventDefault();
        mouse.wheel += e.deltaY / _WHEEL_STEP / 180 * Math.PI;
    });

    window.addEventListener("keydown", function(e) {
        
        if (e.keyCode === 32) // spacebar
        {
            e.stopPropagation();
            e.preventDefault();
            DOM.backpropagationCheckbox.click();
        }
    });

    DOM.learningRateRange.addEventListener("input", function(e) {

        brain.lr = 1 / (e.target.value * e.target.value + 1);
        DOM.learningRateOutput.innerHTML = brain.lr.toFixed(8);
    });
}

function update() {

    requestAnimationFrame(function() { update(); });

    var now = Date.now(), dt = now - time;
    var gravity = ball.gravity(mouse.wheel);

    dt = dt > 50 ? 50 : dt; // temporary fix for bouncing due to changing tab

    // Update ball coords at high frqency
    time = now;
    ball.update(dt, mouse.click);

    //////////////////////////////////////////

    // Build inputs / targets
    var inputs = [normalize(ball.acc[X]), normalize(ball.acc[Y])];
    var targets = [normalize(gravity[X]), normalize(gravity[Y])];
    
    // Feeforward NN with normalized inputs
    var neurons = brain.feed(inputs);
    outputs = [unormalize(neurons[X].output), unormalize(neurons[Y].output)];
    
    // Build training data (as string) for future exportation
    Utils.static.addIntoTraining(inputs, targets);

    if (DOM.backpropagationCheckbox.checked === true)
        brain.backpropagate(targets);

    // Update global error display
    DOM.globalError.innerHTML = (brain.globalError * _CANVAS_WIDTH).toFixed(6);
    
    // Update Network SVG Vizualisation
    brain.visualize(inputs);

    //////////////////////////////////////////
    
    ctx.clearRect(-_CANVAS_WIDTH / 2, -_CANVAS_HEIGHT / 2, _CANVAS_WIDTH, _CANVAS_HEIGHT);

    var d1 = euclidian_distance(gravity[X], gravity[Y]), d2 = euclidian_distance(ball.acc[X], ball.acc[Y]);

    // Draw gravity
    ctx.save();
    ctx.fillStyle = "#638fd4";
    ctx.rotate(-Math.atan2(gravity[X], gravity[Y]));
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, _SHAPE_SCALING * d1 + _SHAPE_PADDING);
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.restore();

    // Draw ball acceleration
    ctx.save();
    ctx.fillStyle = "#C97373";
    ctx.rotate(-Math.atan2(ball.acc[X], ball.acc[Y]));
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, _SHAPE_SCALING * d2 + (d1 > d2 ? _SHAPE_PADDING * d2 / d1 : _SHAPE_PADDING) );
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.restore();

    var x = unormalize(outputs[X]);
    var y = unormalize(outputs[Y]);

    // Draw ball acceleration
    if (neurons)
    {
        var d3 = euclidian_distance(x, y);

        ctx.save();
        ctx.fillStyle = "purple";
        ctx.rotate(-Math.atan2(x, y));
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, _SHAPE_SCALING * d3 + _SHAPE_PADDING );
        ctx.lineTo(10, 0);
        ctx.fill();
        ctx.restore();   
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.pos[X], ball.pos[Y], ball.radius, 0, Math.PI * 2, false);
    ctx.stroke();

    // Update acceleration output
    DOM.accelerationOutputs[X].innerHTML = (inputs[X]).toFixed(4);
    DOM.accelerationOutputs[Y].innerHTML = (inputs[Y]).toFixed(4);
}


var DOM, ctx, mouse, ball, brain, time;
var outputs = [0, 0];

window.onload = function() {

    DOM = {
        playground: document.querySelector("#playground"),
        accelerationOutputs: document.querySelectorAll("#acceleration_outputs span"),
        globalError: document.querySelector("#global_error span"),
        backpropagationCheckbox: document.querySelector("#backpropagate"),  
        learningRateRange: document.querySelector("#learning_rate input[type='range']"),
        learningRateOutput: document.querySelector("#learning_rate span")
    };

    ctx = DOM.playground.getContext("2d");

    time = Date.now();
    mouse = {x: 1, y: 2, click: false, wheel: -Math.PI/2};
    ball = new Ball();
    brain = new Network(_params);
    
    DOM.learningRateOutput.innerHTML = brain.lr;

    ///////////////////////////////////////////

    // Initial training
    if (typeof training_data_imported !== 'undefined' && training_data_imported !== undefined)
    {
        // document.body.appendChild(brain.train({
        //     data: training_data_imported,
        //     epochs: _epochs,
        //     visualize: true,
        //     recurrent: true
        // }));
    }

    document.body.appendChild( brain.createVisualization() );

    init();
    update();
};

/* TODO
    - mouse scroll is not the same in Firefox as in Chrome
    - implémenter PReLu
*/
