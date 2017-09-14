const _CANVAS_WIDTH = 1000;
const _CANVAS_HEIGHT = 600;
const _POINT_RADIUS = 8;
const _CIRCLE_RADIUS = 15;
const _STROKE_WIDTH = 4;

function Exception(message, variables) {
    console.error("ERROR: " + message, variables);
}

function activation(x) {
    // return Math.tanh(x);
    return x;
}

function derivative(x) {
    // return 1 / (Math.cosh(x) * Math.cosh(x));
    return 1;
}

function randomBiais() {
    return Math.random() * 0.2 - 0.1;
}

function randomWeight() {
    return Math.random() * 2 - 1;
}

function tooltipOn(event, object) {
    
    DOM.tooltip.object = object;
    DOM.tooltip.setAttribute("class", "");
    DOM.tooltip.style.left = (event.pageX+10) + "px";
    DOM.tooltip.style.top = (event.pageY+5) + "px";

    tooltipUpdate(object);
}

function tooltipUpdate(object) {

    if (typeof object !== "object") {
        DOM.tooltip.innerHTML = object;
        return;
    }

    var buffer = "";

    for (var key in object) 
        if (object.hasOwnProperty(key) && typeof object[key] !== "function")
            buffer += key + ": " + object[key] + "<br />";

    DOM.tooltip.innerHTML = buffer;
}    

function tooltipOff(event, object) {
    
    DOM.tooltip.object = undefined;
    DOM.tooltip.setAttribute("class", "off");
}

////////////////////////////////////////////


var Neuron = function(id, layer, biais) {

    this.id = id;
    this.layer = layer;
    this.biais = biais || 0;

    this.output = undefined;
    this.error = undefined;
    this.activation = activation;
    this.derivative = derivative;
};

////////////////////////////////////////////

var Network = function(params) {

    this.lr = undefined; // Learning rate
    this.threshold = undefined; // Error threshold

    this.layers  = undefined;
    this.neurons = undefined;
    this.weights = undefined;

    // Caching variables :
    this.layersSum = undefined;
    this.layersMul = undefined;
    this.nbLayers  = undefined;
    this.nbNeurons = undefined;
    this.nbWeights = undefined;

    // Stats-purpose :
    this.maxWeight = 0;
    this.globalError = 0;
    this.weightsPerNeuron = 0;

    this.loadParams(params);
    this.initialize();
    this.createVizualisation();
};

Network.prototype.loadParams = function(params) {

    for (var key in params)
        if (this.hasOwnProperty(key) && this[key] === undefined)
            this[key] = params[key];

    console.log("loaded params", this);    
};

Network.prototype.initialize = function() {

    if (this.layers === undefined || this.layers.length <= 0)
        throw new Exception("Undefined or unsificient layers", {layers: this.layers});
    
    var i, sum = 0, mul = 1;
    var curr_layer = 0;

    // Initialization
    this.nbLayers = this.layers.length;
    this.layersSum = [];
    this.layersMul = [];
    this.neurons = [];
    this.weights = [];

    // Prepare layers relative computation
    for (i = 0; i < this.nbLayers; i++) {
        sum += this.layers[i];
        mul = (this.layers[i-1] || 0) * this.layers[i];
        this.layersSum.push(sum);
        this.layersMul.push(mul + (this.layersMul[i-1] || 0)); 
        // [0] will be 0, Because layerMul is used to know how many weights there is before a layer, and there is no before layer 0
    }

    // Create neurons
    this.nbNeurons = sum;

    for (i = 0; i < sum; i++)
        this.neurons.push( new Neuron(i, i >= this.layersSum[curr_layer] ? ++curr_layer : curr_layer, randomBiais()) );

    // Create weights
    this.nbWeights = this.layersMul[this.layersMul.length-1];

    for (i = 0; i < this.nbWeights; i++)
        this.weights.push( randomWeight() );

    this.weightsPerNeuron = this.nbWeights / this.nbNeurons;
};

