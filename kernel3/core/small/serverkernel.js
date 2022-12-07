//Option Variables
let idleSuspend = true;
let showPerformanceInfo = false;
let peremptiveKernel = true;

//Kernel objects
const startupTime = Date.now();
var Kernel = {
    id: System.name + " Kernel (Server)",
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
let kernelProcessExecutionLatency = targetKernelLatency;
let priorityTasks = [];
let schedulerIndex = 0;
{
    let schedulerLatency = 0;
    let schedulerLatencyTimer = performance.now();
    function trackSchedulerPerformance() {
        const performanceCache = performance.now();
        schedulerLatency = performanceCache - schedulerLatencyTimer;
        schedulerLatencyTimer = performanceCache;
    }
    create_process(trackSchedulerPerformance);
}
function scheduler() {
    const adjustedTargetLatency = (targetKernelLatency - (kernelRealtimeLatency - kernelProcessExecutionLatency));
    const targetEndTime = adjustedTargetLatency + Date.now();
    const accurateTargetTime = adjustedTargetLatency + performance.now();
    let stopLoop = false;
    function checkOvertime() {
        if (performance.now() < targetEndTime) {
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

//Kernel panic
function panic(message) {
    console.error("PANIC: " + message);
    panicProcesses = processes;
    processes = [];
    canvas = null;
    kernelPowerState = 11;
}

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