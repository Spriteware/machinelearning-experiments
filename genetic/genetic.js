"use strict"; // jshint ignore: line 

const _TIME_INTERVAL             = 1;
const _DEFAULT_FITNESS           = 99999999;
const _MUTATION_PROBABILITY      = 0.01;
const _RANDOM_MUTATION_THRESHOLD = 0.0;
const _MAX_TIME_VALUES           = 100;
const _POPULATION_NUMBER         = 30;
const _ASCII_RANGES              = {min: 32, max: 126};

function rand_char() {
    return String.fromCharCode(Math.floor(Math.random() * (_ASCII_RANGES.max - _ASCII_RANGES.min) + _ASCII_RANGES.min));
}

//////////////////////////////////////////////////////

var Chromosome = function(dna) {  

    this.dna     = dna !== undefined ? dna : "";
    this.fitness = _DEFAULT_FITNESS;
    this.shift   = 0;
};

Chromosome.prototype.random = function(length) {  

    while (length--)
        this.dna += rand_char();
};

Chromosome.prototype.calcFitness = function(compareTo) {  
    
    var i, j, l, total = 0;

    for (i = 0, l = this.dna.length; i < l; i++)
        total += (this.dna.charCodeAt(i) - compareTo.charCodeAt(i)) * (this.dna.charCodeAt(i) - compareTo.charCodeAt(i));

    this.fitness = total;
};

Chromosome.prototype.mate = function(chromosome) {  

    var pivot  = Math.round(this.dna.length / 2) - 1;
    var child1 = this.dna.substr(0, pivot) + chromosome.dna.substr(pivot);
    var child2 = chromosome.dna.substr(0, pivot) + this.dna.substr(pivot);

    // var l = Math.round(this.dna.length / 4);
    // var pivot1 = l - 1;
    // var pivot2 = 3*l - 1;

    // var child1 = this.dna.substr(0, l) + chromosome.dna.substr(l+1, 2*l-2) + this.dna.substr(-l);
    // var child2 = chromosome.dna.substr(0, l) + this.dna.substr(l+1, 2*l-2) + chromosome.dna.substr(-l);

    return [new Chromosome(child1), new Chromosome(child2)];
};

Chromosome.prototype.mutate = function(chance, randomWay, fitnesses) {  

    var i, l, direction, code, tmp = "";

    // randomWay  = false;
    this.shift = Math.round( (fitnesses.min - this.fitness) / fitnesses.max);
    // console.log(this.shift);

    for (i = 0, l = this.dna.length; i < l; i++)
    {
        // Mutate DNA based on complete randomness 
        if (randomWay === true) {
            tmp += Math.random() < chance ? rand_char() : this.dna[i];
        }

        // Mutate DNA only by doing one shift in one direction or another
        else {
            direction = Math.random() <= 0.5 ? -1 : 1;
            // direction = Math.random() <= 0.5 ? -this.shift : this.shift;
            code = (this.dna.charCodeAt(i) + direction) % (_ASCII_RANGES.max - _ASCII_RANGES.min) + _ASCII_RANGES.min;
            // console.log(code );

            tmp += Math.random() < chance ? String.fromCharCode(code) : this.dna[i];
        }
    }

    this.dna = tmp;
};

//////////////////////////////////////////////////////

var Population = function(goal, size) {  

    this.members    = [];
    this.goal       = goal;
    this.generation = 0;
    this.finished   = false;
    this.fitnesses  = {
        total: _DEFAULT_FITNESS,
        mean: _DEFAULT_FITNESS,
        min: _DEFAULT_FITNESS,
        max: 0
    };

    this.displayEverything = false;

    this.equals    = 0;
    this.notequals = 0;
    this.shifted   = 0;

    while (size--) {
        var c = new Chromosome();
        c.random(this.goal.length);
        this.members.push(c);
    }
};

Population.prototype.sort = function() { 

    this.members.sort(function(a, b) {
        return a.fitness - b.fitness;
    });
};

Population.prototype.evaluation = function() {

    var i, l, fit,total = 0;

    this.fitnesses.min = _DEFAULT_FITNESS;
    this.fitnesses.max = 0;

    for (i = 0, l = this.members.length; i < l; i++)
    {
        this.members[i].calcFitness(this.goal);

        fit = this.members[i].fitness;
        total += fit;
        this.fitnesses.min = fit < this.fitnesses.min ? fit : this.fitnesses.min; 
        this.fitnesses.max = fit > this.fitnesses.max ? fit : this.fitnesses.max; 
    }

    this.fitnesses.total = total;
    this.fitnesses.mean  = total / this.members.length;

    this.sort();
};