Network.prototype.createVizualisation = function() {

    var i, l, l2, n, index;
    var x1, y1, x2, y2, max_y1 = 0;
    var neuron1, neuron2, is_input;
    var DOM_tmp, DOM_weight;

    var _MARGIN_X = 150;
    var _MARGIN_Y = 75;
    var that = this;

    // Computing functions & listeners callbacks
    function calcX(neuron) {
        return (neuron.layer + 1) * _MARGIN_X;
    }
    
    function calcY(neuron) {
        return (neuron.id - (that.layersSum[neuron.layer-1] || 0) + 1) * _MARGIN_Y;
    }

    function neuronTooltip(event) {
        tooltipOn( event, that.neurons[event.target.getAttribute("data-object")] );
    } 

    function weightTooltip(event) {
        tooltipOn( event, that.weights[event.target.getAttribute("data-object")] );
    } 

    // /!\ Global var
    DOM.weightTexts = []; 
    DOM.inputTexts = []; 
    DOM.outputTexts = []; 
    DOM.weightCurves = [];

    // Fetching every neuron
    for (i = 0, l = this.neurons.length; i < l; i++)
    {
        neuron1 = this.neurons[i];
        x1 = calcX(neuron1);
        y1 = calcY(neuron1);
        
        // Fetching neurons from next layer for weights
        for (n = 0, l2 = (this.layers[neuron1.layer + 1] || 0); n < l2; n++)
        {
            neuron2 = this.neurons[this.layersSum[ neuron1.layer ] + n];
            index = this.getWeightIndex(neuron1, neuron2);
            x2 = calcX(neuron2);
            y2 = calcY(neuron2);

            // Creating SVG weights
            DOM_tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
            DOM_tmp.setAttribute("class", "weight");
            DOM_tmp.setAttribute("data-object", index);
            DOM_tmp.setAttribute("d", "M" + x1 + "," + y1 +" C" + (x1 + _MARGIN_X/2) + "," + y1 + " " + (x1 + _MARGIN_X/2) + "," + y2 + " " + x2 + "," + y2);
            DOM_tmp.setAttribute("stroke-width", _STROKE_WIDTH);
            DOM_tmp.addEventListener("mousemove", weightTooltip);
            DOM_tmp.addEventListener("mouseout", tooltipOff);

            DOM.svg.appendChild(DOM_tmp);
            DOM.weightCurves.push(DOM_tmp);
            
            // Creating SVG weight Text
            DOM_tmp = document.createElementNS("http://www.w3.org/2000/svg", "text");
            DOM_tmp.setAttribute("class", "weight-text");
            DOM_tmp.setAttribute("data-object", index);
            DOM_tmp.setAttribute("x", x1 + (x2 - x1) * 0.2);
            DOM_tmp.setAttribute("y", y1 + (y2 - y1) * 0.2);

            DOM.weightTexts.push(DOM_tmp);
        }

        // Creating SVG input/output lines and text
        if (neuron1.layer === 0 || neuron1.layer === this.nbLayers-1)
        {
            is_input = neuron1.layer === 0 ? 1 : -1;
            
            DOM_tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
            DOM_tmp.setAttribute("class", "weight");
            DOM_tmp.setAttribute("d", "M" + x1 + "," + y1 +" L" + (x1 - _MARGIN_X / 4 * is_input) + "," + y1);

            DOM.svg.appendChild(DOM_tmp);

            DOM_tmp = document.createElementNS("http://www.w3.org/2000/svg", "text");
            DOM_tmp.setAttribute("class", is_input === 1 ? "input-text" : "output-text");
            DOM_tmp.setAttribute("x", is_input === 1 ? x1 - _MARGIN_X / 1.8 : x1 + _MARGIN_X / 3);
            DOM_tmp.setAttribute("y", y1 + 5);

            if (is_input === 1)
                DOM.inputTexts.push(DOM_tmp);
            else
                DOM.outputTexts.push(DOM_tmp);
        }

        // Creating SVG neuron
        DOM_tmp = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        DOM_tmp.setAttribute("class", "neuron");
        DOM_tmp.setAttribute("data-object", neuron1.id);
        DOM_tmp.setAttribute("cx", x1);
        DOM_tmp.setAttribute("cy", y1);
        DOM_tmp.setAttribute("r", _CIRCLE_RADIUS);
        DOM_tmp.addEventListener("mousemove", neuronTooltip);
        DOM_tmp.addEventListener("mouseout", tooltipOff);

        DOM.svg.appendChild(DOM_tmp);
        max_y1 = max_y1 < y1 ? y1 : max_y1;
    }

    // We stretch our svg document (here x2 is supposed to be the maximum possible)
    DOM.svg.setAttribute("width", x2 + _MARGIN_X);
    DOM.svg.setAttribute("height", max_y1 + _MARGIN_Y);

    // Push text elements on top of everything
    var svg_texts = DOM.outputTexts.concat( DOM.inputTexts.concat( DOM.weightTexts ));

    for (i = 0, l = svg_texts.length; i < l; i++)
        DOM.svg.appendChild( svg_texts[i] );
};    

