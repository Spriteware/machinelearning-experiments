function resultReceiver(event) {
    results.push(parseInt(event.data));
    if (results.length == 2) {
      postMessage(results[0] + results[1]);
    }
  }
  
  function errorReceiver(event) {
    throw event.data;
  }

onmessage = function(e) {

    // importScripts(e.);

    console.log('Message received from main script');
    var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
    console.log('Posting message back to main script');
    postMessage(workerResult);
}