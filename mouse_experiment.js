"use strict";

const _TRAINING_SIZE_MAX = 10000;
const _CANVAS_WIDTH  = 1000;
const _CANVAS_HEIGHT = 600;
const _CIRCLE_RADIUS = 50;
const _POINT_RADIUS = 8;

const _epochs = 200;
const _params = {
    libURI: "http://localhost/machinelearning/lib/neural-network.js",
    activation: "linear",
    // activationParams: {alpha: 0.1},
    momentum: 0.0,
    lr: 0.05,
    layers: [2, 3, 2],

    // layers: [2, 4, 4, 4, 2],
    // layers: [2, 5, 1, 5, 2]
    // layers: [2, 15, 15, 15, 2]
    // layers: [2, 3, 4, 5, 6, 5, 4, 3, 2]
    // layers: [2, 40, 2]
    // Find additionnal good hyperparameters configurations below in the code
};

//////////////////////

function init() {

    DOM.canvas.width = _CANVAS_WIDTH;
    DOM.canvas.height = _CANVAS_HEIGHT;

    ctx.translate(_CANVAS_WIDTH / 2, _CANVAS_HEIGHT / 2);
    ctx.scale(1, -1);

    DOM.canvas.addEventListener("mousemove", function(e) {
        mouse.x = (e.pageX - DOM.canvas.offsetLeft) * 2 - _CANVAS_WIDTH / 2;
        mouse.y = (e.pageY - DOM.canvas.offsetTop) * -2 + _CANVAS_HEIGHT / 2;
        mouse.refresh = true;
    });

    DOM.dropoutButton.addEventListener("click", function(e) {
        brain.dropout();
    });

    DOM.trainButton.addEventListener("click", function(e) {
        
        // Initial training
        if (typeof training_data_imported !== 'undefined' && training_data_imported !== undefined)
            DOM.trainButton.parentElement.appendChild( brain.train(training_data_imported, _epochs, true) ); // second parameter is number of epochs
        else 
            alert("No training data available");
    });

    window.addEventListener("keydown", function(e) {

        if (e.keyCode === 32) // spacebar
        {
            e.stopPropagation();
            e.preventDefault();
            DOM.backpropagationCheckbox.click();
        }
    });
}

function update() {

    if (safe !== true) {
        console.info("Script successfully stopped");
        return;
    }

    requestAnimationFrame(function() { update(); });
    ctx.clearRect(-_CANVAS_WIDTH / 2, -_CANVAS_HEIGHT / 2, _CANVAS_WIDTH, _CANVAS_HEIGHT);
    
    ///////////////////// OWN LIBRAIRY JS //////////////////

    // Feeforward NN
    try {

        var inputs = [mouse.x / norm_x, mouse.y / norm_y];
        var targets = [mouse.x / norm_x, mouse.y / norm_y];
        var neurons = brain.feed(inputs);

        // Build training data (as string) for future exportation
        if (training_size <= _TRAINING_SIZE_MAX) {
            training_data += inputs[0] + " " + inputs[1] + " : " + targets[0] + " " + targets[1] + "\\\n"; 
            training_size++;
        }

        if (DOM.backpropagationCheckbox.checked === true)
            brain.backpropagate(targets);
    
    } catch(ex) {
        safe = false;
        console.error(ex);
        return;
    }
            
    // Draw mouse 
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, _POINT_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    // Draw circle
    ctx.beginPath();
    ctx.arc(neurons[0].output * norm_x, neurons[1].output * norm_y, _CIRCLE_RADIUS, 0, Math.PI * 2, false);
    ctx.stroke();

    // Update global error display
    DOM.globalError.innerHTML = (brain.globalError).toFixed(6);

    // Update Network SVG Vizualisation
    brain.visualize(inputs);
}

var safe = true, DOM, ctx, mouse, brain, training_data = "", training_size = 0;
var norm_x = _CANVAS_WIDTH / 2;
var norm_y = _CANVAS_HEIGHT / 2;

window.onload = function() {

    DOM = {
        canvas: document.querySelector("canvas"),
        globalError: document.querySelector("#global_error span"),
        backpropagationCheckbox: document.querySelector("#backpropagate"),
        trainButton: document.querySelector("#train"),
        dropoutButton: document.querySelector("#dropout"),
    };

    ctx = DOM.canvas.getContext("2d");

    mouse = {x: 1, y: 2, refresh: false};
    brain = new Network(_params);

    // # good-config 1:
    // lr: 0.005, // we can up to 0.1
    // layers: [2, 3, 2],
    // hiddenLayerFunction: "linear",
    
    // #good-config 2:
    // lr: 0.0005,
    // layers: [2, 4, 4, 4, 2],
    // hiddenLayerFunction: "linear",

    // #not-so-good-but-okay-config 3: (using tanh)
    // lr: 0.04,
    // layers: [2, 4, 2], // layers ddoesn't change things too much
    // hiddenLayerFunction: "tanh",

    // #good-config 4, epochs=200
    // lr: 0.001,
    // layers: [2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 2],
    // hiddenLayerFunction: "linear",

    // Update activation function for hiddens layer:
    // brain.setHiddenLayerToActivation(brain.static_tanhActivation, brain.static_tanhDerivative);
    // brain.setHiddenLayerToActivation(brain.static_sigmoidActivation, brain.static_sigmoidDerivative);
    // brain.setHiddenLayerToActivation(brain.static_reluActivation, brain.static_reluDerivative);

    document.body.appendChild( brain.createVisualization() );
    
    init();
    update();
};