Population.prototype.selection = function() { 

    // Selection of the two parents 
    // var i, l, selection = [this.members[0], undefined];
    var i, l, selection = [this.members[0], this.members[1]];

    // for (i = 1, l = this.members.length; i < l; i++) {
    //     if (this.members[i].dna !== selection[0].dna) {
    //         selection[1] = this.members[i]; 
    //         break;
    //     }
    // }

    // if (selection[1] === undefined) {
    //     selection[1] = this.members[1];
    //     console.warn("Warning: mating will be between same parents... It seems that the entire population is the same, wtf ?");
    // }

    if (selection[0].dna === selection[1].dna)
        this.equals++;
    else
        this.notequals++;

    return selection;
};

Population.prototype.generate = function(parents) {

    if (parents[0] === undefined || parents[1] === undefined) {
        console.error("ERROR: unable to generate next generation with undefined parents", parents);
        return;
    }

    var children = parents[0].mate(parents[1]);
    children[0].calcFitness(this.goal);
    children[1].calcFitness(this.goal);
    
    this.members.splice(this.members.length - 2, 2, children[0], children[1]);

    for (var i = 0, l = this.members.length; i < l; i++)
    {
        this.members[i].mutate(_MUTATION_PROBABILITY, i / l > _RANDOM_MUTATION_THRESHOLD, this.fitnesses);
        this.members[i].calcFitness(this.goal);

        if (this.members[i].dna === this.goal)
        { 
            this.finish();
            return;
        }
    }

    this.generation++;
};

Population.prototype.evolve = function() { 

    // 1. Evaluation of the fitness of each chromosome and sorting
    // 2. Display results order by fitness
    // 3. Select 2 good-rated parents for next generation
    // 4. Generate next population

    this.evaluation();
    this.display();
    this.generate( this.selection() );
};

Population.prototype.finish = function() {

    this.finished = true;

    this.sort();
    this.display();

    var total = this.equals + this.notequals; 
    console.log("equals: %d / %d%", this.equals, this.equals / total * 100);
    console.log("notequals: %d / %d%", this.notequals, this.notequals / total * 100);
};

Population.prototype.display = function() {

    output.innerHTML = "<b>Generation #" + this.generation + "</b><br />";
    output.innerHTML += "<b>Last evolution time:</b> " + time.getCurrentDt() + "ms<br />";
    output.innerHTML += "<b>Average dt:</b> " + time.getAverageDt() + "ms<br /><br />";

    for (var mut, i = 0, l = this.displayEverything ? this.members.length : 1; i < l; i++) {
        // mut = i / l > _RANDOM_MUTATION_THRESHOLD ? "R-mutation" : "";
        mut = this.members[i].shift;
        output.innerHTML += this.members[i].dna + "&emsp; (" + this.members[i].fitness + ") " + mut + "<br />";
    }
};

//////////////////////////////////////////////////////

var TimeAnalysis = function(max_values) {

    this.maxValues = max_values;
    this.values    = [0];
    this.lastTime  = performance.now();
    this.currentDt = 0;
    this.averageDt = 0;
};

TimeAnalysis.prototype.analyze = function() {

    var sum, i, l = this.values.length;

    this.currentDt = performance.now() - this.lastTime;
    this.lastTime = performance.now();

    this.values.push(this.currentDt);

    if (l+1 > this.maxValues)
        this.values.shift();

    for (i = 0, sum = 0; i < l; i++)
        sum += this.values[i];

    this.averageDt = sum / l;
};

TimeAnalysis.prototype.getAverageDt = function() {

    return Math.round(this.averageDt * 10) / 10;
};

TimeAnalysis.prototype.getCurrentDt = function() {

    return Math.round(this.currentDt * 10) / 10;
};


//////////////////////////////////////////////////////

var run = function () {

    population.evolve();
    time.analyze();

    if (!population.finished)
        setTimeout(run, _TIME_INTERVAL);

    ///////////////////////////////////

    window.onload = function () {

        document.querySelector("button").onclick = function () {

            population.displayEverything = !population.displayEverything;

            if (population.finished)
                population.display();
        };
    };
};

var output, time, population;

window.onload = function (params) {

    output = document.querySelector("output");
    time = new TimeAnalysis(_MAX_TIME_VALUES);

    // population = new Population("Hello world !", _POPULATION_NUMBER);
    population = new Population("To be or not to be", _POPULATION_NUMBER);
    // population = new Population("Insanity is doing the same thing over and over again and expecting different results", _POPULATION_NUMBER);

    run();
};

