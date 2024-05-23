create_init(() => {
    // Crystal (unsupported)
    // init_2d_canvas();
    // set_resolution(width, height);
    // console.log(width);
    // canvas.style.position = "absolute";
    // exit();

    // Quartz
    let _canvas = document.getElementById("graphicscanvas");
    _canvas.width = width;
    _canvas.height = height;
    console.log(_canvas)
    // let ctx = _canvas.getContext("2d");
    Quartz.setContext(drawingContext);
    exit();
})