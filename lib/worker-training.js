
if (typeof importScripts !== "undefined")
    importScripts("http://localhost/machinelearning/lib/neural_network.js");

onmessage = function(e) {

    if (!e.data.params || !e.data.weights)
        throw new NetException("Invalid params or weights in order to build a Neural Network copy", {params: e.data.params, weights: e.data.weights});

    var training_data = e.data.training_data;
    var epochs = e.data.epochs;

    console.info("Training imported data in processing... Brain copy below:");    

    // Create copy of our current Network
    var brain = new Network(e.data.params);
    brain.weights = e.data.weights;

    ///////////////////// Training //////////////////////////////


    var i, curr_epoch, training_size = training_data.length;
    var inputs_size = training_data[0].length, curr_inputs = new Array(inputs_size);
    var container = null, graph, graph_ctx, global_errors_mean_output;

    var output_errors     = [];
    var output_errors_sum = 0;
    var max_output_error  = 0;
    var output_errors_mean;

    // Feeforward NN
    for (curr_epoch = 0; curr_epoch < epochs; curr_epoch++)
    {
        for (i = 0; i < training_size; i++)
        {
            brain.feed(training_data[i].inputs);
            brain.backpropagate(training_data[i].targets);

            output_errors.push( brain.outputError );
            output_errors_sum += brain.outputError;
            max_output_error = brain.outputError > max_output_error ? brain.outputError : max_output_error;
        }
        
        output_errors_mean = output_errors_sum / ((curr_epoch+1) * training_size); 

        // Send updates back to real thread
        self.postMessage({
            type: WORKER_TRAINING_PENDING,
            curr_epoch: curr_epoch,
            output_errors: output_errors,
            output_errors_mean: output_errors_mean,
            max_output_error: max_output_error 
        });
    }

    console.info("Training done. Gone through all epochs", {epochs: epochs, output_errors_mean: output_errors_mean});

    self.postMessage({
        type: WORKER_TRAINING_OVER,
        weights: brain.exportWeights(),
        biais: brain.exportBiais()
    });
};