Network.prototype.feed = function(inputs) {

    if (!inputs || inputs.length !== this.layers[0])
        throw new Exception("Incorrect inputs", {inputs: inputs, layer: this.layers[0]});

    var index, n, l, sum, neuron, prev_neurons; // neurons from previous layer
    var curr_layer = 0;

    // Input layer filling
    for (index = 0; index < this.layers[0]; index++)
        this.neurons[index].output = inputs[index];

    // Fetching neurons from second layer (even if curr_layer equals 0, it'll be changed directly)
    for (index = this.layers[0]; index < this.nbNeurons; index++)
    {
        neuron = this.neurons[index];

        // Update if necessary all previous layer neurons
        if (prev_neurons === undefined || neuron.layer !== curr_layer)
            prev_neurons = this.getNeuronsInLayer(curr_layer++);

        // Computing w1*x1 + ... + wn*xn
        for (sum = 0, n = 0, l = prev_neurons.length; n < l; n++)
            sum += this.getWeight(prev_neurons[n], neuron) * prev_neurons[n].output;

        // Updating output    
        neuron.output = activation(sum + neuron.biais); 

        if (!isFinite(neuron.output)) {
            
            for (sum = 0, n = 0, l = prev_neurons.length; n < l; n++)
                console.log(n, this.getWeight(prev_neurons[n], neuron));
            throw new Exception("non finite or too high output", {neuron: neuron});
        }
    }

    // console.log("neurons:");
    // console.table(this.neurons);

    return this.getNeuronsInLayer(this.nbLayers-1);
};

