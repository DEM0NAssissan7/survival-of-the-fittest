function setup() {
    noLoop();
    createCanvas(window.innerWidth - 20, window.innerHeight - 20);
    // canvas.parent('sketch-holder');

    // Event listener
    window.addEventListener("gamepadconnected", function(e) {
        gamepad_handler(e, true);
        console.log("Device: Controller " + e.gamepad.index + " connected (" + e.gamepad.id + ")");
    });
    window.addEventListener("gamepaddisconnected", e => {
        gamepad_handler(e, false);
        console.log("Device: Controller " + e.gamepad.index + " disconnected (" + e.gamepad.id + ")");
    });
}
function gamepad_handler(e, connecting) {
    if(connecting) {
        devices.controllers[e.gamepad.index] = e.gamepad;
    } else {
        delete devices.controllers[e.gamepad.index];
    }
}
let controllers = devices.controllers;
var draw = function(){
    sched();
    requestAnimationFrame(draw);
};
requestAnimationFrame(draw);