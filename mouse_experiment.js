"use strict"; // jshint ignore: line 

const _CANVAS_WIDTH  = 1000;
const _CANVAS_HEIGHT = 600;
const _CIRCLE_RADIUS = 50;
const _POINT_RADIUS = 8;

var _epochs = 100;
var _dropout = false;
var _shuffle = true;

const _params = {
    libURI: "http://localhost/machinelearning/lib/neural-network.js",
    lr: 0.01,
    layers: [2, 3, 2],
    optimizer: "adam",
    optimizerParams: { alpha: 0.9, beta1: 0.9, beta2: 0.999 }, // 0.9 or more for adadelta
    activation: "prelu",
    activationParams: { alpha: 0.1 }
};

//////////////////////

function normalize(x) {
    return x >= 0 ? 1 - 1 / ((x + 1) * (x + 1)) : -1 + 1 / ((x - 1) * (x - 1));
}

function unormalize(x) {
    return x >= 0 ? Math.sqrt(1 / (1 - x)) - 1 : -Math.sqrt(1 / (1 + x)) + 1;
}


function init() {

    _DOM.canvas.width = _CANVAS_WIDTH;
    _DOM.canvas.height = _CANVAS_HEIGHT;

    _ctx.translate(_CANVAS_WIDTH / 2, _CANVAS_HEIGHT / 2);
    _ctx.scale(1, -1);

    _DOM.canvas.addEventListener("mousemove", function(e) {
        _mouse.x = (e.pageX - _DOM.canvas.offsetLeft) * 2 - _CANVAS_WIDTH / 2;
        _mouse.y = (e.pageY - _DOM.canvas.offsetTop) * -2 + _CANVAS_HEIGHT / 2;
        _mouse.refresh = true;
    });

    _DOM.dropoutButton.addEventListener("click", function(e) {
        _brain.dropout();
    });

    _DOM.trainButton.addEventListener("click", function (e) {

        // Initial training
        if (typeof _imported_training_set === "undefined" || _imported_training_set === undefined) {
            alert("No training data available. Check your var '_imported_training_set'");
            return;
        }

        var training_set = typeof _imported_training_set !== "undefined" ? Utils.static.parseTrainingData(_imported_training_set) : undefined;
        var validation_set = typeof _imported_validation_set !== "undefined" ? Utils.static.parseTrainingData(_imported_validation_set) : undefined;
        var test_set = typeof _imported_test_set !== "undefined" ? Utils.static.parseTrainingData(_imported_test_set) : undefined;

        // Launch training
        var graph = _brain.train({
            training_set: training_set,
            validation_set: validation_set,
            test_set: test_set,

            epochs: _epochs,
            dropout: _dropout,
            shuffle: _shuffle,
            visualize: true
        });

        // Add visualization
        _DOM.trainButton.parentElement.appendChild(graph);
    });


    window.addEventListener("keydown", function(e) {

        if (e.keyCode === 32) // spacebar
        {
            e.stopPropagation();
            e.preventDefault();
            _DOM.backpropagationCheckbox.click();
        }
    });
}

function update() {

    if (_safe !== true) {
        console.info("Script successfully stopped");
        return;
    }

    requestAnimationFrame(function() { update(); });
    _ctx.clearRect(-_CANVAS_WIDTH / 2, -_CANVAS_HEIGHT / 2, _CANVAS_WIDTH, _CANVAS_HEIGHT);
    
    ///////////////////// OWN LIBRAIRY JS //////////////////

    var inputs, targets, neurons;

    try {

        // Yes theses inputs are normalized but it doesn't do nothing on this experiment.
        // This was put in place in order to test training with normalized inputs; useful for ball_experiment
        // The function 'normalize' impacts performance on this experimentation but the point is more to ensure that such a function can work.

        inputs = [normalize(_mouse.x / norm_x), normalize(_mouse.y / norm_y)];
        targets = [normalize(_mouse.x / norm_x), normalize(_mouse.y / norm_y)];
        // inputs = [mouse.x / norm_x, mouse.y / norm_y];
        // targets = [mouse.x / norm_x, mouse.y / norm_y];
        neurons = _brain.feed(inputs);

        if (_DOM.backpropagationCheckbox.checked === true)
            _brain.backpropagate(targets);

        // Build training data (as string) for future exportation
        Utils.static.addIntoTraining(inputs, targets);
    
    } catch(ex) {
        _safe = false;
        console.error(ex);
        return;
    }
            
    // Draw mouse 
    _ctx.beginPath();
    _ctx.arc(_mouse.x, _mouse.y, _POINT_RADIUS, 0, Math.PI * 2, false);
    _ctx.fill();

    // Draw circle
    _ctx.beginPath();
    // ctx.arc(neurons[0].output * norm_x, neurons[1].output * norm_y, _CIRCLE_RADIUS, 0, Math.PI * 2, false);
    _ctx.arc(unormalize(neurons[0].output) * norm_x, unormalize(neurons[1].output) * norm_y, _CIRCLE_RADIUS, 0, Math.PI * 2, false);
    _ctx.stroke();

    // Update global error display
    _DOM.globalError.innerHTML = (_brain.globalError).toFixed(6);

    // Update Network SVG Vizualisation
    _brain.visualize(inputs);
}

var _safe = true, _DOM, _ctx, _mouse, _brain;
var norm_x = _CANVAS_WIDTH / 2;
var norm_y = _CANVAS_HEIGHT / 2;

window.onload = function() {

    _DOM = {
        canvas: document.querySelector("canvas"),
        globalError: document.querySelector("#global_error span"),
        backpropagationCheckbox: document.querySelector("#backpropagate"),
        trainButton: document.querySelector("#train"),
        dropoutButton: document.querySelector("#dropout"),
    };

    _ctx = _DOM.canvas.getContext("2d");

    _mouse = {x: 1, y: 2, refresh: false};
    _brain = new Network(_params);

    //////////////////////////////////////////////

    document.body.appendChild( _brain.createVisualization() );
    
    init();
    update();
};

