let framebuffer = new Uint8ClampedArray(0);
let fb_width = 400;
let fb_height = 400;
let kill = false;

const decay_rate = 3.4;

function map_xy(x, y) { // Return framebuffer index for pixel
    return (x + y * fb_width) * 4;
}

function map_index (index) { // Find X,Y for index on framebuffer
    let y_unfloored = Math.floor(index / 4) / fb_width; // Optimization variable. Reduces operations
    let y = Math.floor(y_unfloored);
    let x = Math.round((y_unfloored - y) * fb_width);
    
    return {x: x, y: y};
}

function brightness_operation(operation) {
    let result;
    framebuffer.map(pixel => {
        result = operation(pixel);
        if(result >= 0 && result <= 255)
            return result;
        return pixel;
    })
}

function draw_point(x, y) {
    let index = map_xy(x, y);
    framebuffer[index + 0] = r;
    framebuffer[index + 1] = g;
    framebuffer[index + 2] = b;
}
function fill_area(x,y,w,h) {

}



function set_resolution(width, height){
    fb_width = width;
    fb_height = height;
    offscreen_canvas.width = width;
    offscreen_canvas.height = height;
    framebuffer = new Uint8ClampedArray(width * height * 4);
}

function decay_light() {
    brightness_operation(pixel => pixel -= decay_rate);
}

let track_time, frametime;
let track_frametime = function() {
    let _time = performance.now();
    frametime = _time - track_time;
    track_time = _time;
}

let objects = [];
let _rect = function(x, y, w, h, surface) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.surface = surface;
    this.type = "rect";
}
_rect.prototype.collides = function(x, y) {
    if(x >= this.x && x <= this.x + this.w && y >= this.y && y <= this.y + this.h)
        return true;
    else
        return false;
}
function draw_rect(x, y, w, h, surface) {
    objects.push(new _rect(x, y, w, h, surface));
}
function draw_background(r, g, b) {
    for(let i = 0; i < framebuffer.length; i+=4) {
        framebuffer[i + 0] = r;
        framebuffer[i + 1] = g;
        framebuffer[i + 2] = b;        
        framebuffer[i + 3] = 255; // Set alpha channel to 255
    }
}

const light_quality = 2000;
const rad = Math.PI * 2;
function emit_light(x, y, r, g, b, luminosity, offset) {
    let dir_x, dir_y, tmp_x, tmp_y, tmp_lum, index, i, j, object;
    let _r = r;
    let _g = g;
    let _b = b;
    const increment = rad/light_quality;
    for(i = 0; i < rad; i+=increment) {
        dir_x = Math.cos(i + offset);
        dir_y = Math.sin(i + offset);
        tmp_x = x;
        tmp_y = y;
        tmp_lum = luminosity;
        while(tmp_x >= 0 && tmp_x <= fb_width && tmp_y >= 0 && tmp_y <= fb_height && tmp_lum > 0) {
            index = map_xy(Math.floor(tmp_x), Math.floor(tmp_y));
            framebuffer[index + 0] += _r;
            framebuffer[index + 1] += _g;
            framebuffer[index + 2] += _b;
            framebuffer[index + 3] += tmp_lum * 255;
            tmp_x += dir_x;
            tmp_y += dir_y;
            tmp_lum -= 0.001; // Decay
            for(j = 0; j < objects.length; j++) {
                object = objects[j];
                if(object.collides(tmp_x, tmp_y)) {
                    this.dir_x = dir_x;
                    this.dir_y = dir_y;
                    this.tmp_x = tmp_x;
                    this.tmp_y = tmp_y;
                    this.tmp_lum = tmp_lum;
                    this.index = index;
                    object.surface(this, object);
                    dir_x = this.dir_x;
                    dir_y = this.dir_y;
                    tmp_x = this.tmp_x;
                    tmp_y = this.tmp_y;
                    tmp_lum = this.tmp_lum;
                    index = this.index;
                }
            }
        }
    }
}

function kill_draw() {
    kill = true;
}

function clear_objects(){
    objects = [];
}

function canvas_2d_draw_fps(ctx) {
    track_frametime();
    ctx.fillStyle = "white";
    ctx.fillText(Math.round(1000/frametime), 30, 30);
}

let image_data = false;
let offscreen_canvas, offscreen_ctx;

function init_2d_canvas() {
    offscreen_canvas = document.getElementById("crystalcanvas");
    offscreen_canvas.width = fb_width;
    offscreen_canvas.height = fb_height;
    // offscreen_canvas.style.filter = 
    offscreen_ctx = offscreen_canvas.getContext("2d");
}

function reset_2d_canvas() {
    image_data = offscreen_ctx.createImageData(fb_width, fb_height);
    framebuffer = image_data.data;
    // for(let i = 3; i < framebuffer.length; i+=4)
    //     framebuffer[i] = 255; // Set alpha channel to 255
}

function canvas_2d_draw() {
    if(!kill) {
        // Swap image data with framebuffer
        // for(let i = 0; i < image_data.data.length; i++)
        //     image_data.data[i] = framebuffer[i];

        offscreen_ctx.putImageData(image_data, 0, 0);
    }
}