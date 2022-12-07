/* Copyright Abdurahman Elmawi 2022

The kernel is the javascript hypervisor. All functions that a program runs should go 
through the kernel, either from create_process() or push_process()

The job of the hypervisor is to:
    1. Provide simple APIs for programmers to do what they want with their programs
    2. Centralize and coordinate all programs running on the system
    3. Keep track of program performance and help developers understand their programs
    4. Create a set of security and stability protocols in order to maintain the system
    5. Correct the faults of javascript

*/

const Kernel = {
    name: undefined,
    version: undefined,
    capibilities: [
        "Scheduler",
        "Live Reclocking",
        "Power Management",
        "Overload Protection",
        "Modular",
        "Networking"
    ],
    start_time: Date.now()
};

if (typeof System === "object") {
    Kernel.name = System.name + " Kernel";
    Kernel.version = System.version;
} else {
    console.warn("There was no System defined.");
    Kernel.name = "Unnamed Kernel";
    Kernel.version = "0.0";
}

let canvas, graphics, webgl;

{
    //Option variables
    const suspend_on_unfocus = true;
    const print_debug_logs = false;
    const print_error_logs = true;
    const minimum_cycle_rate = 10;
    const display_performance = true;

    //Customization variables
    const run_loop = true;
    const track_performance = true;
    const manage_power = true;

    const use_graphics = false;
    const use_devices = true;
    const use_networking = true;
    const reassign_jsapi = true;

    const do_logging = true;
    const error_handler = true;
    const track_cycle_info = true;

    const use_watchdog = true;
    const overload_protection = true;

    //Auto-set constants
    const windowed = (typeof window !== "undefined");
    const is_browser = (typeof document === "object");

    //Debug logging
    let debug = function () { };
    let warn = function () { };
    let error = function () { };
    if (do_logging === true) {
        let debug_logs = [];
        let debug_object = function (message, level) {
            this.message = message;
            this.level = level;
            this.date = Date.now();
        }
        debug = function (message) {
            debug_logs.push(new debug_object(message, 0));
            if (print_debug_logs === true)
                console.debug(message);
        }
        warn = function (message) {
            debug_logs.push(new debug_object(message, 1));
            if (print_debug_logs === true)
                console.warn(message);
        }
        error = function (message) {
            debug_logs.push(new debug_object(message, 2));
            if (print_error_logs === true)
                console.error(message);
        }
        function print_kernel_debug() {
            debug("Printing kernel debug logs");
            console.warn("Printing kernel debug logs");
            let parsed_kernel_logs = "";
            for (let i = 0; i < debug_logs.length; i++) {
                let log = debug_logs[i];
                let message_parse = "[" + (log.date - Kernel.start_time) + "] " + log.message;
                parsed_kernel_logs += message_parse + "\n";
                switch (log.level) {
                    case 0:
                        console.debug(message_parse);
                        break;
                    case 1:
                        console.warn(message_parse)
                        break;
                    case 2:
                        console.error(message_parse)
                        break;
                }
            }
            return parsed_kernel_logs;
        }
    }

    //Panic
    let panicked = false;
    let panic = function (message) {
        if (panicked === false) {
            panicked = true;
            clear_timers();
            kernel_daemons = [];
            console.error("Critical: Kernel panic (" + message + ")");
            error("Kernel panicked: " + message);
            processes = [];
            threads = [];
            print_kernel_debug();
            if (windowed === true)
                alert("Kernel panic -> " + message);
        }
    }

    //Timing profile
    let time_tracker;
    {
        let continue_testing = true;
        let test_time_tracker = function (handler) {
            if (continue_testing === true) {
                try {
                    handler();
                } catch (e) {

                } finally {
                    continue_testing = false;
                    time_tracker = handler;
                }
            }
        }
        test_time_tracker(() => { return performance.now(); });
        test_time_tracker(() => { return Date.now(); });
        test_time_tracker(() => { return millis(); });
        if (continue_testing === true)
            panic("No time tracker was able to be established.");
    }
    function get_time() {
        return Math.floor(time_tracker() * 100) / 100;
    }

    //Javascript API reassignment
    let set_timeout = setTimeout;
    let set_interval = setInterval;
    if (reassign_jsapi === true) {
        debug("Reassigning Javascript APIs for security");
        setTimeout = function () {
            warn("setTimeout was called.");
        }
        setInterval = function () {
            warn("setInterval was called.");
        }
    }

    //Statistics
    let statistics = [];
    let Statistic = function (name) {
        this.statistic_name = name;
        this.value = 0;
    }
    let create_statistic = function (name) {
        statistics.push(new Statistic(name));
    }
    let find_statistic = function (name) {
        for (let i = 0; i < statistics.length; i++)
            if (statistics[i].statistic_name === name)
                return statistics[i];
        return null;
    }
    let increment_statistic = function (name) {
        find_statistic(name).value++;
    }
    let get_statistic = function (name) {
        return find_statistic(name).value;
    }
    function get_kernel_statistics() {
        return JSON.parse(JSON.parse(statistics));
    }

    //Hashing
    function hash(num) {
        let result = 0;
        for (let i = 0; i <= num; i++) {
            result += num * (Math.sqrt(i) * (i + 1)) - num;
            result = result >> 1;
        }
        result += num;
        result = Math.round(result);
        return result;
    }
    function hash_string(string) {
        let result = 0;
        for (let i = 0; i < string.length; i++) {
            let char = string[i].charCodeAt();
            result += char * (Math.sqrt(char) * (i + 1)) - char;
            result = result >> 1;
        }
        return result;
    }

    //Kernel key management
    const kernel_key = hash(Math.random() * 1000);
    function get_kernel_key() {
        console.warn("[" + (Date.now() - Kernel.start_time) + "]: Kernel key was accessed.");
        let confirmation = true;
        if (windowed === true)
            confirmation = confirm("A program is requesting root access. Accept?");
        if (confirmation === true) {
            warn("The kernel key was accessed");
            return kernel_key;
        } else {
            error("The kernel key was requested, but declined.");
            return Math.random();
        }
    }

    //Internal use functions
    let run_command_buffer = function (command) {
        (function () { command(); })();
    }

    //Kernel daemons
    let kernel_daemons = [];
    let Kernel_daemon = function (handler) {
        this.command = handler;
        this.daemon_name = handler.name;
    }
    Kernel_daemon.prototype.run = function () {
        try {
            run_command_buffer(this.command);
        } catch (e) {
            console.error(e);
            panic("Kernel daemon '" + this.daemon_name + "' encountered an error.");
        }
    }
    let add_kernel_daemon = function (handler) {
        kernel_daemons.push(new Kernel_daemon(handler));
        return kernel_daemons.length - 1;
    }
    let run_kernel_daemons = function () {
        for (let i = 0; i < kernel_daemons.length; i++)
            kernel_daemons[i].run();
    }

    //Root execution
    function run_as_root(command_string, key) {
        let command_output;
        if (key === kernel_key) {
            command_output = eval(command_string);
            debug("'" + command_string + "' was run at kernel level");
        } else
            error("A security breach was detected. Command '" + command_string + "' was attempted to be run at root level.");
        return command_output;
    }

    //Uptime
    function raw_uptime() {
        let full_uptime = Date.now() - Kernel.start_time
        let suspended_time = get_suspended_time();
        let result = {
            total: full_uptime,
            suspended: suspended_time,
            active: full_uptime - suspended_time
        }
        return result;
    }
    function uptime() {
        let uptime_message;
        {
            let uptime_buffer = raw_uptime().total;
            let seconds = Math.floor(uptime_buffer / 1000 % 60)
            let minutes = Math.floor(uptime_buffer / 1000 / 60 % 60);
            let hours = Math.floor(uptime_buffer / 1000 / 3600);
            uptime_message = "Total: " + hours + ":" + minutes + ":" + seconds;
        }

        let running_message;
        {
            let active_uptime = raw_uptime().active;
            let seconds = Math.floor(active_uptime / 1000 % 60);
            let minutes = Math.floor(active_uptime / 1000 / 60 % 60);
            let hours = Math.floor(active_uptime / 1000 / 3600);
            running_message = "Running: " + hours + ":" + minutes + ":" + seconds;
        }

        return uptime_message + "\n" + running_message;
    }

    //Error management
    let error_screen;
    if (error_handler === true) {
        let error_screen_handler = function () {//Default 

        };
        error_screen = {
            triggered: false,
            process: undefined,
            error: undefined
        }
        let error_screen_daemon = () => { }
        add_kernel_daemon(error_screen_daemon);
        function set_error_screen(handler) {
            error_screen_handler = handler;
        }
    }

    //Threads
    let PIDs = 0;
    let thread_in_execution = null;
    let Thread = function (command) {
        this.command = command;
        this.process = process_in_execution.PID;
        if (process_in_execution === null)
            error("A thread was created outside of a process context.");
        this.sleep_time = 0;
        this.last_execution = 0;
        this.marked = false;
        this.dead = false;
        this.PID = PIDs;
        PIDs++;
    }
    Thread.prototype.run = function () {
        this.last_execution = get_time();
        thread_in_execution = this;
        try {
            run_command_buffer(this.command);
        } catch (e) {
            if (e !== "interrupt") {
                console.error("Process " + this.process_name + " (" + this.PID + ") has encountered an error.");
                console.error(e);
                this.dead = true;
            }
        }
    }
    //Processes
    let processes = [];
    let process_time = 0;
    let user_time_buffer = 0;
    let process_in_execution = null;
    let Process = function (command) {
        this.process_name = command.name;
        this.threads = [];
        if (process_in_execution === null)
            error("Process '" + this.process_name + "' was created outside of a process context.");
        this.parent = process_in_execution.PID;
        this.creation_time = get_time();
        this.starting_uptime = raw_uptime().active;
        this.full_execution_time = 0;
        this.exec_time = 0;
        this.cpu_time = 0;
        this.suspended = false;
        this.dead = false;
        this.PID = PIDs;

        //Main thread creation
        process_in_execution = this;
        this.threads.push(new Thread(command));
    }
    Process.prototype.run = function (time_marker, start_time, target_time) {
        process_in_execution = this;
        this.full_execution_time = time_marker - this.last_execution;
        this.last_execution = time_marker;
        if (this.suspended === false) {
            for (let i = 0; i < this.threads.length; i++) {//Run all threads
                let thread = this.threads[i];
                if (thread.dead === true)
                    this.threads.splice(i, 1);
                else if (thread.sleep_time + thread.last_execution <= start_time)
                    thread.run();
                if (thread.last_execution >= target_time) //Scheduler watchdog
                    break;
            }
        }
        if (this.threads.length === 0)
            this.dead = true;
        let time_buffer = get_time();
        this.exec_time = time_buffer - time_marker;
        user_time_buffer += this.exec_time;
        this.cpu_time += Math.floor(this.exec_time * 100) / 100;
        return time_buffer;
    }
    Process.prototype.thread = function (command) {
        process_in_execution = this;
        this.threads.push(new Thread(command));
    }
    function create_process(command) {
        processes.push(new Process(command));
        return PIDs - 1;
    }
    function spawn_process(command) {
        return new Process(command);
    }
    function push_process(process) {
        processes.push(process);
    }
    let find_by_pid = function (PID) {
        let result = {
            index: {},
            process: {}
        };
        for (let i = 0; i < processes.length; i++) {
            if (processes[i].PID === PID) {
                result = {
                    index: i,
                    process: processes[i]
                }
            }
        }
        return result;
    }
    function kill(PID) {
        find_by_pid(PID).process.dead = true;
        debug("Killed " + PID);
    }
    function suspend(PID) {
        find_by_pid(PID).process.suspended = true;
        debug("Suspended " + PID);
    }
    function resume(PID) {
        find_by_pid(PID).process.suspended = false;
        debug("Resumed " + PID);
    }

    //Devices
    if (use_devices === true && windowed === true && is_browser === true) {
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
            debug("Device: Controller " + e.gamepad.index + " connected (" + e.gamepad.id + ")");
            devices.controllers.push(e.gamepad);
        });
        window.addEventListener("gamepaddisconnected", e => {
            debug("Device: Controller " + e.gamepad.index + " disconnected (" + e.gamepad.id + ")");
            devices.controllers.splice(e.gamepad, 1);
        });
        function add_listener(type, handler) {
            switch (type) {

            }
        }
        function get_devices() {
            const devices_buffer = JSON.parse(JSON.stringify(devices));
            return devices_buffer;
        }
    }

    //Networking
    if (use_networking === true) {
        let init_networking = function () {
            let xml_http = new XMLHttpRequest();
            xml_http.addEventListener('error', (event) => {
                error("A network request failed");
            });
            return xml_http;
        }
        let run_network_request = function (handler) {
            try {
                handler();
            } catch (e) {
                console.error(e);
                console.error("A network request encountered an error.");
                error("A network request has encountered an error");
            }
        }
        function net_get(url, handler) {
            run_network_request(() => {
                let xml_http = init_networking();
                xml_http.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200)
                        handler(this.responseText);
                }
                xml_http.open("GET", url, true);
                xml_http.send(null);
            });
        }
        function net_send(url, data) {
            run_network_request(() => {
                let xml_http = init_networking();
                const urlEncodedDataPairs = [];
                for (const [name, value] of Object.entries(data)) {
                    urlEncodedDataPairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
                }
                xml_http.addEventListener('load', (event) => {
                    debug("Network send request successful");
                });
                const urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');
                xml_http.open('POST', url);
                xml_http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xml_http.send(urlEncodedData);
            });
        }
    }

    //Graphics
    if (use_graphics === true && windowed === true && is_browser === true) {
        debug("Initializing graphics stack");
        canvas = document.createElement("canvas");
        if (!canvas)
            error("Graphics: Failed to create canvas.");
        graphics = canvas.getContext('2d');
        if (!graphics)
            error("Graphics: Failed to load 2d context.");
        webgl = canvas.getContext('webgl');
        if (!webgl)
            debug("Graphics: Failed to load webgl context.");
        canvas.id = "canvas";
        canvas.width = window.innerWidth - 20;
        canvas.height = window.innerHeight - 21;
        document.body.appendChild(canvas);
    }

    //Sound
    function play_sound(url) {
        try {
            new Audio(url).play();
        } catch (e) {
            error("Sound '" + url + "' failed to play.");
        }
    }

    //Suspension
    let system_suspended = false;
    let execution_time = 0;
    {
        let time_suspended = 0;
        let time_marker = get_time();
        let suspend_system = function () {
            if (system_suspended !== true) {
                execution_time = 500;
                system_suspended = true;
                time_marker = get_time();
            }
        }
        let resume_system = function () {
            if (system_suspended !== false) {
                execution_time = 0;
                system_suspended = false;
                time_suspended += get_time() - time_marker;
            }
        }
        function get_suspended_time() {
            if (system_suspended !== true)
                return time_suspended;
            else
                return time_suspended + get_time() - time_marker;
        }
        if (suspend_on_unfocus === true && windowed === true && is_browser === true) {
            let suspend_daemon = function () {
                if (document.hasFocus())
                    resume_system();
                if (!document.hasFocus())
                    suspend_system();
            }
            add_kernel_daemon(suspend_daemon);
        }
    }

    //System process
    let system_process;
    {
        let system = () => {
            sleep(10000);
        };
        process_in_execution = { PID: 0 };
        thread_in_execution = {};
        system_process = new Process(system);
        process_in_execution = null;
        thread_in_execution = null;
    }

    //Scheduler
    let waiting_processes = 0;
    let scheduler_run_count = 0;
    let sched_overhead = 0;
    create_statistic("useless_cycles");
    create_statistic("perfect_cycles");
    create_statistic("late_threads");
    create_statistic("on_time_threads");
    let scheduler = function () {
        if (system_suspended !== true) {
            let start_time = get_time();
            let target_time = 1000 / minimum_cycle_rate + start_time;
            let time_marker = start_time;
            processes.sort((a, b) => a.exec_time - b.exec_time);//Prioritize light processes
            user_time_buffer = 0;
            for (let i = 0; i < processes.length; i++) {
                let process = processes[i];
                time_marker = process.run(time_marker, start_time, target_time);
                if (process.dead === true)
                    processes.splice(i, 1);
            }
            process_in_execution = null;
            thread_in_execution = null;
            sched_overhead = get_time() - start_time - user_time_buffer;
            process_time = user_time_buffer;
            scheduler_run_count++;
        }
    }

    //Thread-process management APIs
    {
        let run_kernel_api = function (handler) {
            if (thread_in_execution !== null && process_in_execution !== null)
                handler();
            else
                warn("A kernel API was called outside of a process context. (process: " + process_in_execution + ", thread: " + thread_in_execution + ")");
        }
        function interrupt() {
            throw "interrupt";
        }
        function sleep(timeout) {
            run_kernel_api(() => {
                thread_in_execution.sleep_time = timeout;
            });
        }
        function thread(command) {
            run_kernel_api(() => {
                process_in_execution.thread(command);
            });
        }
        function fork() {
            run_kernel_api(() => {
                // let process = new Process(process_in_execution.command);
                // process.process_name = thread_in_execution.process_name;
                processes.push(process_in_execution);
            });
        }
        function exec(command) {
            run_kernel_api(() => {
                thread_in_execution.command = command;
            });
        }
        function getpid() {
            let pid;
            run_kernel_api(() => {
                pid = thread_in_execution.PID;
            });
            return pid;
        }
        function exit() {
            run_kernel_api(() => {
                thread_in_execution.dead = true;
            });
        }
        function proc() {
            return process_in_execution;
        }
    }

    //Timer management
    let timers = [];
    function create_timeout(handler, time) {
        if (panicked === false) {
            let process_context = process_in_execution;
            let timer_id = set_timeout(() => {
                process_in_execution = process_context
                handler();
                process_in_execution = null;
                timers.splice(timer_id);
            }, time);
            timers.push(timer_id);
            return timer_id;
        }
    }
    let create_interval = function (handler, time) {
        let timer_id = set_interval(() => {
            handler();
            timers.splice(timer_id);
        }, time);
        debug("Interval '" + handler.name + "' was created");
        timers.push(timer_id);
        return timer_id;
    }
    let clear_timers = function () {
        warn("All timers were cleared");
        while (timers.length > 0) {
            clearTimeout(timers[0]);
            timers.splice(0, 1);
        }
    }

    //Performance tracking
    let realtime_performance = 1;
    let system_overhead = 0;
    let system_time = 0;
    let kernel_overhead = 0;
    if (track_performance === true) {
        let low_performance_mode = false;
        let percent_total = 0;
        let percent_system = 0;
        let load_average = 0;
        {
            let timer = get_time();
            let performance_tracker = function () {
                let time_buffer = get_time();
                realtime_performance = time_buffer - timer;
                timer = time_buffer;
                if (percent_total === NaN)
                    percent_total = 0;
                if (percent_system === NaN)
                    percent_system = 0;
                if (system_suspended !== true && realtime_performance > 0) {
                    let n = Math.min(scheduler_run_count - 1, 1000 / realtime_performance);
                    percent_total = ((system_time / realtime_performance) + n * percent_total) / (n + 1);
                    percent_system = ((kernel_overhead / realtime_performance) + n * percent_system) / (n + 1);

                    if (scheduler_run_count >= 1) {
                        let n = Math.min(scheduler_run_count - 1, 5000 / realtime_performance);
                        load_average = (waiting_processes + n * load_average) / (n + 1);
                        waiting_processes = 0;
                    }
                }
            }
            add_kernel_daemon(performance_tracker);
        }
        //Gauge performance
        {
            let performance_tracker = handler => {
                let time_marker = get_time();
                handler();
                return get_time() - time_marker;
            }
            let test = () => {
                for (let i = 0; i < 1000000; i++) {
                    let hi = function () { };
                    hi();
                }
            }
            let test_scores = [];
            const test_count = 3;
            let median_score = 0;
            for (let i = 0; i < test_count; i++) {
                test_scores.push(performance_tracker(test));
            }
            test_scores = test_scores.sort((a, b) => a - b);
            if (test_count % 2 === 1) {
                median_score = test_scores[Math.round(test_count / 2) - 1];
            } else {
                median_score = (test_scores[Math.round(test_count / 2)] + test_scores[Math.floor(test_count / 2) - 1]) / 2;
            }
            const score = Math.floor(100 / median_score);
            debug("Performance test score: " + score);
            if (score < 26)
                low_performance_mode = true;
        }
        function get_performance() {
            const const_realtime_performance = realtime_performance;
            let result = {
                realtime: const_realtime_performance,
                average: load_average,
                percent: percent_total * 100,
                percent_user: (percent_total - percent_system) * 100,
                percent_system: percent_system * 100,
                percent_idle: (1 - percent_total) * 100,
                overhead: system_overhead,
                system: system_time,
                low_performance: low_performance_mode
            }
            return result;
        }
        //QOL functions
        function ktop() {
            let output_text = "";
            let add_text = function (line) {
                // console.log(line);
                output_text += line + "\n";
            }
            let round_hundredth = function (number) {
                return Math.round(number * 100) / 100;
            }
            let get_percent = function (number) {
                return Math.round(number * 100);
            }
            let late_threads = get_statistic("late_threads");
            let on_time_threads = get_statistic("on_time_threads");
            let total_threads_run = late_threads + on_time_threads;
            add_text("-- ktop --");
            add_text("CPU usage: " + get_percent(percent_total) + "% total (" + get_percent(percent_total - percent_system) + "% user, " + get_percent(percent_system) + "% system, " + get_percent(1 - percent_total) + "% idle)");
            add_text("Task count: " + (processes.length));
            add_text("Uptime: " + uptime());
            add_text("Load average: " + round_hundredth(load_average));
            add_text("- Kernel info -");
            add_text("System time: " + round_hundredth(system_time) + "ms");
            add_text("Kernel overhead: " + round_hundredth(kernel_overhead) + "ms (" + round_hundredth(sched_overhead) + "ms sched)");
            add_text("Realtime performance: " + round_hundredth(realtime_performance) + "ms");
            add_text("JS engine overhead: " + round_hundredth(system_overhead));
            add_text("- Statistics -");
            let useless_cycles = get_statistic("useless_cycles");
            add_text("Useless cycles: " + useless_cycles + " (" + Math.round(useless_cycles / scheduler_run_count * 100) + "%)");
            if (total_threads_run > 0) {
                let perfect_cycles = get_statistic("perfect_cycles");
                add_text("Perfect cycles: " + perfect_cycles + " (" + Math.round(perfect_cycles / (scheduler_run_count - useless_cycles) * 100) + "%, " + Math.round(perfect_cycles / scheduler_run_count * 100) + "%)");
                add_text("Late threads: " + late_threads + " (" + Math.round(late_threads / total_threads_run * 100) + "%)");
                add_text("On-time threads: " + on_time_threads + " (" + Math.round(on_time_threads / total_threads_run * 100) + "%)");
            }
            add_text("- Individual process usages - ");

            let sorted_processes = processes.sort((a, b) => b.cpu_time - a.cpu_time);
            for (let i = 0; i < sorted_processes.length; i++) {
                let process = sorted_processes[i];
                add_text(process.process_name + "(" + process.PID + ") - " + (Math.round(process.cpu_time / (raw_uptime().active - process.starting_uptime) * 10000) / 100) + "% CPU - " + (Math.round(process.cpu_time / 10) / 100) + " seconds CPU time - " + round_hundredth(process.exec_time) + "ms exec time - " + Math.round(process.sleep_time) + "ms sleep time");
            }

            return output_text;
        }
        function get_system_info() {
            let get_percent = function (number) {
                return number * 100;
            }
            let useless_cycles = get_statistic("useless_cycles");
            let perfect_cycles = get_statistic("perfect_cycles");
            let late_threads = get_statistic("late_threads");
            let on_time_threads = get_statistic("on_time_threads");
            let result = {
                usage: {
                    total: get_percent(percent_total),
                    user: get_percent(percent_total - percent_system),
                    system: get_percent(percent_system),
                    idle: get_percent(1 - percent_total),
                    load_average: load_average
                },
                info: {
                    system_time: system_time,
                    kernel_overhead: kernel_overhead,
                    sched_overhead: sched_overhead,
                    realtime: realtime_performance,
                    js_overhead: system_overhead,
                },
                statistics: {
                    useless_cycles: useless_cycles,
                    perfect_cycles: perfect_cycles,
                    sched_run_count: scheduler_run_count,
                    late_threads: late_threads,
                    on_time_threads: on_time_threads,
                    total_threads_run: late_threads + on_time_threads,
                },
                processes: []
            }
            for (let i = 0; i < processes.length; i++) {
                let process = processes[i];
                let process_name = process.process_name;
                if (process_name === "")
                    process_name = "unnamed";
                let process_buffer = {
                    process_name: process_name,
                    PID: process.PID,
                    cpu_time: process.cpu_time,
                    exec_time: process.exec_time,
                    sleep_time: process.sleep_time,
                    creation_time: process.creation_time,
                    starting_uptime: process.starting_uptime
                }
                result.processes.push(process_buffer);
            }
            return result;
        }
        function perf_track(command) {
            let time_marker = get_time();
            command();
            return get_time() - time_marker;
        }
    }

    //Performance display
    if (display_performance === true) {
        let performance_display = function () {
            //TODO: Make default performance display
        }
        let daemon_id = add_kernel_daemon(performance_display);
        function set_performance_display(handler) {
            kernel_daemons[daemon_id].command = handler;
            debug("Performance display has been set (" + handler.name + ")");
        }
    }

    //Power manager
    if (manage_power === true) {
        let power_manager = function () {
            if (system_suspended !== true) {
                let minimum_execution_point = Infinity;
                let time_buffer = get_time();
                for (let i = 0; i < processes.length; i++) {
                    let process = processes[i];
                    for (let l = 0; l < process.threads.length; l++) {
                        let thread = process.threads[l];
                        if (thread.sleep_time !== 0) {
                            let scheduled_exec = thread.last_execution + thread.sleep_time - time_buffer;
                            if (scheduled_exec < minimum_execution_point)
                                minimum_execution_point = scheduled_exec;
                        }
                    }
                }
                if (manage_power === true && minimum_execution_point !== Infinity)
                    execution_time = Math.max(minimum_execution_point, 0);
            }
        }
        add_kernel_daemon(power_manager);
    }

    //Watchdog
    if (use_watchdog === true) {
        debug("Initializing watchdog");
        let timer = 0;
        let previous_execution_count = 0;
        let watchdog = function () {
            if (previous_execution_count === execution_count) {
                warn("Watchdog has been triggered");
            } else if (previous_execution_count < execution_count) {
                timer = get_time();
                previous_execution_count = execution_count;
            }
            if (get_time() - timer > 2000) {
                panic("Watchdog has detected that the kernel is hung.");
            }
        }
        create_interval(watchdog, 1000);
    }

    //Overload protection
    if (overload_protection === true) {
        debug("Initializing overload protection");
        let scheduler_cycle_count = 0;
        let cycle_count_buffer = 0;
        let timer = 0;
        const watchdog_timeout = 3000;
        let overload_monitor = function () {
            if (system_suspended !== true) {
                if (cycle_count_buffer === scheduler_cycle_count) {
                    warn("Overload monitor has been triggered");
                } else if (cycle_count_buffer < scheduler_cycle_count) {
                    timer = get_time();
                    cycle_count_buffer = scheduler_cycle_count;
                }
                if (get_time() - timer > watchdog_timeout)
                    panic("System has been overloaded");
            } else {
                timer = get_time();
            }
        }
        create_interval(overload_monitor, 2500);
        system_process.thread(() => {
            scheduler_cycle_count++;
            sleep(watchdog_timeout / 2);
        });
    }

    //Init
    {
        let inits = [];
        system_process.thread(() => {
            if(inits.length !== 0){
                for (let i = inits.length; i > 0; i--) {
                    debug("Intializing " + inits[0].name);
                    create_process(inits[0])
                    inits.splice(0, 1);
                }
            }
            sleep(500);
        });
        function create_init(command) {
            inits.push(command);
        }
        push_process(system_process);
    }
    //Main loop
    function setup() {
        createCanvas(windowWidth - 20, windowHeight - 20);
        noLoop();
    }
    let execution_count = 0;
    {
        let overhead_time_marker = 0;
        function draw () {
            try {
                let time_marker = get_time();
                system_overhead = time_marker - overhead_time_marker - execution_time;
                scheduler();//Run processes
                run_kernel_daemons();
                execution_count++;
                //Rexecute loop
                if (run_loop === true && panicked === false)
                    create_timeout(draw, execution_time);
                let time_marker_2 = get_time();
                system_time = time_marker_2 - time_marker;
                kernel_overhead = system_time - process_time;
                overhead_time_marker = time_marker_2;
            } catch (e) {
                console.error(e);
                panic("Kernel execution encountered an error.");
            }
        }
        console.log(Kernel.name + " " + Kernel.version);
        try {
            debug("Starting kernel");
            draw();
        } catch (e) {
            console.error(e);
            panic("Unable to start kernel");
        } finally {
            let time_since_start = (Date.now() - Kernel.start_time);
            console.log("Kernel successfully started. (" + time_since_start + "ms)");
            debug("Kernel was started in " + time_since_start + "ms");
        }
    }
}