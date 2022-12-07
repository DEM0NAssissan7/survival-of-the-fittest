//Option Variables
const minimumCyclesPerSecond = 10;
let preemptiveKernel = true;
let idleSuspend = true;
let showPerformanceInfo = true;
let enableWatchdog = true;

//Kernel objects
const startupTime = Date.now();
var Kernel = {
    id: System.name + " Kernel",
    version: System.version,
    capibilities: [
        "Preemptive",
        "Scheduler",
        "Performance Tracking",
        "Power States",
        "Live Reclocking",
    ]
}

//Debug Logs
let kernelDebugs = [];
function DebugObject(message){
    this.time = Date.now() - startupTime;
    this.message = message;
}
function kernelDebug(message){
    kernelDebugs.push(new DebugObject(message));
}
function printKernelDebugs(){
    console.warn("Printing kernel debug logs");
    for(let i = 0; i < kernelDebugs.length; i++){
        console.log("[" + kernelDebugs[i].time + "]: " + kernelDebugs[i].message );
    }
}
kernelDebug("System ID: " + System.name + " " + System.version);//Print system info to the debug log
kernelDebug("Kernel ID: " + Kernel.id + " " + Kernel.version);//Print kernel info to the debug log

//Performance numbers
const targetKernelLatency = 1000 / minimumCyclesPerSecond;
let systemExecutionLatency = targetKernelLatency;
let kernelExecutionCycleCount = 0;
let kernelCycleLatency = 0;
let kernelCyclesPerSecond = 0;
const performanceSampleSize = Math.max(Math.round(minimumCyclesPerSecond / 10), 1);
function kernelLatencyReporter() {
    const dividedCycleCounter = kernelExecutionCycleCount % (performanceSampleSize * 2);
    if (dividedCycleCounter === 0) {
        this.time1 = performance.now();
    }
    if (dividedCycleCounter === performanceSampleSize) {
        this.time2 = performance.now();
    }
    kernelCycleLatency = Math.abs(this.time1 - this.time2) / performanceSampleSize;
    if (!kernelCycleLatency) {
        kernelCycleLatency = 1;
    }
    kernelCyclesPerSecond = Math.floor(1000 / kernelCycleLatency);

    kernelExecutionCycleCount++;
}
function trackPerformance(command) {
    let timeBefore = performance.now();
    command();
    return performance.now() - timeBefore;
}
//Track realtime performance
let kernelRealtimeLatency = 0;
function trackRealtimePerformance() {
    if (!this.init) {
        this.init = true;
        this.timer = performance.now();
        kernelDebug("Realtime performance tracker has been intiated.");
    }
    kernelRealtimeLatency = performance.now() - this.timer;
    this.timer = performance.now();
}

//Power state
let kernelPowerState = 0;
let kernelPowerStateManuallySet = false;
function setPowerState(powerState) {
    //Kernel will run at a clock of (2^powerstate)ms
    kernelPowerStateManuallySet = true;
    kernelPowerState = powerState;
    kernelLog("Power state has been manually altered.", "warning");
}
function resetPowerState() {
    kernelPowerStateManuallySet = false;
    kernelPowerState = 0;
    kernelLog("Power state has been restored.", "warning");
}

//Logs
let kernelLogs = [];
function LogObject(message, severity) {
    this.time = Date.now() - startupTime;

    this.message = message;
    this.severity = severity;
}
function kernelLog(message, severity) {
    let currentSeverity = "info";
    if (severity !== undefined) {
        currentSeverity = severity;
    }
    kernelLogs.push(new LogObject(message, currentSeverity));
    kernelDebugs.push(new DebugObject("Kernel log: " + message));
}
function printKernelLogs(severity) {
    function printKernelMessage(logObject) {
        return "[" + logObject.time + "]: " + logObject.message;
    }
    console.warn("Kernel log print triggered: ");
    kernelDebug("Kernel log print was called");
    for (let i = 0; i < kernelLogs.length; i++) {
        switch (kernelLogs[i].severity) {
            case "info":
                console.log(printKernelMessage(kernelLogs[i]));
                break;
            case "warning":
                console.warn(printKernelMessage(kernelLogs[i]));
                break;
            case "error":
                console.error(printKernelMessage(kernelLogs[i]));
                break;
            default:
                console.log(printKernelMessage(kernelLogs[i]));
        }
    }
}

