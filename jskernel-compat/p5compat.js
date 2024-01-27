function setup() {
    noLoop();
    let canvas = createCanvas(window.innerWidth - 20, window.innerHeight - 20);
    canvas.parent('sketch-holder');
}
var draw = function(){
    sched();
    requestAnimationFrame(draw);
};
requestAnimationFrame(draw);