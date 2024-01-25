let pids = 0;
function Process (handler) {
    this.pid = pids++;
    this.threads = [handler];
    this.suspended = false;
}

let processes = [];
function create_init(handler) {
    processes.push(new Process(handler));
}

function exit() {
}

function setup() {
    noLoop();
    createCanvas(window.innerWidth - 20, window.innerHeight - 20);
}

let current_process;
var draw = function(){
    let i;
    for(i = 0; i < processes.length; i++) {
        current_process = processes[i];

        exit = function () {
            current_process.suspended = true;
            processes.splice(i, 0);
            i--;
        }

        if(!current_process.suspended)
            for(let thread of current_process.threads)
                thread();
    }
    requestAnimationFrame(draw);
};
requestAnimationFrame(draw);

function getpid() {
    return current_process.pid;
}

function suspend(pid) {
    for(let process of processes)
        if(process.pid === pid)
            process.suspend = true;
}

function resume(pid) {
    for(let process of processes)
        if(process.pid === pid)
            process.suspend = false;
}

let priority = () => {};
let get_time = () => performance.now();
let sleep = () => {};


// Devices
let devices = {};
//Mouse
devices.mouse = {
    x: 0,
    y: 0,
    vectorX: 0,
    vectorY: 0,
    clicked: false
};
document.onmousemove = event => {
    devices.mouse.vectorX = devices.mouse.x - event.pageX + 8;
    devices.mouse.vectorY = devices.mouse.y - event.pageY + 8;
    devices.mouse.x = event.pageX - 8;
    devices.mouse.y = event.pageY - 8;
};
document.onmousedown = () => {
    devices.mouse.clicked = true;
    devices.mouse.pressed = true;
};
document.onmouseup = () => {
    devices.mouse.clicked = false;
    devices.mouse.pressed = false;
};
//Keyboard
devices.keyboard = {
    keys: [],
    keyCodes: [],
    pressed: false,
    keyCode: 0,
    info: {},
};
document.onkeydown = event => {
    devices.keyboard.keyCodes[event.keyCode] = true;
    devices.keyboard.keys.push(event.key);
    devices.keyboard.pressed = true;
    devices.keyboard.info = event;
};
document.onkeyup = event => {
    devices.keyboard.keyCodes[event.keyCode] = false;
    devices.keyboard.pressed = false;
    devices.keyboard.info = event;
};
//Controllers
devices.controllers = [];
window.addEventListener("gamepadconnected", e => {
    console.log("Device: Controller " + e.gamepad.index + " connected (" + e.gamepad.id + ")");
    devices.controllers.push(e.gamepad);
});
window.addEventListener("gamepaddisconnected", e => {
    console.log("Device: Controller " + e.gamepad.index + " disconnected (" + e.gamepad.id + ")");
    devices.controllers.splice(e.gamepad, 1);
});
function get_devices() {
    return devices;
}