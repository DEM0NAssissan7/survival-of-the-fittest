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

let current_process;
let perf = {realtime: 0};
let perf_marker = performance.now();
let _time;
let sched = function () {
    for(let i = 0; i < processes.length; i++) {
        current_process = processes[i];

        exit = function () {
            current_process.suspended = true;
            processes.splice(i, 0);
            i--;
        }
        if(!current_process.suspended)
            for(let thread of current_process.threads)
                thread();

        _time = performance.now();
        perf.realtime = _time - perf_marker;
        perf_marker = _time;
    }
}

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
let devices = {
    mouse: {},
    keyboard: {},
    controllers: []
};
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
function get_devices() {
    return devices;
}
//Controllers
devices.controllers = [];