Network.prototype.backpropagate = function(targets) {

    var outputs_neurons = this.getNeuronsInLayer(this.nbLayers-1);

    if (!targets || !outputs_neurons || targets.length !== outputs_neurons.length)
        throw new Exception("Incoherent targets for current outputs", {targets: targets, outputs_neurons: outputs_neurons});

    // Computing output error
    // https://fr.wikipedia.org/wiki/R%C3%A9tropropagation_du_gradient

    var index, n, l, sum, err, grad, weight, max_weight = 0;
    var output_error = 0, curr_layer = this.nbLayers-1;
    var neuron, next_neurons;

    this.globalError = 0;

    // Output layer filling: err = (expected-obtained) - and normalize;
    for (n = l = outputs_neurons.length; n > 0; n--)
    {
        grad = derivative(outputs_neurons[l - n].output);
        err = (targets[l - n] - outputs_neurons[l - n].output) / _CANVAS_WIDTH;
        output_error += grad * err;
        this.neurons[this.nbNeurons - n].error = grad * err;
    }

    // Fetching neurons from last layer
    for (index = this.layersSum[curr_layer-1] - 1; index >= 0; index--)
    {
        neuron = this.neurons[index];

        // Update if necessary all next layer neurons
        if (next_neurons === undefined || neuron.layer !== curr_layer)
            next_neurons = this.getNeuronsInLayer(curr_layer--);

        // Computing w1*e1 + ... + wn*en
        for (sum = 0, n = 0, l = next_neurons.length; n < l; n++)
            sum += this.getWeight(neuron, next_neurons[n]) * next_neurons[n].error;

        // Updating error    
        neuron.error = sum * derivative(neuron.output) || 0; // in case of error is too small for JS
        this.globalError += neuron.error; 
        
        if (!isFinite(neuron.error)) {
            throw new Exception("non finite error", {neuron: neuron});
        } else if (Math.abs(neuron.error) > 1000) {
            throw new Exception("computed error is too high", {neuron: neuron});
        }

        // Updating weights w = w + lr * en * output only if necessary
        // if (Math.abs(output_error) > this.threshold)
        // {
            for (n = 0, l = next_neurons.length; n < l; n++) {
                weight = this.getWeight(neuron, next_neurons[n]) + this.lr * next_neurons[n].error *  (neuron.output / _CANVAS_WIDTH);
                this.maxWeight = this.maxWeight < Math.abs(weight) ? Math.abs(weight) : this.maxWeight;

                if (!isFinite(weight) || Math.abs(weight) > 1000)
                    throw new Exception("non finite or too high weight", {neuron: neuron, weight: weight});

                this.setWeight(neuron, next_neurons[n], weight);
            }
        // } else {
        //     console.log("STABLE", output_error, this.threshold);
        // }
    }

    this.max_weight = max_weight;

    // console.clear();
    // console.log( this.weights );
    // console.table( this.neurons );
};

Network.prototype.getNeuron = function(layer, n) {

    if (layer === undefined || layer < 0 || layer >= this.nbLayers)
        throw new Exception("Invalid layer access", {layer: layer, n: n});

    if (!n || n >= this.layers[layer])
        throw new Exception("Invalid neuron access", {layer: layer, n: n});

    return this.neurons[this.layersSum[layer] + n];
};    

Network.prototype.getNeuronsInLayer = function(layer) {

    if (layer === undefined || layer < 0 || layer >= this.nbLayers)
        throw new Exception("Invalid layer access", {layer: layer});

    return this.neurons.slice( this.layersSum[layer] - this.layers[layer], this.layersSum[layer]);
};

Network.prototype.getWeightIndex = function(from, to, debug) {

    if (!from || !to)
        throw new Exception("Invalid weight access, wrong neurons", {from: from, to: to});

    if (to.layer - from.layer !== 1 || to.layer <= 0 || to.layer >= this.nbLayers)
        throw new Exception("Invalid weight access, layers are not incorrect", {from: from, to: to});

    // How to explain this formula ? IT'S RIGHT FROM MY BRAIN
    var part1 = this.layersMul[from.layer]; // How many weights there is before from.layer
    var part2 = (from.id - (this.layersSum[from.layer-1] || 0)) * this.layers[to.layer]; // How many weights there is in from.layer, but before our neuron
    var part3 = to.id - this.layersSum[from.layer]; // How many weights there is from our neuron, which are not going to our second neuron
    var index = part1 + part2 + part3;

    if (debug || isNaN(this.weights[index]) || part1 < 0 || part2 < 0 || part3 < 0 || index < from.id)
    {
        console.log(from, to);
        console.log("index: ", index);
        console.log("#1", part1);
        console.log("#2", part2);
        console.log("#3", part3);

        if (isNaN(this.weights[index]))
            throw new Exception("NaN detected for computing weight index");
        else if (part1 < 0 || part2 < 0 || part3 < 0)
            throw new Exception("Parts calculus is incorrect: negatives values");
            else if (index < from.id)
            throw new Exception("Incoherent index inferior to from.id");
        else 
            throw new Exception("Error: debug launched", {debug: debug});
    }

    return index;
};

