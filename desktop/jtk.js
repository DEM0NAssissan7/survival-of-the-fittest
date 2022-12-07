var animateSystem = true;
var buttonClicked = false;
var listViewOpened = "";

//Color scheme
let colorScheme;
create_init(function (){
    var accent = color(70,110,255);
    var background = color(127,127,127);
    var dialogueBackground = color(30);
    var elementColors = color(40);
    var textColor = color(255);
    colorScheme = [
        accent,
        background,
        dialogueBackground,
        elementColors,
        textColor,
    ];
    exit();
});
function centerText(displayText, textX, textY, textW, textH, textsize) {
    var currentTextsize = 12;
    if (textsize) {
        currentTextsize = textsize;
    }
    textSize(currentTextsize);
    var buttonTextLength = (textWidth(displayText) / 2);
    var textDisplayX = textX + ((textW / 2) - buttonTextLength);
    var textDisplayY = textY + ((textH / 2) + (currentTextsize / 3));
    if(textDisplayX > 0 && textDisplayX + buttonTextLength < width){
        text(displayText, textDisplayX, textDisplayY);
    }
}
function simpleCenterText(displayText, textX, textY){
    text(displayText, textX - textWidth(displayText)/2, textY);
}
function blankButton(x, y, w, h, func){
    let devices = get_devices();
    if (devices.mouse.x > x && devices.mouse.x < x + w && devices.mouse.y > y && devices.mouse.y < y + h && devices.mouse.clicked && buttonClicked === false) {
        func();
        buttonClicked = true;
    }
}
function Button(x, y, w, h, func, followColorScheme) {
    push();
    let devices = get_devices();
    if (devices.mouse.x > x && devices.mouse.x < x + w && devices.mouse.y > y && devices.mouse.y < y + h) {
        stroke(colorScheme[0]);
        strokeWeight(1.8);

        if(devices.mouse.clicked && buttonClicked === false){
            func();
            buttonClicked = true;
        }
    }
    if(followColorScheme === undefined || followColorScheme === true){
        fill(colorScheme[3]);
    }
    var rectangleX = Math.max(Math.min(x, width), 0);
    var rectangleY = Math.max(Math.min(y, height), 0);
    rect(rectangleX, rectangleY, Math.max(Math.min(w, width - rectangleX), 0), Math.max(Math.min(h, height - rectangleY), 0));
    pop();
}
function labledButton(x, y, w, h, func, buttonText, textsize, textColor){
    if(!textColor){
        Button(x, y, w, h, func);
        fill(colorScheme[4]);
    }else{
        Button(x, y, w, h, func, false);
        fill(textColor);
    }
    centerText(buttonText, x, y, w, h, textsize);
}
function booleanToggleButton(bool, textFalse, textTrue, x, y, w, h, customFunction, textColor){
    var self = this;
    let currentCustomFunction = customFunction;
    if(!customFunction){
        currentCustomFunction = function () {};
    }
    let result = bool;
    function changeBoolean(){
        if(!bool){
            result = true;
            currentCustomFunction(bool);
            return;
        }
        if(bool){
            result = false;
            currentCustomFunction(bool);
            return;
        }
    }
    push();
    if(bool === false){
        labledButton(x, y, w, h, changeBoolean, textFalse, textColor);
    }
    if(bool === true){
        labledButton(x, y, w, h, changeBoolean, textTrue, textColor);
    }
    pop();
    return result;
}
function listSelector(variable, options, x, y, w, h, text, textColor){
    var self = this;
    let result = variable;
    function openMenu(){
        listViewOpened = text;
        let devices = get_devices();
        this.mouseClickedX = devices.mouse.x;
        this.mouseClickedY = devices.mouse.y;
    }
    push();
    if(listViewOpened === text){
        let menuClicked = false;
        for(var i = 0; i < options.length; i++){
            push();
            fill(255);
            labledButton(x, y + (h*i), w, h, function() {
                result = options[i][0];
                listViewOpened = "";
                menuClicked = true;
            }, options[i][1], color(0));
            pop();
        }
    }
    if(listViewOpened.length < 1){
        labledButton(x, y, w, h, openMenu, text, textColor);
    }
    pop();
    return result;
}
//Reset button clicked status
function mouseReleased(){
    buttonClicked = false;
}
//Animation handler
function getAnimationExpansionRate(size, time, noAbs) {
    if (noAbs === undefined) {
        return (Math.abs(size) / frame_latency) * (1000 / time);
    }
    if (noAbs === true) {
        return (size / frame_latency) * (1000 / time);
    }
}
function animateAcceleration(value, targetSize, time) {
    if(animateSystem === true){
        if (Math.round(value) !== targetSize) {
            return getAnimationExpansionRate(targetSize - value, time, true);
        } else {
            return 0;
        }
    }else{
        return targetSize - value;
    }
}
