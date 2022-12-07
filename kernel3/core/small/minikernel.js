//Option Variables
let idleSuspend = true;
let showPerformanceInfo = false;

//Kernel objects
const startupTime = Date.now();
var Kernel = {
    id: System.name + " minikernel",
    version: System.version,
    capibilities: [
        "Power States",
        "Live Reclocking",
    ]
}

//Track realtime performance
let kernelRealtimeLatency = 0;
function trackRealtimePerformance() {
    if (!this.init) {
        this.init = true;
        this.timer = performance.now();
    }
    kernelRealtimeLatency = performance.now() - this.timer;
    this.timer = performance.now();
}

//Power state
let kernelPowerState = 0;

//Processes
let processes = [];
let PIDs = 0;
class Process {
    constructor(command) {
        //Essential process traits
        this.command = command;
        this.PID = PIDs;
        //Suspend
        this.suspend = false;
        this.manualSuspend = false;
        //Misc
        this.dead = false;
        PIDs++;
    }
    run() {
        if (this.suspend === false && this.manualSuspend === false) {
            this.command();
        }
    }
};
let threads = [];
class Thread {
    constructor(command) {
        //Essential process traits
        this.command = command;
    }
    run() {
        this.command();
    }
}
function create_process(command) {
    processes.push(new Process(command));
}
function create_thread(command) {
    threads.push(new Thread(command));
}
function kill(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].dead = true;
        }
    }
}
function terminate(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes.splice(i);
        }
    }
}
function suspend(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = true;
        }
    }
}
function resume(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = false;
            processes[i].suspend = false;
        }
    }
}
let systemError = [];
function runProcess(process) {
    try {
        process.run();
    } catch (error) {
        console.error("Process with PID " + process.PID + " encountered an error.");
        console.error(error);
        systemError = [true, process, error];
    }
}
function runThread(thread) {
    try {
        thread.run();
    } catch (error) {
        console.error("A Thread encountered an error.");
        console.error(error);
    }
}

//Process runner
let systemSuspend = false;
function updateKernelProcesses() {
    if (systemSuspend === false && systemError[0] !== true && processes.length > 0) {
        //Non-preemptive
        for (let i = 0; i < processes.length; i++) {
            while (threads.length > 0) {
                runThread(threads[0]);
                threads.splice(0, 1);
            }
            let process = processes[i];
            if (process.dead === true) {
                processes.splice(i, 1);
            } else {
                runProcess(process);
            }
        }
    }
}

//Input management
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
    devices.mouse.vectorX = devices.mouse.x - event.pageX;
    devices.mouse.vectorY = devices.mouse.y - event.pageY;
    devices.mouse.x = event.pageX;
    devices.mouse.y = event.pageY;
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
devices.keyboard.keyCodes = [];
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
    devices.controllers.push(e.gamepad);
});
window.addEventListener("gamepaddisconnected", e => {
    devices.controllers.splice(e.gamepad, 1);
});

//Kernel panic
function panic(message) {
    console.error(message);
    panicProcesses = processes;
    panicProcesses = processes;
    processes = [];
    canvas = null;
    alert("Kernel panic -> " + message);
    kernelPowerState = 11;
}

//Graphics
let canvas = document.createElement("canvas");
let graphics = canvas.getContext('2d');
canvas.id = "canvas";
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 21;
document.body.appendChild(canvas);

//Error screen daemon
let errorScreenFunction = (process, processError) => {//Default error
    let killConfirmation = confirm("Process " + process.PID + " encountered an error: --> " + processError + " <-- Attempting to kill the errored process.");
    if (killConfirmation === false) {
        try {
            process.command();
        } catch (error) {
            alert("Process " + process.PID + " failed to run again. Killing process.");
            console.error(error);
            process.dead = true;
        }
    } else {
        process.dead = true;
    }
    systemError = [];
};
function errorScreenDaemon() {
    if (systemError[0] === true) {
        errorScreenFunction(systemError[1], systemError[2]);
    }
}

//Performance Display
let performanceDisplayFunction = () => {
    //TODO: Add performance display for native kernel
};
function performanceDisplay() {
    if (showPerformanceInfo === true) {
        performanceDisplayFunction();
    }
}

//System suspend daemon. Responsible for suspending on unfocused
function suspendResponseDaemon() {
    //Inactivity suspend
    if (idleSuspend === true) {
        if (document.hasFocus()) {
            systemSuspend = false;
        }
        if (!document.hasFocus()) {
            systemSuspend = true;
        }
    }
    if (systemSuspend === true) {
        kernelPowerState = 9;
    } else {
        kernelPowerState = 0;
    }
}

//Compatibility
let schedulerLatency = 0;
let kernelCyclesPerSecond = 0;
function compatibilityDaemon(){
    schedulerLatency = kernelRealtimeLatency;
    kernelCyclesPerSecond = 1000/kernelRealtimeLatency;
}

//Kernel loop
function executeKernel() {
    //Suspend daemon
    suspendResponseDaemon();
    //Update processes
    updateKernelProcesses();
    //Error screen daemon
    errorScreenDaemon();

    //Report realtime performance
    trackRealtimePerformance();
    //Compatibility
    compatibilityDaemon();
    //Show performance info
    performanceDisplay();

    //Set an asynchronous timeout so the kernel executes itself again
    setTimeout(executeKernel, Math.pow(2, kernelPowerState));
}
//Run kernel
try{
    executeKernel();
} catch (e) {
    panic("Kernel was unable to execute: " + e);
} finally {
    console.log("Kernel has successfully loaded.");
}