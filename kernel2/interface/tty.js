class TTY {
  constructor() {

    this.prompt = "[jsterm]$ ";
    this.textArray = [];
    this.promptArray = [];
    this.textLine = 0;
    this.textBuffer = [];
    this.keyPressed = false;
    this.textOrder = 0;
  }
  update(){
    //Commandline functions
    var self = this;
    function clr() {
      self.textArray = [];
    }
    function printout(obj) {
      if (obj[0]) {
        for (var i in obj) {
          self.textArray.push(obj[i]);
        }
      } else {
        self.textArray.push(obj);
      }
    }
    if (devices.keyboard.keyCodes[13] && !this.keyPressed) {
      this.textArray.push(this.textBuffer);
      this.promptArray[this.textArray.length - 1] = this.prompt;
      if (this.textBuffer) {
        try {
          var stringToCommand = eval(this.textBuffer);
          if (stringToCommand !== undefined) {
            stringToCommandToString = stringToCommand.toString();
            for(var i = 0; i < stringToCommandToString.length; i++){
              this.textArray.push(stringToCommandToString.replace(/[^\x20-\x7E]/gmi, ""));
            }
          }
        } catch (error) {
          this.textArray.push(error);
        }
      }
      this.textBuffer = "";
      this.keyPressed = true;
      return;
    } else {
      if (devices.keyboard.keyCodes[8] && !this.keyPressed) {
        this.textBuffer = this.textBuffer.slice(0, -1);
        this.keyPressed = true;
      }
      if (devices.keyboard.keyCodes[38] && !this.keyPressed && this.textArray[this.textArray.length - (this.textOrder + 1)] !== undefined) {
        this.textOrder++;
        this.textBuffer = this.textArray[this.textArray.length - this.textOrder];
        this.keyPressed = true;
      }
      if (devices.keyboard.keyCodes[40] && !this.keyPressed && this.textArray[this.textArray.length - (this.textOrder - 1)] !== undefined) {
        this.textOrder--;
        this.textBuffer = this.textArray[this.textArray.length - this.textOrder];
        if (this.textBuffer === undefined) {
          this.textOrder = 0;
        }
        this.keyPressed = true;
      }
      if (devices.keyboard.info.keyCode !== 40 && !this.keyPressed) {
        if (devices.keyboard.info.keyCode !== 38) {
          this.textOrder = 0;
        }
      }
      if (!devices.keyboard.info.keyIsPressed) {
        this.keyPressed = false;
      }
      for (var i in devices.keyboard.keys) {
        var currentKey = devices.keyboard.keys[i]
        if (currentKey !== "Enter" && currentKey !== "Backspace" && currentKey !== "ArrowUp" && currentKey !== "ArrowDown" && currentKey !== "Alt" && currentKey !== "Shift" && currentKey !== "Tab" && currentKey !== "Control") {
          this.textBuffer += currentKey;
        }
      }
    }
  }
  draw(canvas, graphics){
    graphics.fillStyle = 'black';
    graphics.fillRect(0, 0, canvas.width, canvas.height);
    graphics.font = '12px Monospace';
    graphics.fillStyle = 'white';
    for (var i in this.textArray) {
      let currentPrompt = this.promptArray[i];
      if (currentPrompt === undefined) {
        currentPrompt = "";
      }
      graphics.fillText(currentPrompt + this.textArray[i], 2, i * 12 + 12)
    }
    graphics.fillText(this.prompt + this.textBuffer, 2, this.textArray.length * 12 + 12)
  }
  createWindow(){
    var windowProcesses = [];
    var tty = new TTY();
  
    createWindow([
      new Process(() => {tty.update();}),
      new Process((canvas, graphics) => {tty.draw(canvas, graphics);})
    ], "Terminal");
  }
  iconFunction(canvas, graphics){
    graphics.fillStyle = 'black';
    graphics.fillRect(0, 0, canvas.width, canvas.height, 10);
    graphics.fillStyle = 'white';
    graphics.font = ((canvas.width + canvas.height) / 4) + "px Monospace";
    graphics.fillText(">_", 5, canvas.height / 2);
  }
}
try{
  if(stress){
    var ttySystem = new TTY;
    function updateTTY() {
      ttySystem.update();
    }
    function drawTTY() {
      ttySystem.draw(canvas, graphics);
    }
    createProcess(updateTTY, 0);
    createProcess(drawTTY);
  }
} catch(error){}