const _CANVAS_WIDTH  = 1000;
const _CANVAS_HEIGHT = 600;
const _POINT_RADIUS  = 8;

const _EPOCHS = 20;

var Utils = {
    static: {}
};

Utils.static.exportTrainingData = function() {

    console.info("Saving training data...", "Reading 'training_data'");

    var output = document.createElement("textarea");
    output.setAttribute("disabled", "disabled");
    output.innerHTML = "var training_data_imported = " + JSON.stringify(training_data, null, '\t') + ";";

    document.body.appendChild( output );

    return "Export completed for " + training_data.length + " entries.";
};

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
            DOM.trainButton.parentElement.appendChild( brain.train(training_data_imported, _EPOCHS, true) ); // second parameter is number of epochs

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

    requestAnimationFrame(function() { update(); });

    ctx.clearRect(-_CANVAS_WIDTH / 2, -_CANVAS_HEIGHT / 2, _CANVAS_WIDTH, _CANVAS_HEIGHT);
    
    ///////////////////// OWN LIBRAIRY JS //////////////////

    // Feeforward NN
    var inputs = [mouse.x / norm, mouse.y / norm];
    var targets = [mouse.x / norm, mouse.y / norm];
    // var targets = [mouse.x, mouse.y];
    var neurons = brain.feed(inputs);

    // Build training data for future exportation
    training_data.push({
        inputs: inputs,
        targets: targets
    });

    if (DOM.backpropagationCheckbox.checked === true)
        brain.backpropagate(targets);
        
    // Draw mouse 
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, _POINT_RADIUS, 0, Math.PI * 2, false);
    ctx.fill();

    // Draw circle
    ctx.beginPath();
    ctx.arc(neurons[0].output * norm, neurons[1].output * norm, 50, 0, Math.PI * 2, false);
    ctx.stroke();

    // Update global error display
    DOM.globalError.innerHTML = (brain.globalError).toFixed(6);

    // Update Network SVG Vizualisation
    brain.visualize(inputs);
}

var DOM, ctx, mouse, brain, training_data = [];
var norm = Math.sqrt(_CANVAS_WIDTH * _CANVAS_WIDTH + _CANVAS_HEIGHT * _CANVAS_HEIGHT) / 2;

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
    brain = new Network({
        momentum: 0.0,

        lr: 0.1,
        layers: [2, 2, 2],
        hiddenLayerFunction: "linear",
        
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
        
        // layers: [2, 4, 4, 4, 2],
        // layers: [2, 10, 2],
        // layers: [2, 6, 6, 6, 6, 6, 6, 6, 6, 6, 2]
        // layers: [2, 5, 1, 5, 2]
        // layers: [2, 15, 15, 15, 2]
        // layers: [2, 3, 3, 3, 3, 3, 3, 2]
        // layers: [2, 3, 4, 5, 6, 5, 4, 3, 2]
        // layers: [2, 40, 2]
    });

    // Setting activation function for hiddens layer:
    // brain.setHiddenLayerToActivation(brain.static_tanhActivation, brain.static_tanhDerivative);
    // brain.setHiddenLayerToActivation(brain.static_sigmoidActivation, brain.static_sigmoidDerivative);
    // brain.setHiddenLayerToActivation(brain.static_reluActivation, brain.static_reluDerivative);

    document.body.appendChild( brain.createVisualization() );
    
    init();
    update();
};


