function largeProcessorStressTest() {
  for (var i = 0; i < 2; i++) {
    graphics.fillStyle = "#FF7777";
    graphics.fillRect(0, canvas.height - 400, 400, 400)
  }
}

function recurseProcess() {}

function jskernelStresstest() {
  console.log("Stressing process manager and scheduler");
  createProcess(function () { createProcess(function () { createProcess(recurseProcess) }) });
}
function overhead() {
  systemSuspend = false;
  processes = [];
  const processCount = 1000000;
  const beforeCreationTime = Date.now();
  for (var i = 0; i < processCount; i++) {
    createProcess(() => {}, 1);
  }
  let creationTime = Date.now() - beforeCreationTime;

  console.log("Processes have been created");
  console.log("Kernel overhead for creating " + processCount + " processes (in ms): " + creationTime);
  console.log("Kernel overhead for creating 1 processes (in ms): " + (creationTime / processCount));

  const updateCount = 1;
  let totalUpdateTimes = 0;
  for (var i = 0; i < updateCount; i++) {
    let beforeUpdateTime = Date.now();
    for (let i = 0; i < processes.length; i++) {
      processes[i].update();
    }
    totalUpdateTimes = Date.now() - beforeUpdateTime;
  }
  let updateTime = totalUpdateTimes / updateCount;

  console.log("Processes have ran.");
  console.log("Average kernel overhead for running " + processes.length + " processes (in ms): " + updateTime);
  console.log("Kernel overhead for running 1 processes (in ms): " + (updateTime / processes.length));


  //Test updateProcesses overhead
  let rawUpdateTime = updateTime;
  for (var i = 0; i < updateCount; i++) {
    let beforeUpdateTime = Date.now();
    updateSystem();
    totalUpdateTimes = Date.now() - beforeUpdateTime;
  }
  updateTime = totalUpdateTimes;

  console.log("- updateProcesses() function overhead test -");
  console.log("Processes have ran using updateProcesses.");
  console.log("Average kernel overhead for running " + processes.length + " processes with updateProcesses (in ms): " + updateTime);
  console.log("Kernel overhead for running 1 processes (in ms): " + (updateTime / processes.length));
  console.log("Using updateProcesses is " + Math.round(rawUpdateTime / updateTime * 100) + "% the speed of process.update()");
}

function capacity() {
  console.log("Testing kernel capacity");
  //Around 10,000,000 processes, a performance hit is noticable
  //(on my laptop)
  let beforeTime = Date.now();
  for (let i = 0; i < 10000000; i++) {
    createProcess(recurseProcess);
  }
  console.log("processes have been created");

}

function ultistress() {
  console.log("Testing ultimate kernel capacity");
  let processCount = 10000000;
  let beforeTime = Date.now();
  for (let i = 0; i < processCount; i++) {
    createProcess(recurseProcess);
  }
  let creationTime = Date.now() - beforeTime;
  console.log("processes have been created");
  console.log("it took " + creationTime + "ms to create " + processCount + " processes");

}

function schedulerResillience() {
  console.log("Stressing scheduler with huge processes");
  for (let i = 0; i < 1000; i++) {
    createProcess(largeProcessorStressTest);
  }
}







function testSuspend() {
  console.log("Testing suspend functionality");
  suspend(3);
  resume(3);
  suspendSystem(processes);
  resumeSystem(processes);
}

function testExtraProcessFunctionality() {
  console.log("Testing extra process functionality");
  find("TTY");
  PIDfind(4);
  totalFrametimes(processes);
}

function testInfoFunctions() {
  console.log("Testing process information functions");
  info(3);
  info(3, true);
}

function testKill() {
  console.log("Testing kill functionality");
  createProcess(jskernelStresstest);
  killall("Killall Test");
  kill(5);
}

function testInputs() {
  console.log("Testing input functionality");
  console.log("MouseX" + devices.mouse.x);
  console.log("MouseY" + devices.mouse.y);
  console.log("VectorX" + devices.mouse.vectorX);
  console.log("VectorY" + devices.mouse.vectorY);

  console.log("")
}

function stress() {
  let processesBuffer = [processes];
  let processGroupsBuffer = [processGroups];
  setTimeout(function () {
    let testFailed = false;
    var startTime = Date.now();
    try {
      schedulerResillience();
    } catch (error) {
      console.error("Scheduler Resillience failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      jskernelStresstest();
    } catch (error) {
      console.error("jskernelStresstest failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      overhead();
    } catch (error) {
      console.error("Overhead failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      testSuspend();
    } catch (error) {
      console.error("Suspend failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      testInfoFunctions();
    } catch (error) {
      console.error("Info functions failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      testKill();
    } catch (error) {
      console.error("Kill failed to run.");
      console.error(error);
      testFailed = true;
    }
    try {
      testExtraProcessFunctionality();
    } catch (error) {
      console.error("Extra process functionality failed to run.");
      console.error(error);
      testFailed = true;
    }

    if (testFailed) {
      console.error("The Octane kernel stress test FAILED.");
    } else {
      console.log("The jskernel stress test finished with no error!");
      console.log("It took " + (Date.now() - startTime) + " milliseconds to run all of the stress tests.");
    }
    console.warn("Resetting system back to previous state");
    console.log(processes)
    console.log(processesBuffer)
    processes = processesBuffer[0];
    processGroups = processGroupsBuffer[0];
  }, 100);
}