//Processes
let processes = [];
let PIDs = 0;
let systemSuspend = false;
class Process {
    constructor(command, priority) {
        //Essential process traits
        this.command = command;
        this.PID = PIDs;
        this.processName = command.name;
        //Performance Tracking
        this.cycleCount = 0;
        this.runCount = 0;
        //Suspend
        this.suspend = false;
        this.manualSuspend = false;
        //Scheduler variables
        let currentPriority = 1;
        if (priority !== undefined) {
            currentPriority = priority;
        }
        this.priority = currentPriority;
        //Misc
        this.startTime = Date.now() - startupTime;
        this.dead = false;
        kernelDebug("Process " + PIDs + " has been created.");
        PIDs++;
    }
    run() {
        if (this.suspend === false && this.manualSuspend === false) {
            if (this.priority >= 0) {
                this.command();
                this.runCount++;
            } else if (this.priority < 0 && this.cycleCount % Math.abs(this.priority) === 0) {//Halftime execution
                this.command();
                this.runCount++;
            }
            this.cycleCount++;
        }
    }
};
let threads = [];
class Thread {
    constructor(command) {
        //Essential process traits
        this.command = command;
        //Misc
        this.ran = false;
    }
    run() {
        if(this.ran === true){
            kernelLog("A thread was called after already being ran.", "warning");
        }
        if (this.ran === false) {
            this.command();
            this.ran = true;
        }
    }
}
function createProcess(command, priority) {
    processes.push(new Process(command, priority));
}
function createThread(command) {
    threads.push(new Thread(command));
}
function kill(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].dead = true;
            kernelLog("Process " + PID + " killed", "warning");
        }
    }
}
function terminate(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes.splice(i);
            kernelLog("Process " + PID + " terminated", "warning");
        }
    }
}
function suspend(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = true;
            kernelLog("Process " + PID + " suspended", "warning");
        }
    }
}
function resume(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = false;
            processes[i].suspend = false;
            kernelLog("Process " + PID + " resumed", "warning");
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
        kernelLog("Process with PID " + process.PID + " failed to run: " + error, "error");
        systemError = [true, process, error];
    }
}
function runThread(thread) {
    try {
        thread.run();
    } catch (error) {
        console.error("A Thread encountered an error.");
        console.error(error);
        kernelLog("A Thread encountered an error.");
    }
}

let kernelProcessesLoopsPerSecond = 0;
let kernelProcessesExecutionCount = 0;

let kernelProcessExecutionLatency = targetKernelLatency;

let previousThreadLatency = 0;
let priorityTasks = [];
let schedulerIndex = 0;
let schedulerLatency = 0;
let schedulerLatencyTimer = performance.now();
function trackSchedulerPerformance() {
    const performanceCache = performance.now();
    schedulerLatency = performanceCache - schedulerLatencyTimer;
    schedulerLatencyTimer = performanceCache;
}
createProcess(trackSchedulerPerformance);
function scheduler() {
    const adjustedTargetLatency = (targetKernelLatency - (kernelRealtimeLatency - kernelProcessExecutionLatency));
    const targetEndTime = adjustedTargetLatency + Date.now();
    const accurateTargetTime = adjustedTargetLatency + performance.now();
    let stopLoop = false;
    function checkOvertime() {
        if (Date.now() < targetEndTime) {
            return false;
        } else {
            stopLoop = true;
            kernelDebug("Scheduler has gone overtime");
            return true;
        }
    }
    //Main process loop
    for (let c = 0; c < processes.length && performance.now() < accurateTargetTime; c++) {
        if (!(schedulerIndex < processes.length)) {//Index management
            schedulerIndex = 0;
        }

        //Thread runner
        while (threads.length > 0) {
            runThread(threads[0]);
            threads.splice(0, 1);
            if (checkOvertime()) {
                break;
            }
        }
        if (stopLoop === true) {
            break;
        }

        //Run priority tasks
        if (priorityTasks[schedulerIndex] !== undefined) {
            for (let i = 0; i < priorityTasks[schedulerIndex].length; i++) {
                runProcess(priorityTasks[schedulerIndex][i]);
            }
            priorityTasks.splice(schedulerIndex, 1);
            if (checkOvertime()) {
                break;
            }
        }

        //Process runner
        let process = processes[schedulerIndex];
        if (process.dead === true) {
            processes.splice(schedulerIndex, 1);
        } else {
            runProcess(process);
            for (let i = 0; i < process.priority - 1; i++) {//Priority
                let index = (Math.round(((processes.length) / process.priority) * i) + (schedulerIndex + 1)) % (processes.length);
                if (priorityTasks[index] === undefined) {
                    priorityTasks[index] = [];
                }
                priorityTasks[index].push(process);
            }
        }
        schedulerIndex++;//Index management
    }
}

