
// Brain hyperparameters
var _epochs = 1000;
var _dropout = false;
var _shuffle = true;

var K = 2;

const _params = {
    libURI: "http://localhost/machinelearning/lib/neural-network.js",
    lr: 0.01,
    layers: [K, 1, 1],
    optimizer: "nag", // adagrad, adam, adadelta or nag
    optimizerParams: { alpha: 0.7, beta1: 0.9, beta2: 0.99 }, // 0.9 decay for adadelta
    activation: "prelu",
    activationParams: { alpha: 0.1 }
};

//////////////////////////////////////////////

function init() {

    DOM.trainButton.addEventListener("click", function (e) {

        // Initial training
        if (typeof imported_training_set !== 'undefined' && imported_training_set !== undefined)
        {
            DOM.trainButton.parentElement.appendChild(_brain.train({
                training_set: Utils.static.parseTrainingData(imported_training_set),
                validation_set: Utils.static.parseTrainingData(imported_validation_set),
                epochs: _epochs,
                visualize: true,
                dropout: _dropout,
                shuffle: _shuffle
            }));
        }

        else
        {
            alert("No training data available");
        }
    });

    DOM.updateButton.addEventListener("click", function() {

        _safe = !_safe;
        update();
    });

    DOM.ranges.forEach(function(input, index) {
        input.addEventListener("mousemove", function (e) {
            _inputs[index] = parseFloat(this.value);
        });
    });
}

function update() {

    if (!_safe)
        return;
    
    requestAnimationFrame(function () { update(); });
    try {
        _brain.feed(_inputs);
        _brain.visualize(_inputs, 4);

        // var target = (_inputs[0] > _inputs[1] && _inputs[1] > _inputs[2]) || (_inputs[0] < _inputs[1] && _inputs[1] < _inputs[2]) ? 1 : 0;
        var target = _inputs[0] > _inputs[1] ? 1 : 0;
        DOM.target.innerHTML = target;

        if (target === Math.round(_brain.output[0])) {
            DOM.target.classList.remove("wrong");
            DOM.target.classList.add("correct");
        }
        else {
            DOM.target.classList.remove("correct");
            DOM.target.classList.add("wrong");
        }

    } catch(ex) {
        _safe = false;
        console.error(ex);
        return;
    }
}

var _inputs, _brain, _safe = false;

window.onload = function () {

    DOM = {
        ranges: document.querySelectorAll("input[type='range']"),
        target: document.querySelector("#target"),
        trainButton: document.querySelector("#train"),
        updateButton: document.querySelector("#update"),
    };

    _inputs = Array(DOM.ranges.length).fill(0);
    _brain = new Network(_params);

    ///////////////////////////////////////////

    document.body.appendChild(_brain.createVisualization());
    init();
    update();
};

/*
    Pour la suite, essayer de résoudre juste le problème a > b
    Représenter graphiquement

    Puis passer à a > b > c ,etc...
    Je pense que j'utilise le char d'assaut pour pas grand chose
*/