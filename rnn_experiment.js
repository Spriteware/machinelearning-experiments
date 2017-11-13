function init() {

    var math = new dl.NDArrayMathGPU();
    var a = dl.Array1D.new([1, 2, 3]);
    var b = dl.Scalar.new(2);

    var result = math.add(a, b);

    result.data().then(data => console.log(data)); // Float32Array([3, 4, 5])
}

window.addEventListener("load", function() {

    document.querySelector("#init").addEventListener("click", init);
});