function updateKernelProcesses() {
    if (systemSuspend === false && systemError[0] !== true && processes.length > 0) {
        let timeBefore = performance.now();
        //Sort processes by priority depending on if the kernel is preemtive
        if (preemptiveKernel === true) {
            scheduler();
        } else {
            //Non-preemptive
            for (let i = 0; i < processes.length; i++) {
                while (threads.length > 0) {
                    runThread(threads[0]);
                    threads.splice(0, 1);
                }
                if (priorityTasks[i] !== undefined) {//Run priority tasks
                    for (let l = 0; l < priorityTasks[i].length; l++) {
                        runProcess(priorityTasks[i][l]);
                    }
                    priorityTasks.splice(i, 1);
                }
                let process = processes[i];
                if (process.dead === true) {
                    processes.splice(i, 1);
                } else {
                    runProcess(process);
                    for (let i = 0; i < process.priority - 1; i++) {//Priority
                        let index = (Math.round(((processes.length) / process.priority) * i) + (schedulerIndex + 1)) % (processes.length);
                        if (priorityTasks[index] === undefined) {
                            priorityTasks[index] = [];
                        }
                        priorityTasks[index].push(process);
                    }
                }
            }
        }
        kernelProcessesExecutionCount++;
        kernelProcessExecutionLatency = performance.now() - timeBefore;
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
function keyboardConfigurationDaemon() {
    devices.keyboard.keys = [];
}
//Controllers
devices.controllers = [];
window.addEventListener("gamepadconnected", e => {
    kernelLog("Device: Controller " + e.gamepad.index + " connected (" + e.gamepad.id + ")", "info");
    devices.controllers.push(e.gamepad);
});
window.addEventListener("gamepaddisconnected", e => {
    kernelLog("Device: Controller " + e.gamepad.index + " disconnected (" + e.gamepad.id + ")", "info");
    devices.controllers.splice(e.gamepad, 1);
});

//System suspend
function suspendSystem(processesArray) {
    for (let i = 0; i < processesArray.length; i++) {
        processesArray[i].suspend = true;
    }
    kernelDebug("System was suspended");
}
function resumeSystem(processesArray) {
    for (let i = 0; i < processesArray.length; i++) {
        processesArray[i].suspend = false;
    }
    kernelDebug("System was resumed");
}

//Kernel panic
let panicProcesses = [];
let panicWindow = [];
function panic(message) {
    let panicMessage = "A kernel panic has occured. System is unusable.";
    if (message !== undefined) {
        panicMessage = message;
    }
    enableWatchdog = false;
    console.error("PANIC: " + panicMessage);
    kernelLog("FATAL - Kernel Panic (" + panicMessage + ")", "error");

    panicProcesses = processes;
    kernelLog("Check the panicProcesses variable for the process state before the system went down.", "info");
    panicProcesses = processes;
    kernelLog("Check the panicWindow for the window state before the system went down.", "info");

    processes = [];
    printKernelLogs();

    canvas = null;
    monitorFramerate = null;
    alert("Kernel panic -> " + panicMessage);
    kernelPowerState = 11;
}

//Kernel watchdog
let watchdogCycleCountBuffer = 0;
let watchdogSafetyTimer = 0;
let watchdogHangTimer = false;
let kernelWatchdogTriggerCount = 0;
function watchdog() {
    if (enableWatchdog === true) {
        if (kernelExecutionCycleCount === watchdogCycleCountBuffer && watchdogHangTimer === false) {
            kernelLog("Watchdog: Kernel watchdog timer triggered", "warning");
            watchdogSafetyTimer = Date.now();
            watchdogHangTimer = true;
            kernelWatchdogTriggerCount++;
        } else if (kernelExecutionCycleCount !== watchdogCycleCountBuffer) {
            watchdogCycleCountBuffer = kernelExecutionCycleCount;
            watchdogHangTimer = false;
        }
        if (watchdogHangTimer === true && Date.now() - watchdogSafetyTimer >= 4300) {
            panic("Kernel watchdog has detected that your system is hung.");
        }
        if (kernelWatchdogTriggerCount > 5) {
            kernelLog("Watchdog: The watchdog has been called many times. The system is freezing a lot. Are there heavy processes running?", "warning");
        }
    }
}
setInterval(() => { watchdog() }, 2500);//run kernel watchdog every 2.5 seconds

//Kernel reset
function resetKernel() {
    kernelDebug("Kernel was reset");
    let processesBuffer = [];
    for (let i = 0; i < processes.length; i++) {
        processesBuffer[i] = new Process(processes[i].command, processes[i].priority);
    }
}

//Graphics
kernelDebug("Initializing graphics");
let canvas = document.createElement("canvas");
if (!canvas) {
    kernelLog("Graphics: Failed to create canvas.", "error");
}
let graphics = canvas.getContext('2d');
if (!graphics) {
    kernelLog("Graphics: Failed to load 2d context.", "error");
}
let webgl = canvas.getContext('webgl');
if (!webgl) {
    kernelLog("Graphics: Failed to load webgl context.", "warning");
}
kernelDebug("Appending canvas to document");
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

//System suspend daemon. Responsible for suspending on inactivity/unfocused and with keyboard shortcut.
let mouseInactivityTimer = 0;
let systemKeySuspended = false;
function suspendResponseDaemon() {
    //Inactivity suspend
    if (idleSuspend === true) {
        if (devices.mouse.vectorX === 0 && devices.mouse.vectorY === 0 && !devices.keyboard.pressed && !devices.mouse.pressed) {
            mouseInactivityTimer += systemExecutionLatency / 1000;
        }
        if (document.hasFocus()) {
            mouseInactivityTimer = 0;
            if (this.inactive === true) {
                systemSuspend = false;
                kernelDebug("System was resumed");
                this.inactive = undefined;
            }
        }
        if (mouseInactivityTimer > 30 && this.inactive === undefined || !document.hasFocus() && this.inactive === undefined) {
            systemSuspend = true;
            this.inactive = true;
            kernelDebug("System was suspended");
        }
    }
    //Suspend keyboard shortcut
    if (devices.keyboard.keyCodes[192] && this.suspended === undefined) {
        systemSuspend = true;
        this.suspended = true;
        kernelLog("System has been manually suspended.", "warning");
    }
    if (this.suspended && devices.keyboard.keyCodes[192] !== true) {
        systemKeySuspended = true;
        if (devices.keyboard.info.pressed) {
            systemSuspend = false;
            this.suspended = undefined;
            systemKeySuspended = false;
            kernelLog("System has been manually resumed.", "warning");
        }
    }
    if (kernelPowerStateManuallySet === false && systemSuspend === true) {
        kernelPowerState = 9;
    } else if (kernelPowerStateManuallySet === false) {
        kernelPowerState = 0;
    }
}


/* Create process example:
createProcess(command, priority);
createProcess(foo, 1);
createProcess(foo1, 0);
createProcess(foo2, 0);
*/


//Kernel loop
let kernelLoopTimeoutId;
let loopKernel = true;
function stopKernelLoop() {
    clearTimeout(kernelLoopTimeoutId);
    loopKernel = false;
    kernelLog("Kernel loop has been stopped.", "warning");
}
function executeKernel() {
    let timeBefore = performance.now();
    //Suspend hotkey daemon
    suspendResponseDaemon();
    //Update processes
    updateKernelProcesses();
    //Error screen daemon
    errorScreenDaemon();
    //Run keyboard daemon
    keyboardConfigurationDaemon();

    //Calculate and report latency
    kernelLatencyReporter();
    //Report realtime performance
    trackRealtimePerformance();
    //Show performance info
    performanceDisplay();
    //Report performance
    systemExecutionLatency = performance.now() - timeBefore;

    //Set an asynchronous timeout so the kernel executes itself again
    kernelLoopTimeoutId = setTimeout(executeKernel, Math.pow(2, kernelPowerState));
}
//Run kernel
try{
    kernelDebug("Doing initial kernel execution");
    executeKernel();
} catch (e) {
    kernelLog("Kernel did not load.", "error");
    kernelLog(e, "error");
    panic("Kernel was unable to execute: " + e);
} finally {
    console.log("Kernel has successfully loaded.");
    kernelLog("Kernel has successfully loaded.", "info");
}