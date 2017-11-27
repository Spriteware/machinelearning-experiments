
// Brain hyperparameters
var _epochs = 20;
// var _epochs = 5;
var _dropout = false;
var _shuffle = true;

var K = 2;

const _params = {
    libURI: "http://localhost/machinelearning/lib/neural-network.js",
    lr: 0.05,
    layers: [K, 4, 4, 4, 1],
    // layers: [K, 2, 2, 1],
    // layers: [K, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    optimizer: "nag", // adagrad, adam, adadelta or nag
    optimizerParams: { alpha: 0.7, beta1: 0.9, beta2: 0.99 }, // alpha for nag and adadelta, betas for adam
    activation: "prelu",
    activationParams: { alpha: 0.1 }
};

//////////////////////////////////////////////

function init() {

    DOM.trainButton.addEventListener("click", function (e) {

        // Initial training
        if (typeof _imported_training_set === "undefined" || _imported_training_set === undefined) {
            alert("No training data available. Check your var '_imported_training_set'");
            return;
        }

        var training_set = typeof _imported_training_set !== "undefined" ? Utils.static.parseTrainingData(_imported_training_set): undefined;
        var validation_set = typeof _imported_validation_set !== "undefined" ? Utils.static.parseTrainingData(_imported_validation_set): undefined;
        var test_set = typeof _imported_test_set !== "undefined" ? Utils.static.parseTrainingData(_imported_test_set): undefined;

        // Launch training
        var graph = _brain.train({
            trainingSet: training_set,
            validationSet: validation_set,
            testSet: test_set,

            epochs: _epochs,
            dropout: _dropout,
            shuffle: _shuffle,

            graphWidth: 400,
            graphHeight: 100, 
            visualize: true
        });

        // Add visualization
        DOM.trainButton.parentElement.appendChild(graph);
    });

    DOM.updateButton.addEventListener("click", function() {

        _safe = !_safe;
        update();
    });


    DOM.rangeSelection.addEventListener("change", function(e) {

        var p = parseFloat(e.target.value);
        DOM.ranges.forEach(function (input, index) {
            input.setAttribute("min", -p);
            input.setAttribute("max", p);
        });
    });

    DOM.ranges.forEach(function(input, index) {
        input.addEventListener("mousemove", function (e) {
            _inputs[index] = parseFloat(this.value);
        });
    });

    // Fire events
    var e = document.createEvent("HTMLEvents");
    e.initEvent("change", false, true);
    DOM.rangeSelection.dispatchEvent(e);
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

var _inputs, _brain, _safe = true;

window.onload = function () {

    DOM = {
        rangeSelection: document.querySelector("#range-selection"),
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
    Notes

    Test 1: 
    ------------ (training set=2000, validation set=400)
    On remarque qu'avec un seul hidden layer, on peut faire varier le nombre de neurones mais ça ne change pas l'erreur qui reste aux alentours de 0.4
        - sûr ? et 500 neurones ? et sur beaucoup plus d'épochs ?
    Alors que finalement, en ajoutant un seul hidden layer avec un seul neuron le résultat n'est pas trop intéressant, ne change pas trop. 
    Avec 2x2x2x1, on obtient déjà une grande différence au niveau de l'erreur minimum atteignable : < 0.01 ! 
    Par contre, ajouter un nouveau layer à 2 neurones ne change plus rien, difficile de faire mieux
    Autre chose intéressante : le NN se trompe toujours pour le point spécial quand a = b
    J'ai aussi noté que Adam permettait pour 2x2x2x1 de converger plus rapidement vers l'optimum, comparé à nag.

    Est-ce que le nombre de layers est donc lié à la généralisation? Est-ce qu'on peut faire apprendre à notre NN à généraliser pour les 
    nombres qui n'appartiennent pas à [0.5, 0.5] ? 

    Test: pour 2x2x2x1, le NN donne bien des valeurs <0 quand on doit avoir 0, et >1 quand on doit avoir 1. Mais 

    Autre test : si j'augmente le training set de 2000 à 20000 (facteur 10), alors la convergence est immediate. Je peux réduire le nobre d'épochs à genre 5.

    Est-ce que le nombre de neurones permet la généralisation? cf. test 2
    

    Test 2:
    ------------ (training set=20000, validation set=4000, test=600) 100 epochs
    Je remarque que la topologie la plus adaptée pour la généralization est 2x2x2x2x1, où la courbe de test converge réellement vers les autres, et 0
        - si on réduit la topologie d'un x2, la convergence est moins évidente
        - si on augmente de x2, c'est le NN qui met donc plus de temps à converger vers sa solution.

    Néanmoins j'ai aussi des doutes sur la généralization dans le temps: sur plus de 100 epochs, c'est possible qu'à un moment en essayant de converger,
    le NN optimise a fond pour le training set mais perd sa faculté de génralisation.

    Les tests sont aussi effectués plusieurs fois et certaines fois le NN ne généralise pas du tout, certaines fois dès les premières epochs

*/