/*
    NOTES
    ------------
    Le learning rate est magique, il suffit de le changer un peu pour influence complètement les performances.

    Dans les deux cas l'erreur globale devien ttrès faible.
    Je trouve que sans activation function le résultat est plus smooth. C'est surement parce que ce genre d'activation permet surtout des classfication,
     et c'est vrai que j'en ai pas testées d'autres 


    Il semble que modifier randomWeight() ne change rien, puisque de toute manière les weights se restabilisent après.
    Ainsi, même avec de gros intervalles comme [-5, 5], la différence est juste visible au début car ça part en cacahuète,
    a cause du calcul différentiel qui est enorme de layer en layer.
    Mais ça n'a pas l'air d'améliorer du tout le réseau de neurones. Je pense que justement, pour de nombreux hidden layers il 
    faut aussi penser à baisser peut-être en dessous du [-1, 1].

    
    Remarque intéressante: le biais est bien indispensable si on veut obtenir finalement un cercle qui suit exactement la souris.
    De mauvais résultats ont été obtenus avec de faibles biais. Pire, sans biais c'est impossible il y a toujours une global error qui jump quand on bouge la souris.
    Cela peut s'expliquer par le fait que le réseau de neurones à du mal à répartir x et y, et du coup l'ajout de "sel" l'aide à se stabiliser sur des weights qui ne sont pas parfaits.
    Après c'est pareil, trop c'est pas bon car le cercle va suivre mais toujours avec un petit temps de retard.
    Pareil, le learning rate et le biais sont très correllés.


    Finalement, l'activation function peut permettre que les valeurs ne grimpent pas trop vites avec plein de layers et pleins de neurons!
    Parce que du coup, par exemple pour la sigmoid les valeurs output sont comprises entre 0 et 1
    Ainsi on peut rajouter des hidden layers sans aucun problème!
    Ca resoudrai le problème auquel j'ai été confronté.
    Update: en effet ça résoud pas mal le problème !
    Par contre clairment, impossible de rééllement trouver la solution avec l'activation function tanh.
    On arrive proche du résultat, mais peut importe le temps que je passe dessus, le cercle n'arrive pas tout à fait à suivre la souris.
    Les poids se dérèglent d'un endroit quand ils veulent se régler d'un autre.
    Il faudrait peut-être que j'essaye la technique du dropout.


    Je souhaite laisser cette micro librairie du neural network la plus simple possible pour que si un débutant comme moi, souhaite lire un code,
    il comprenne. Le raisonnement est basique. J'aurai pu commencer à faire des optimisations de partout, utiliser des matrices plutôt que des objets de neurons,
    et pourquoi pas mettre en place l'API web workers pour effectuer les calculs parallèlement, mais ce n'est pas le but.

    .................

    Après de nombreux tests, impossible d'avoir quelque chose de stable avec les activations functions (sigmoid ou tanh) sur le hidden layer.
    ça ne fonctionne qu'avec la fonction linéaire f(x) = x;
    Un commentaire stackexchange (https://stats.stackexchange.com/questions/218542/which-activation-function-for-output-layer) 
    explique pourquoi si les valeurs étudiées sont positives alors tout est niké : 
    
        Sigmoid and tanh should not be used as activation function for the hidden layer. This is because of the vanishing gradient problem, 
        i.e., if your input is on a higher side (where sigmoid goes flat) then the gradient will be near zero. This will cause very slow
         or no learning during backpropagation as weights will be updated with really small values.
        Detailed explanation here: http://cs231n.github.io/neural-networks-1/#actfun
        The best function for hidden layers is thus ReLu.

    Il faut donc que je tests ReLu sur mes hiddens
    Update: heeuuuuu relu change RIEN. SAME SHIT


    COMMENT CHOISIR LE NOMBRE DE LAYERS ET NEURONS?
    https://stats.stackexchange.com/questions/181/how-to-choose-the-number-of-hidden-layers-and-nodes-in-a-feedforward-neural-netw/1097#1097
    Autre chose apprise sur le tas mais qui n'est pas trop évidente : on parle d'activation fonctions sur les neurones
    mais pas du fait que les activations sont différentes celon le type de layer. Ainsi, on ne met pas les mêms sur les hidden layer que sur les outputs


    J'ai testé en implémentant la librairie Convnet JS, voir si le résultat est pareil.
    Et il l'est ! Impossible de trouver une solution. Dès que je stoppe le training, on voit que le cercle ne suit pas du tout
    Et ca peut importe le nombre de neurons et le nombre d'hidden layers....


    Okay.. APrès de longues recherches, il s'avère qu'un de problème est la normalization.
    En effet, si je me souviens bien il y a eu un moment, ou je manipulais directement dans le modèle les outputs non normalizés. 
    C'est un post ostackoverlofw qui m'a mis la puce à l'oreille (https://stackoverflow.com/questions/41559425/autoencoder-not-learning-identity-function)

         the issue was with the dataset having too small variations between the 84 values, so the resulting prediction
          was actually pretty good in absolute terms (loss function) but comparing it to the original data, the variations were far off.

    Si cela fonctionnait avant, c'est parce que le neural net voyait plus de différences eentre (200, 200) et (150, 200) que (1, 1) et (0.75, 1)       
    et pourtant la différence y était. Il semblerai donc que j'ai perdu, en normalizant mes valeurs l'importance qu'il y a entre deux positions de la souris.
    Donc le neural net, qui ne voit plus de diff, n'apprend plus.

    J'ai donc essayé de remettre en target les coordonnées directes d la souris. Après tout, il suffit au neural net de bien weighter les deux derniers weights
    pour passer de quelque chose de normaliser (ce qui se passe dans le neural net) à des coordonnées reeles de ma souris.
    Cependant je remarque que je ne peux pas mettre en input les coordonnées directes.
    Le neural net s'affole, les erreurs sont trop énormes, les poids augmentent de façon exponentielles.
    Mais j'ai oublié qqchose de crucial : le learning rate. C'est lui la clé, car j'ai quasi toujours effectué mes tests avec 
    des learnings rates de 0.5, 0.1, 0.05 ou 0.01 au pire mais pourtant le learning rate est au coeur du calcul d'erreur, et en le baissant je permet
    d'éviter que les valeurs d'erreurs ou de weight s'affollent en plein milieu de mon neural net....
    D'ailleurs si je me souviens bien, sur la vizualisation google tensorflow a usage educatif, ils ont bie un learning rate qui peut aller très bas.
    Actuellement j'ai donc  {
        lr: 0.0001,
        momentum: 0.0,
        layers: [2, 3, 2],
    } sans aucune activatio function, et pour la première fois depuis longtemps je voit enfin mon réseau qui apprend.
    Le résultat n'est pas encore parfait, mais je pense qu'avec de nombreuses époques il peut l'être .
    Aussi, je pense qu'il faut absolulement que j'update les biais aussi. Parce que forcément quand un weight tant vers sa valeur optimale, le bais
    lui peut tout niker.
    J'ai bien deux chemins de weights créés (voir screenshot 1) avec notemment
    -33.4567 * -29.4442 = 950.....
    31. * 28 = 868.....
    pas mal ! on y arrive! sachant que _weight est de 800...
    EDIT dans la seconde : j'ai fait un test en mettant tous les biais à 0.... Le neural net converge parfaitement directement vers la solution.
    Le cercle suit la souris sans aucun problème, le global output est inférieur à 0 peut importe mes mouvements...

    DOnc il serait mieux de ne pas utiliser le global error pour savoir l'erreur mais uniquement l'erreur en output.
    Car sur de gros réseaux de neurones, on ne peut pas avoir tous les gradients à 0
    */