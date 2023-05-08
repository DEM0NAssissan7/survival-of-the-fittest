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
            return (Math.abs(size) / (1000 / get_performance().realtime)) * (1000 / time);
        } else {
            return (Math.abs(size) / (1000 / timer.measured_latency)) * (1000 / time);
        }
    }
}
set_performance_display(() => {
    push();
    fill(127);
    rect(0, 0, 38, 30);
    stroke(0);
    fill(0);
    textSize(14);
    text(Math.round(1000/get_performance().realtime), 10, 19);

    translate(38,0)
    fill(238, 170, 170);
    rect(0, 0, 38, 30);
    fill(0);
    text(Math.round(get_performance().percent), 10, 19);
    pop();
})