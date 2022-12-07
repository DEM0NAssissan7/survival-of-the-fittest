//Option Variables
var targetCyclesPerSecond = 70;
var disableScheduler = false;
var trackPerformance = false;
var idleSuspend = true;

//Performance numbers/ kernel clock tracker
var systemExecutionLatency = 0;
var kernelExecutionCycleCount = 0;
var kernelCycleLatency = 0;
var kernelCyclesPerSecond = 0;
var performanceSampleSize = Math.floor(targetCyclesPerSecond / 10);
function kernelLatencyReporter() {
    var dividedCycleCounter = kernelExecutionCycleCount % (performanceSampleSize * 2);
    if (dividedCycleCounter === 0) {
        this.time1 = Date.now();
    }
    if (dividedCycleCounter === performanceSampleSize) {
        this.time2 = Date.now();
    }
    kernelCycleLatency = Math.abs(this.time1 - this.time2) / performanceSampleSize;
    kernelCyclesPerSecond = Math.floor(1000 / kernelCycleLatency);
}

//Scheduler
var targetKernelLatency = 1000 / targetCyclesPerSecond
function schedulerSolidPriorityKernelPerformance(self) {
    return (kernelCycleLatency / targetKernelLatency) * self.priority;
    //R = (L/t)*p
}

//Process class
let processes = [];
let systemSuspend = false;
class Process {
    constructor(command, name, priority, processesArray, scheduler) {
        //Essential process traits
        this.command = command;
        this.processesArray = processesArray;
        this.PID = processesArray.length;
        this.processName = name;
        //Performance Tracking
        this.trackPerformance = trackPerformance;
        this.frametime = 0;
        //Execution Ratio
        this.execRatio = 1;
        this.cycleCount = 0;
        //Suspend
        this.suspend = false;
        this.manualSuspend = false;
        //Scheduler
        this.disableScheduler = disableScheduler;
        this.scheduler = scheduler;
        this.prioritySum = 0;
        if (priority === 0) {
            this.disableScheduler = true;
        }
        this.priority = priority;
    }
    update() {
        if (this.suspend === false && this.manualSuspend === false) {
            this.cycleCount++;
            if (this.cycleCount > this.execRatio) {
                this.cycleCount -= this.execRatio;
                //Frametime
                if (this.trackPerformance === false) {
                    this.command();
                } else {
                    let timeBefore = Date.now();
                    this.command();
                    this.frametime = Date.now() - timeBefore;
                }
                //Scheduler
                if (this.disableScheduler === false) {
                    this.execRatio = this.scheduler(this);
                    if (this.execRatio < 1) {
                        this.execRatio = 1;
                    }
                }
            }
        }
    }
};

//Process/groups manager
var processesGroup = [];
var processGroups = [];
function createProcess(command, name, priority, group, scheduler) {
    //Default process group
    let currentProcessesGroup;
    if (group === undefined) {
        currentProcessesGroup = processesGroup;
    } else {
        currentProcessesGroup = group;
    }
    //Priority
    let currentPriority = 1;
    if (priority < 0) {
        currentPriority = -1 / priority;
    } else if (priority > 0) {
        this.priority = priority;
    } else if (priority === 0) {
        currentPriority = 0;
    }
    //Scheduler
    let currentScheduler;
    if (scheduler === undefined) {
        currentScheduler = schedulerSolidPriorityKernelPerformance;
    } else {
        currentScheduler = scheduler;
    }
    var process = new Process(command, name, currentPriority, processes, currentScheduler);
    processes.push(process);
    processes[0].prioritySum += currentPriority;
    currentProcessesGroup.push(process);
}
function kill(PID, quiet) {
    for (var i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].dead = true;
            processes[0].prioritySum -= processes[i].priority;
            processes.splice(i, 1);
            if (quiet !== true) {
                console.warn("Process " + PID + " killed");
            }
        }
    }
}
let systemError = [];
function updateProcesses(processGroup) {
    if (systemSuspend === false) {
        for (let i = 0; i < processGroup.length; i++) {
            if (processGroup[i].dead === true) {
                processGroup.splice(i, 1);
                break;
            }
            try {
                processGroup[i].update();
            } catch (error) {
                console.error("Process with PID " + processGroup[i].PID + " encountered an error.");
                console.error(error);
                systemError = [true, processGroup[i], error];
            }
        }
    }
}
function ProcessGroup(groupProcesses, groupName) {
    this.processes = groupProcesses;
    this.name = groupName;
    this.frametime = 0;
}
ProcessGroup.prototype.update = function () {
    var timeBefore = Date.now();
    updateProcesses(this.processes);
    this.frametime = Date.now() - timeBefore;
}
function addProcessGroup(processGroup, name) {
    processGroups.push(new ProcessGroup(processGroup, name));
}
function updateSystem() {
    for (var i = 0; i < processGroups.length; i++) {
        processGroups[i].update();
    }
}
function suspend(PID) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = true;
            console.warn("Process " + PID + " suspended");
        }
    }
}
function resume(PID, quiet) {
    for (let i = 0; i < processes.length; i++) {
        if (processes[i].PID === PID) {
            processes[i].manualSuspend = false;
            processes[i].suspend = false;
            console.warn("Process " + PID + " resumed");
        }
    }
}

//Startup processes
var startups = [];
function createStartup(command) {
    startups.push(() => { command(); });
}
function runStartups(startupArray) {
    for (var i = 0; i < startupArray.length; i++) {
        if (startupArray[i].started === undefined) {
            startupArray[i]();
            startupArray[i].started = true;
        }
    }
}

