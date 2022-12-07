//Add getInfo to the process function
Process.prototype.getInfo = function () {
    let attributes = [];
    attributes.push("Name: " + this.name);
    attributes.push("PID: " + this.PID);
    attributes.push("Priority: " + this.priority);
    attributes.push("Frametime: " + this.frametime);
    attributes.push("Execution Ratio: " + this.execRatio);
    return attributes;
};
function totalFrametimes(processesArray) {
    let currentProcessesArray = processes;
    if (processesArray) {
        currentProcessesArray = processesArray;
    }
    //Get total frametimes from all processes
    let totalFrametime = 0;
    for (let i = 0; i < currentProcessesArray.length; i++) {
        let currentProcess = currentProcessesArray[i];
        if (!currentProcess.suspend && !currentProcess.manualSuspend) {
            totalFrametime += currentProcess.frametime;
        }
    }
    return totalFrametime;
}
function PIDfind(PID) {
    let foundProcess;
    for (let i = 0; i < processes.length; i++) {
        let currentProcess = processes[i];
        if (PID === currentProcess.PID) {
            foundProcess = currentProcess;
        }
    }
    return foundProcess;
}
function info(PID) {
    return PIDfind(PID).getInfo();
}
function find(processName) {
    let foundProcesses = [];
    for (let i = 0; i < processes.length; i++) {
        let currentProcess = processes[i];
        if (processName === currentProcess.processName) {
            foundProcesses.push(currentProcess.PID);
        }
    }
    return foundProcesses;
}
function killall(processName) {
    let processNames = find(processName);
    for (let i = 0; i < processNames.length; i++) {
        kill(processNames[i]);
    }
}
function reloadKernel(){
    try{
        for(var i = 0; i < processGroups.length; i++){
            resetSystem(processGroups[i]);
        }
        processes = resetSystem(processes);
        setup();
        console.log("Kernel successfully reloaded.");
    } catch {
        console.error("Kernel failed to reloaded.");
    }
}
function getTransition(size, time){
    return (Math.abs(size) / kernelCyclesPerSecond) * (1000 / time);
}