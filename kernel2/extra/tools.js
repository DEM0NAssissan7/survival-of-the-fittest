//Option variables

//Process performance information
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

//Process information gathering
Process.prototype.getInfo = function () {
    let attributes = [];
    attributes.push("Name: " + this.name);
    attributes.push("PID: " + this.PID);
    attributes.push("Priority: " + this.priority);
    attributes.push("Frametime: " + this.frametime);
    attributes.push("Execution Ratio: " + this.execRatio);
    return attributes;
};
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

//Process tools
function killall(processName) {
    let processNames = find(processName);
    for (let i = 0; i < processNames.length; i++) {
        kill(processNames[i]);
    }
}

//Kernel state
function reloadKernel(){
    try{
        for(var i = 0; i < processGroups.length; i++){
            resetSystem(processGroups[i]);
        }
        processes = resetSystem(processes);
        setup();
        console.log("Kernel successfully reloaded.");
    } catch {
        console.error("Kernel failed to reload.");
    }
}
function getTransition(size, time){
    return (Math.abs(size) / (1000 / kernelRealtimeLatency)) * (1000 / time);
}
function downloadKernelState() {
    var hiddenElement = document.createElement('a');
  
    hiddenElement.href = 'data:attachment/text,' + encodeURI(processGroups);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'state.oks';
    hiddenElement.click();
}
function loadKernelState(){
    var input = document.createElement('input');
    input.type = 'file';

    input.onchange = e => {
        processGroups = e.target.files[0]; 
    }

    input.click();
}
performanceDisplayFunction = () => {
    push();
    fill(127);
    rect(0, 0, 38, 30);
    stroke(0);
    fill(0);
    textSize(14);
    text(Math.round(kernelCyclesPerSecond), 10, 19);

    translate(38,0)
    fill(238, 170, 170);
    rect(0, 0, 38, 30);
    fill(0);
    text(Math.round(kernelRealtimeLatency), 10, 19);
    pop();
};