//Input management
//Mouse
var mouseInfo = () => {
    this.x = 0;
    this.y = 0;
    this.vectorX = 0;
    this.vectorY = 0;
    this.clicked = false;
};
var mouseArray = mouseInfo;//Depricated
document.onmousemove = function (event) {
    mouseInfo.vectorX = mouseInfo.x - event.pageX;
    mouseInfo.vectorY = mouseInfo.y - event.pageY;
    mouseInfo.x = event.pageX;
    mouseInfo.y = event.pageY;
};
document.onmousedown = function () {
    mouseInfo.clicked = true;
};
document.onmouseup = function () {
    mouseInfo.clicked = false;
};
//Keyboard
var keyboardKeyArray = [];
var keyboardArray = [];
var keyboardInfo = function () {
    this.pressed = false;
    this.keyCode = 0;
};
document.onkeydown = function (event) {
    keyboardArray[event.keyCode] = true;
    keyboardKeyArray.push(event.key);
    keyboardInfo = event;
    keyboardInfo.pressed = true;
};
document.onkeyup = function (event) {
    keyboardArray[event.keyCode] = false;
    keyboardInfo = event;
    keyboardInfo.pressed = false;
};
function keyboardConfigurationDaemon() {
    keyboardKeyArray = [];
}
//Controllers
var controllerArray = [];
window.addEventListener("gamepadconnected", function (e) {
    console.log("Gamepad %d connected (%s).",
        e.gamepad.index, e.gamepad.id);
    controllerArray.push(e.gamepad);
});
window.addEventListener("gamepaddisconnected", function (e) {
    console.log("Gamepad: %d disconnected (%s)",
        e.gamepad.index, e.gamepad.id);
    controllerArray.splice(e.gamepad, 1);
});

//System suspend
function suspendSystem(processesArray, quiet) {
    for (let i = 0; i < processesArray.length; i++) {
        processesArray[i].suspend = true;
    }
    if(quiet !== true){
        console.warn("System has been suspended.");
    }
}
function resumeSystem(processesArray, quiet) {
    for (let i = 0; i < processesArray.length; i++) {
        processesArray[i].suspend = false;
    }
    if(quiet !== true){
        console.warn("System has been resumed.");
    }
}

//Kernel panic
function panic() {
    noLoop();
    remove();
    suspendSystem(processes);
    var panicMessage = "SYSTEM HAS ENCOUNTERED A KERNEL PANIC. SYSTEM IS NOW DEEMED UNUSABLE.";
    console.error(panicMessage);
    monitorFramerate = null;
    alert(panicMessage);
}

//Kernel reset
function resetSystem(processesArray) {
    let groupBuffer = [];
    for (let i = 0; i < processesArray.length; i++) {
        let currentProcess = processesArray[i];
        groupBuffer.push(new Process(currentProcess.command, currentProcess.processName, currentProcess.priority, groupBuffer, currentProcess.scheduler));
    }
    return groupBuffer;
}

//Graphics
/*let canvas = document.getElementById('canvas');
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 21;
let graphics = canvas.getContext('2d');
*/
//Error screen daemon
function octaneError(process, processError) {
    var killConfirmation = confirm("Process " + process.PID + " encountered an error: --> " + processError + " <-- Attempting to kill the errored process.");
    if (killConfirmation === false) {
        try {
            process.command();
        } catch (error) {
            alert("Process " + process.PID + " failed to run again. Killing process.");
            console.log(error);
            kill(process.PID);
        }
    } else {
        kill(process.PID);
    }
    systemError = [];
}
let errorScreenFunction = octaneError;
function errorScreenDaemon() {
    if (systemError[0] === true) {
        errorScreenFunction(systemError[1], systemError[2]);
    }
}

//System suspend daemon. Responsible for suspending on inactivity/unfocused and with keyboard shortcut.
var mouseInactivityTimer = 0;
function suspendResponseDaemon() {
    //Inactivity suspend
    if (idleSuspend === true) {
        if (mouseInfo.vectorX === 0 && mouseInfo.vectorY === 0 && !keyboardInfo.pressed && !mouseInfo.pressed) {
            mouseInactivityTimer += systemExecutionLatency / 1000;
        }
        if (document.hasFocus()) {
            mouseInactivityTimer = 0;
            if (this.inactive === true) {
                systemSuspend = false;
                this.inactive = undefined;
            }
        }
        if (mouseInactivityTimer > 30 && this.inactive === undefined || !document.hasFocus() && this.inactive === undefined) {
            systemSuspend = true;
            this.inactive = true;
        }
    }
}


/* Create process example:
createProcess(command, name, priority, processGroup, scheduler);
createProcess(foo, "foo", 1, processes);
var myProcessGroup = [];
createProcess(foo, "foo", 0, myProcessGroup);
createProcess(foo1, "foo1", 2, myProcessGroup);
*/

//Configure and run the kernel
addProcessGroup(processesGroup, "Kernel Group");
function executeKernel() {
    //Get the time before execution
    var timeBefore = Date.now();
    //Suspend hotkey daemon
    suspendResponseDaemon();
    //Update processes
    updateSystem();
    //Error screen daemon
    errorScreenDaemon();
    
    //Calculate and report latency
    kernelLatencyReporter();
    //Report back kernel cycles per second
    kernelExecutionCycleCount++;
    //Report back the time it took to execute the kernel
    systemExecutionLatency = Date.now() - timeBefore;
    
    //Set a timeout so the kernel executes itself again
    setTimeout(executeKernel, 0);
}
executeKernel();//Run the kernel
