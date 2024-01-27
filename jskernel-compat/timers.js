{
    let Tracker = function(){
        this.time_marker = performance.now();
        this.measured_latency = 0;
    }
    Tracker.prototype.update = function (){
        let time = performance.now();
        this.measured_latency = time - this.time_marker;
        this.time_marker = time;
    }
    function create_timer() {
        return new Tracker();
    }
    function getTransition(size, time, timer){
        if(!timer){
            return (Math.abs(size) / (1000 / perf.realtime)) * (1000 / time);
        } else {
            return (Math.abs(size) / (1000 / timer.measured_latency)) * (1000 / time);
        }
    }
}