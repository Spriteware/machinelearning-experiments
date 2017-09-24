const _CANVAS_WIDTH = 1400;
const _CANVAS_HEIGHT = 800;
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

var Utils = {
    static: {}
};

Utils.static.norm = function(x, y) {

    return Math.sqrt( x*x + y*y );
};

Utils.static.exportTrainingData = function() {

    console.info("Saving training data...", "Reading 'training_data'");

    var output = document.createElement("textarea");
    output.setAttribute("disabled", "disabled");
    output.innerHTML = "var training_data_imported = " + JSON.stringify(training_data, null, '\t') + ";";

    document.body.appendChild( output );

    return "Export completed for " + training_data.length + " entries.";
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
    // setTimeout(function() { update(); }, 40);

    var SCALING = 100, PADDING = 200;
    var now = Date.now(), dt = now - time;
    var gravity = ball.gravity(mouse.wheel);
    
    // Update ball coords at high frqency
    time = now;
    ball.update(dt, mouse.click);

    //////////////////////////////////////////

    // Build inputs / targets
    var inputs = [ball.acc[X] * SCALING, ball.acc[Y] * SCALING];
    var targets = [gravity[X] * SCALING, gravity[Y] * SCALING];
    training_data_max = training_data_max < Math.abs(inputs[X]) ? Math.abs(inputs[X]) : training_data_max;
    training_data_max = training_data_max < Math.abs(inputs[Y]) ? Math.abs(inputs[Y]) : training_data_max;
    
    // Feeforward NN with normalized inputs
    var normalized_inputs = [inputs[X] / training_data_max, inputs[Y] / training_data_max];
    var neurons = brain.feed(inputs);

    if (DOM.backpropagationCheckbox.checked === true)
        brain.backpropagate(targets);

    // Build training data for future exportation
    training_data.push({
        inputs: inputs,
        targets: targets
    });

    // Update global error display
    DOM.globalError.innerHTML = (brain.globalError * _CANVAS_WIDTH).toFixed(6);
    
    // Update Network SVG Vizualisation
    brain.visualize(normalized_inputs);

    //////////////////////////////////////////
    
    ctx.clearRect(-_CANVAS_WIDTH / 2, -_CANVAS_HEIGHT / 2, _CANVAS_WIDTH, _CANVAS_HEIGHT);

    var d1 = Utils.static.norm(gravity[X], gravity[Y]), d2 = Utils.static.norm(ball.acc[X], ball.acc[Y]);

    // Draw gravity
    ctx.save();
    ctx.fillStyle = "#638fd4";
    ctx.rotate(-Math.atan2(gravity[X], gravity[Y]));
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, SCALING * d1 + PADDING);
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.restore();

    // Draw ball acceleration
    ctx.save();
    ctx.fillStyle = "#C97373";
    ctx.rotate(-Math.atan2(ball.acc[X], ball.acc[Y]));
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(0, SCALING * d2 + (d1 > d2 ? PADDING * d2 / d1 : PADDING) );
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.restore();

    // Draw ball acceleration
    if (neurons)
    {
        var d3 = Utils.static.norm(neurons[X].output, neurons[Y].output);
        // console.log( neurons[X].output, neurons[Y].output );
        ctx.save();
        ctx.fillStyle = "purple";
        ctx.rotate(-Math.atan2(neurons[X].output, neurons[Y].output));
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(0, SCALING * d3 + PADDING );
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
var training_data = [], training_data_max = 0;

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
    brain = new Network({
        lr: 0.00000001,
        momentum: 0,
        // layers: [2, 5, 5, 2]
        layers: [2, 5, 6, 7, 6, 5, 2]
    });
    
    DOM.learningRateOutput.innerHTML = brain.lr;
    
    ///////////////////////////////////////////

    // Initial training
    if (typeof training_data_imported !== 'undefined' && training_data_imported !== undefined)
    {
        console.info("Detected training data: importation in processing...");
        var epoch, i, l, inputs = [null, null], sum = 0, mean;

        // Create canvas
        var graph_width = 400, graph_height = 100;
        var graph = document.createElement("canvas");
        graph.setAttribute("width", graph_width);
        graph.setAttribute("height", graph_height);
        document.body.appendChild( graph );

        // Create global error mean output
        var global_errors_mean_output = document.createElement("samp");
        document.body.appendChild( global_errors_mean_output ); 

        var graph_ctx = graph.getContext("2d");
        var global_errors = [];
        var global_errors_sum = 0;
        var max_global_error = 0;
        var _EPOCHS = 10;

        // Normalize
        for (i = 0, l = training_data_imported.length; i < l; i++)
            sum += Math.abs(training_data_imported[i].inputs[X]) + Math.abs(training_data_imported[i].inputs[Y]);

        mean = sum / (l * training_data_imported[0].length); // generic formula

        graph_ctx.scale(graph_width / (_EPOCHS * l), 1);
        graph_ctx.globalAlpha = 0.5;

        // Feeforward NN
        for (epoch = 0; epoch < _EPOCHS; epoch++)
        {
            for (i = 0; i < l; i++)
            {
                // TODO: use normalized ? 

                brain.feed(training_data_imported[i].inputs);
                brain.backpropagate(training_data_imported[i].targets);
                
                global_errors.push( brain.globalError );
                global_errors_sum += brain.globalError;
                max_global_error = brain.globalError > max_global_error ? brain.globalError : max_global_error;
            }
        }

        var global_errors_mean = global_errors_sum / (_EPOCHS * l); 

        // Update graph
        requestAnimationFrame(function() {

            var g, gel = global_errors.length, sum = 0, std_deviation;

            // Compute standart deviation
            for (g = 0; g < gel; g++)
                sum += (global_errors[g] - global_errors_mean) * (global_errors[g] - global_errors_mean);
            std_deviation = Math.sqrt(sum / gel); 

            // console.log( (brain.globalError * _CANVAS_WIDTH).toFixed(6) );
            graph_ctx.clearRect(0, 0, graph_width, graph_height);
            graph_ctx.beginPath();
            graph_ctx.moveTo(0, graph_height);

            for (g = 0; g < gel; g++) {

                // If not in confidence interval, we do not display
                if (global_errors[g] > global_errors_mean - std_deviation && global_errors[g] < global_errors_mean + std_deviation)
                    graph_ctx.lineTo(g, graph_height - global_errors[g] / global_errors_mean * graph_height * 0.2);
            }

            graph_ctx.lineTo(g, graph_height);
            graph_ctx.closePath();
            graph_ctx.fill();

            global_errors_mean_output.innerHTML = "global error mean: " + global_errors_mean;
        
        });

        console.info("Done. Gone thru %d epochs", epoch);
    }

    ///////////////////////////////////////////

    document.body.appendChild( brain.createVisualization() );

    init();
    update();
};

/*

    Observation 1: lorsque je drag la ball avec la souris, l'accélération augmente de ouf et donc l'erreur globale aussi.
    Si je restreint le learning rate, alors le réseau n'apprend rien de manière générale.
    Il faut trouver comment limiter l'explosition des erreurs et des weights. Je cherche vers la régularization des weights, notemment weight penalty L2
    Lecture avec explications: http://www.cs.toronto.edu/~tijmen/csc321/slides/lecture_slides_lec9.pdf

    Explications activations functions et regularization: 
    http://lamda.nju.edu.cn/weixs/project/CNNTricks/CNNTricks.html

*/ 