Network.prototype.getWeight = function(from, to) {
    
    return this.weights[this.getWeightIndex(from, to)];
};
    
Network.prototype.setWeight = function(from, to, value) {

    this.weights[this.getWeightIndex(from, to)] = value;
};
    

//////////////////////////////////////////////

function init() {

    DOM.canvas.width = _CANVAS_WIDTH;
    DOM.canvas.height = _CANVAS_HEIGHT;

    ctx.translate(_CANVAS_WIDTH / 2, _CANVAS_HEIGHT / 2);
    ctx.scale(1, -1);

    DOM.canvas.addEventListener("mousemove", function(e) {
        mouse.x = (e.clientX - DOM.canvas.offsetLeft) * 2 - _CANVAS_WIDTH / 2;
        mouse.y = (e.clientY - DOM.canvas.offsetTop) * -2 + _CANVAS_HEIGHT / 2;
        mouse.refresh = true;
    });
}

function update() {

    // setTimeout(function() { update(); }, 1000/60);
    requestAnimationFrame(function() { update(); });

    // if (!mouse.refresh)
    //     return;

    // mouse.refresh = false;

    var mid_w = _CANVAS_WIDTH / 2;
    var mid_h = _CANVAS_HEIGHT / 2;
    
    // Feeforward NN
    var inputs = [mouse.x, mouse.y];
    var neurons = brain.feed(inputs);
    var errors = brain.backpropagate(inputs);

    ctx.clearRect(-mid_w, -mid_h, _CANVAS_WIDTH, _CANVAS_HEIGHT);

    // Draw mouse 
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, _POINT_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    // Draw circle
    ctx.beginPath();
    ctx.arc(neurons[0].output, neurons[1].output, 50, 0, Math.PI * 2, false);
    ctx.stroke();

    // Update tooltip
    if (DOM.tooltip.object !== undefined)
        tooltipUpdate(DOM.tooltip.object);

    /////////////////////////////////////

    var i, l;
    var outputs = [neurons[0].output, neurons[1].output];

    // Update SVG text inputs
    for (i = 0, l = DOM.inputTexts.length; i < l; i++)
        DOM.inputTexts[i].innerHTML = inputs[i].toFixed(1);

    // Update SVG text outputs
    for (i = 0, l = DOM.outputTexts.length; i < l; i++)
        DOM.outputTexts[i].innerHTML = outputs[i].toFixed(1);

    // Update SVG weights
    for (i = 0, l = brain.nbWeights; i < l; i++) {
        DOM.weightCurves[i].setAttribute("stroke-width", Math.abs(brain.weights[i]) / brain.maxWeight * _STROKE_WIDTH);
        if (brain.weightsPerNeuron < 4) 
            DOM.weightTexts[i].innerHTML = brain.weights[i].toFixed(4);
    }

    // Update global error display
    DOM.globalError.innerHTML = (brain.globalError * _CANVAS_WIDTH).toFixed(6);
}

var DOM = {
    canvas: document.querySelector("canvas"),
    svg: document.querySelector("svg"),
    tooltip: document.querySelector("#tooltip"),
    
    globalError: document.querySelector("#global_error span"),
    weightTexts: null,
    inputTexts: null,
    outputTexts: null,
    weightCurves: null
};

var ctx = DOM.canvas.getContext("2d");
var mouse = {x: 1, y: 2, refresh: false};
var brain = new Network({
    lr: 0.05,
    threshold: 0.0001,
    // layers: [2, 3, 2]
    // layers: [2, 4, 4, 4, 2]
    // layers: [2, 5, 1, 5, 2]
    layers: [2, 15, 15, 15, 2]
    // layers: [2, 3, 3, 3, 3, 3, 3, 2]
    // layers: [2, 3, 4, 5, 6, 5, 4, 3, 2]
    // layers: [2, 40, 2]
});

window.onload = function() {
    
    init();
    update();
};