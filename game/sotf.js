//Survival of the Fittest
/* New features list:
x- Create shop icons
- Fix camera
- Make death screen more useful (with player stats, time alive, etc)
- Ability to aim (with right stick on controller)
- A boss every X rounds
- Fix controller bug where disconnecting just makes your character a potato
- Allow reliable joining mid-game (and have them be revived)
- Day/night cycle (and clouds)
*/

let sotf_pid = 5;
let playerUpdateRatio = 1;
let cause_mayhem = function(){};
let draws, instance;

function customRandom(min, max) {
  return Math.random() * (max + Math.abs(min)) - Math.abs(min);
}
function fillPlayerNumber(number) {
  if (!number) {
    fill(170, 170, 170);
  } else {
    switch (number) {
      case 0:
        fill(170, 170, 170);
        break;
      case 1:
        fill(100, 100, 255);
        break;
      case 2:
        fill(255, 100, 100);
        break;
      case 3:
        fill(100, 255, 100);
        break;
      case 4:
        fill(255, 255, 100);
        break;
    }
  }
}
class SOTF {
  constructor() {
    this.players = [];
    this.enemies = [];
    this.world = [];
    this.guns = [];
    this.shopItems = [];
    this.shopinit = false;

    this.levelTransitionTimer = create_timer();

    this.menuState = "menu";
    this.startupScreenTimer = 72;
    this.processes = [];
    this.logicProcesses = [];
    this.pid = 5;

    //gravityForce is measured in m/s
    //Every 20px is one meter ingame
    this.gravityForce = 9.8;
    this.playerSize = 30;
    this.enemySize = this.playerSize / 1.8;

    this.groundStepHeight = 0.2;
    this.groundStepWidth = 10;
    this.camX = 0;
    this.camY = 0;

    this.controllerDeadzone = 0.1;
    this.playerBuffer = [];
    this.deadPlayers = [];

    this.level = 1;
    this.levelKillGoal = 2;
    this.enemiesKilled = 0;
    this.transitionNextLevel = false;
    this.nextLevelTransitionCounter = 0;
    this.worldGenerationNumber = 0;
  }
  update() {
    let self = this;

    //Guns
    function Gun() {
      this.name = '';
      this.art = () => { };
      this.damage = 0;
      this.spread = 0;
      this.special = false;
      this.automatic = false;
      this.fireCooldown = 0;
    }
    Gun.prototype.pistol = function () {
      this.name = 'pistol';
      this.art = direction => {
        noStroke();
        fill(50, 50, 50);
        if (direction === 'left') {
          translate(-self.playerSize / 2 + 2, self.playerSize / 2 - 6)
          rect(0, 0, 14, 6);
          rect(8, 5, 6, 7);
        }
        if (direction === 'right') {
          translate(self.playerSize - 1, self.playerSize / 2 - 6)
          rect(0, 0, 14, 6);
          rect(0, 5, 6, 7);
        }
        if (!direction) {
          rect(0, 0, 14, 6);
          rect(0, 5, 6, 7);
        }
      }
      this.damage = 15;
      this.spread = 20;
      this.special = false;
      this.automatic = false;
      this.fireCooldown = 0;
    }
    Gun.prototype.smg = function () {
      this.name = 'smg';
      this.art = direction => {
        noStroke();
        if (direction === 'left') {
          translate(-self.playerSize / 2 + 15, self.playerSize / 2 - 3);
          scale(0.6)
          fill(87, 76, 76);
          rect(0, 0, -50, 10);
          fill(110, 101, 101);
          rect(-30, 10, -7, 28);
          fill(176, 157, 157);
          rect(-50, 3, -5, 3);
          fill(112, 49, 0);
          rect(-5, 10, -8, 21);
        }
        if (direction === 'right') {
          translate(self.playerSize / 2 + 15, self.playerSize / 2 - 3);
          scale(0.6)
          fill(87, 76, 76);
          rect(0, 0, 50, 10);
          fill(110, 101, 101);
          rect(30, 10, 7, 28);
          fill(176, 157, 157);
          rect(50, 3, 5, 3);
          fill(112, 49, 0);
          rect(5, 10, 8, 21);
        }
        if (!direction) {
          fill(87, 76, 76);
          rect(0, 0, 50, 10);
          fill(110, 101, 101);
          rect(30, 10, 7, 28);
          fill(176, 157, 157);
          rect(50, 3, 5, 3);
          fill(112, 49, 0);
          rect(5, 10, 8, 21);
        }
      };
      this.damage = 13;
      this.automatic = true;
      this.special = false;
      this.fireRate = 17;
      this.spread = 30;
    }
    Gun.prototype.assault = function () {
      this.name = 'assault';
      this.art = direction => {
        noStroke();
        scale(0.5);
        if (direction === 'left') {
          translate(self.playerSize - 21, self.playerSize / 2 + 10);
          fill(30);
          rect(0, 0, -50, 10);
          fill(135, 71, 2);
          rect(-20, 10, -7, 20);
          fill(30);
          rect(-50, 1, -25, 7);
          fill(135, 71, 2);
          rect(-5, 10, -7, 15);
          rect(25, 0, -25, 6);
          rect(25, 0, -3, 20);
          fill(50);
          rect(-10, -4, -6, 4);
          fill(20);
          rect(-75, 3, -10, 3);
          rect(-85, 2, -6, 5);
        }
        if (direction === 'right') {
          translate(self.playerSize + 20, self.playerSize / 2 + 10);
          fill(30);
          rect(0, 0, 50, 10);
          fill(135, 71, 2);
          rect(20, 10, 7, 20);
          fill(30);
          rect(50, 1, 25, 7);
          fill(135, 71, 2);
          rect(5, 10, 7, 15);
          rect(-25, 0, 25, 6);
          rect(-25, 0, 3, 20);
          fill(50);
          rect(10, -4, 6, 4);
          fill(20);
          rect(75, 3, 10, 3);
          rect(85, 2, 6, 5);
        }
        if (!direction) {
          fill(30);
          rect(0, 0, 50, 10);
          fill(135, 71, 2);
          rect(20, 10, 7, 20);
          fill(30);
          rect(50, 1, 25, 7);
          fill(135, 71, 2);
          rect(5, 10, 7, 15);
          rect(-25, 0, 25, 6);
          rect(-25, 0, 3, 20);
          fill(50);
          rect(10, -4, 6, 4);
          fill(20);
          rect(75, 3, 10, 3);
          rect(85, 2, 6, 5);
        }
      };
      this.damage = 29;
      this.automatic = true;
      this.special = false;
      this.fireRate = 12;
      this.spread = 10;
    }
    Gun.prototype.shotgun = function () {
      this.name = 'shotgun';
      this.art = direction => {
        scale(0.5)
        stroke(0);
        if (direction === 'left') {
          translate(self.playerSize, self.playerSize / 2 + 10)
          fill(40);
          rect(0, 0, -48, 16);
          rect(-114, 1, 60, 5);
          rect(-48, 1, -19, 6);
          rect(-103, 9, 55, 5);
          rect(10, 0, -10, 30);
          fill(30);
          rect(-61, 6, -32, 11);
        }
        if (direction === 'right') {
          translate(self.playerSize, self.playerSize / 2 + 10)
          fill(40);
          rect(0, 0, 48, 16);
          rect(114, 1, -60, 5);
          rect(48, 1, 19, 6);
          rect(103, 9, -55, 5);
          rect(-10, 0, 10, 30);
          fill(30);
          rect(61, 6, 32, 11);
        }
        if (!direction) {
          fill(40);
          rect(0, 0, 48, 16);
          rect(114, 1, -60, 5);
          rect(48, 1, 19, 6);
          rect(103, 9, -55, 5);
          rect(-10, 0, 10, 30);
          fill(30);
          rect(61, 6, 32, 11);
        }
      };
      this.cost = 0;
      this.damage = 13;
      this.spread = 20;
      this.special = true;
    }
    Gun.prototype.sniper = function () {
      this.name = 'sniper';
      this.art = direction => {
        noStroke();
        scale(0.2);
        if (direction === 'left') {
          translate(self.playerSize - 30, self.playerSize / 2 + 50);
          fill(100);
          rect(0, 0, -200, 20);
          rect(-200, 7, -100, 7);
          rect(60, 0, -80, 6);
          rect(70, 0, -10, 30, 70, 0, 0, 0);
          fill(0);
          rect(-80, -17, -50, 18);
          rect(0, 20, -15, 20);
          rect(-60, 20, -10, 10);
          fill(70);
          rect(-300, 4, -15, 14);
        }
        if (direction === 'right') {
          translate(self.playerSize + 120, self.playerSize / 2 + 50);
          fill(100);
          rect(0, 0, 200, 20);
          rect(200, 7, 100, 7);
          rect(-60, 0, 80, 6);
          rect(-70, 0, 10, 30, 70, 0, 0, 0);
          fill(0);
          rect(80, -17, 50, 18);
          rect(0, 20, 15, 20);
          rect(60, 20, 10, 10);
          fill(70);
          rect(300, 4, 15, 14);
        }
        if (!direction) {
          fill(100);
          rect(0, 0, 200, 20);
          rect(200, 7, 100, 7);
          rect(-60, 0, 80, 6);
          rect(-70, 0, 10, 30, 70, 0, 0, 0);
          fill(0);
          rect(80, -17, 50, 18);
          rect(0, 20, 15, 20);
          rect(60, 20, 10, 10);
          fill(70);
          rect(300, 4, 15, 14);
        }
      }
      this.damage = 35;
      this.spread = 3;
      this.special = false;
      this.automatic = false;
      this.fireCooldown = 0;
    }

    //Player system
    function Player(x, y, controller, playerNumber) {
      this.x = x;
      this.y = y;
      this.health = 100;
      this.maxHealth = 100;

      this.controller = controller;
      this.number = 0;
      if (this.number !== undefined) {
        this.number = playerNumber;
      }
      this.timer = create_timer();
      this.gunTimer = create_timer();

      this.shopButtonPressed = false;
      this.shopMenu = false;

      this.gravity = 0;
      this.horizontalVelocity = 0;
      this.speedMultiplier = 1;

      this.falling = true;
      this.jumping = false;

      this.gun = new Gun();
      this.gun.pistol();
      this.direction = 'left';
      this.gunFired = false;
      this.gunCooldownCounter = 0;
      this.gunShotCount = 0;
      this.shotMultiplier = 1;
      this.damageAdder = 0;

      this.damageDone = 0;
      this.points = 0;
      this.kills = 0;
    }
    //Function for shooting
    function findIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
      const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (denominator !== 0) {
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;
        return (t > 0 && t < 1 && u > 0);
      } else {
        return false;
      }
    }
    function fireBullet(x, y, dirX, dirY, player) {
      var bulletHit = false;
      for (var i = 0; i < self.enemies.length; i++) {
        var currentEnemy = self.enemies[i];
        let bulletIntersects = false;

        const x3 = x;
        const y3 = y;
        const x4 = x + dirX;
        const y4 = y + dirY;
        //Left side
        var x1 = currentEnemy.x;
        var y1 = currentEnemy.y;
        var x2 = currentEnemy.x;
        var y2 = currentEnemy.y + self.enemySize;

        bulletIntersects = findIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
        //Bottom side
        if (bulletIntersects === false) {
          x1 = currentEnemy.x;
          y1 = currentEnemy.y + self.enemySize;
          x2 = currentEnemy.x + self.enemySize;
          y2 = currentEnemy.y + self.enemySize;

          bulletIntersects = findIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
        }
        //Right side
        if (bulletIntersects === false) {
          x1 = currentEnemy.x + self.enemySize;
          y1 = currentEnemy.y;
          x2 = currentEnemy.x + self.enemySize;
          y2 = currentEnemy.y + self.enemySize;

          bulletIntersects = findIntersection(x1, y1, x2, y2, x3, y3, x4, y4)
        }
        //Top side
        if (bulletIntersects === false) {
          x1 = currentEnemy.x;
          y1 = currentEnemy.y;
          x2 = currentEnemy.x + self.enemySize;
          y2 = currentEnemy.y;

          bulletIntersects = findIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
        }
        if (bulletIntersects === true) {
          var playerDamage = player.gun.damage + player.damageAdder;
          player.damageDone += playerDamage;
          currentEnemy.health -= playerDamage;
          if (currentEnemy.health <= 0) {
            player.points++;
            player.kills++;
            self.enemiesKilled++;
            if (self.enemies.length <= Math.min(self.levelKillGoal - self.enemiesKilled, 1000)) {
              for (var l = 0; l <= Math.round(Math.random()) + 1; l++) {
                self.enemies.push(new Enemy(currentEnemy));
              }
            }
            self.enemies.splice(i, 1);
          }
          bulletHit = true;
        }
      }
      //Draw bullet
      if (bulletHit === false) {
        stroke(90, 90, 255);
      } else {
        stroke(255, 0, 0);
      }
      strokeWeight(3);
      line(x - self.camX, y - self.camY, (x - self.camX) + (dirX * width), (y - self.camY) + (dirY * height));
      noStroke();
      strokeWeight(1);
    }
    //Shop logic
    function ShopItem(cost, handler, compoundRate) {
      this.cost = cost;
      this.handler = handler;
      this.originalPrice = cost;
      this.compoundRate = compoundRate;
    }
    ShopItem.prototype.award = function (player) {
      if (player.points >= this.cost) {
        player.points -= this.cost;
        this.handler(player);
        if (this.compoundRate) {
          this.cost = Math.floor(this.cost * this.compoundRate);
        }
      }
    }
    ShopItem.prototype.resetPrice = function () {
      this.cost = this.originalPrice;
    }
    //Add shop items
    if(this.shopinit === false){
      this.shopItems.push([
        new ShopItem(8, player => {
          if (player.health < player.maxHealth) {
            player.health += 20;
            if (player.health > player.maxHealth) {
              player.health = player.maxHealth
            }
          } else {
            player.points += 8;
          }
        })]);
      //Shop items
      this.shopItems.push([
        new ShopItem(12, player => { player.gun.smg(); }),//Up
        new ShopItem(100, player => { player.gun.assault(); }),//Right
        new ShopItem(400, player => { player.gun.shotgun(); }),//Down
        new ShopItem(1000, player => { player.gun.sniper(); }),//Left
      ]);
      this.shopItems.push([
        new ShopItem(50, player => { player.damageAdder++; }, 2.2),
        new ShopItem(130, player => { player.maxHealth += 10; player.health += 10; }, 1.5),
        new ShopItem(200, player => { player.speedMultiplier += 0.08; }, 1.9),
        new ShopItem(500, player => { player.shotMultiplier++; }, 2.8),
      ]);
      this.shopinit = true
    }
    //Revive logic
    if (this.deadPlayers.length >= 1 && this.players.length > 1) {
      for (let i = 0; i < this.deadPlayers.length; i++) {
        this.shopItems[3][i] = new ShopItem(Math.floor(Math.pow(10, (self.level - 1) / 10 + 1)), () => {
          var currentDeadPlayer = self.deadPlayers[i];
          var newPlayerBody = new Player(self.camX + width / 2, self.camY - self.playerSize * 2, currentDeadPlayer.controller, currentDeadPlayer.number);
          newPlayerBody.kills = currentDeadPlayer.kills;
          newPlayerBody.damageDone = currentDeadPlayer.damageDone;
          newPlayerBody.points = Math.floor(currentDeadPlayer.points / 4);
          self.players.push(newPlayerBody);
          self.deadPlayers.splice(i, 1);
          self.shopItems[3].splice(i, 1);
        });
      }
    }


    function shopLogic(player, shopTrigger, upButton, downButton, leftButton, rightButton) {
      if (player.hasShop && shopTrigger) {
        player.shopOpened = true;
        if (!leftButton && !rightButton && !upButton && !downButton) {
          player.shopButtonPressed = false;
        }
        function shopButton(triggerButton, handler) {
          if (triggerButton && player.shopButtonPressed === false) {
            handler();
            player.shopButtonPressed = true;
          }
        }
        function shopLoop(index) {
          var currentShopGroup = self.shopItems[index];
          for (var i = 0; i < currentShopGroup.length; i++) {
            var shopTriggerButton;
            switch (i) {
              case 0:
                shopTriggerButton = upButton;
                break;
              case 1:
                shopTriggerButton = rightButton;
                break;
              case 2:
                shopTriggerButton = downButton;
                break;
              case 3:
                shopTriggerButton = leftButton;
                break;
            }
            shopButton(shopTriggerButton, () => { currentShopGroup[i].award(player); });
          }
        }
        if (player.shopMenu === "main") {
          shopButton(leftButton, () => { self.shopItems[0][0].award(player); });
          shopButton(upButton, () => { player.shopMenu = "revive"; });
          shopButton(rightButton, () => { player.shopMenu = "guns"; });
          shopButton(downButton, () => { player.shopMenu = "perks"; });
        }
        if (player.shopMenu === "guns") {
          shopLoop(1);
        }
        if (player.shopMenu === "guns2") {
          shopLoop(2);
        }
        if (player.shopMenu === "perks") {
          shopLoop(2);
        }
        if (player.shopMenu === "revive") {
          shopLoop(3);
        }
      } else {
        player.shopOpened = false;
        player.shopMenu = "main";
      }
    }
    //Update player logic
    let horizontalScreenEdgeDeadzone = 200;
    let verticalScreenEdgeDeadzone = height / 2 - (self.playerSize * 3);
    Player.prototype.update = function () {
      this.timer.update();
      this.currentGravityForce = getTransition(self.gravityForce, 1000, this.timer) / playerUpdateRatio;
      let verticalMovementSpeed = (this.currentGravityForce * 4) / playerUpdateRatio;
      let playerMovementSpeed = (this.currentGravityForce * 3 * this.speedMultiplier) / playerUpdateRatio;
      if (!this.controller) {
        //Define control systems for internal use
        let devices = get_devices();
        this.keyboardShop = devices.keyboard.keyCodes[88];//X
        if (!(this.keyboardShop && this.hasShop)) {
          this.keyboardUp = devices.keyboard.keyCodes[38];
          this.keyboardDown = devices.keyboard.keyCodes[40];
          this.keyboardLeft = devices.keyboard.keyCodes[37];
          this.keyboardRight = devices.keyboard.keyCodes[39];
          this.keyboardShoot = devices.keyboard.keyCodes[90];//Z
        }

        if (this.falling) {
          this.gravity += this.currentGravityForce;
        } else if (!this.keyboardUp) {
          this.gravity = 0;
        }

        //Jumping
        if (this.keyboardUp && this.jumping === false) {
          this.gravity -= this.currentGravityForce * 60;
          this.jumpKeyReleased = false;
          this.jumping = true;
        }
        if (!this.keyboardUp && this.jumping === true) {
          this.jumpKeyReleased = true;
        }
        if (this.keyboardDown) {
          this.gravity += verticalMovementSpeed;
        }
        //Horizontal
        if (this.keyboardRight) {
          this.horizontalVelocity += playerMovementSpeed;
          this.direction = 'right';
        }
        if (this.keyboardLeft) {
          this.horizontalVelocity -= playerMovementSpeed;
          this.direction = 'left';
        }

        shopLogic(this, this.keyboardShop, devices.keyboard.keyCodes[38], devices.keyboard.keyCodes[40], devices.keyboard.keyCodes[37], devices.keyboard.keyCodes[39]);
      }
      if (this.controller) {
        //Define control systems for internal use
        this.controllerShop = this.controller.buttons[4].pressed;//L1
        this.controllerUp = this.controller.buttons[0].pressed;//X
        this.controllerLeftStickY = this.controller.axes[1];//Right-down stick
        this.controllerLeftStickX = this.controller.axes[0];
        this.controllerShoot = this.controller.buttons[3].pressed;//Square

        if (this.falling) {
          this.gravity += this.currentGravityForce;
        } else if (!this.controllerUp) {
          this.gravity = 0;
        }

        //Jumping
        if (this.controllerUp && this.jumping === false) {
          this.gravity -= this.currentGravityForce * 60;
          this.jumpKeyReleased = false;
          this.jumping = true;
        }
        if (!this.controllerUp && this.jumping === true) {
          this.jumpKeyReleased = true;
        }
        if (this.controllerLeftStickY > 0.9) {
          this.gravity += verticalMovementSpeed;
        }
        //Horizontal
        if (Math.abs(this.controllerLeftStickX) > self.controllerDeadzone) {
          this.horizontalVelocity += playerMovementSpeed * this.controllerLeftStickX;
          this.direction = 'left';
          if (this.controllerLeftStickX > 0) {
            this.direction = 'right';
          }
        }

        shopLogic(this, this.controllerShop, (this.controller.axes[7] < 0), (this.controller.axes[7] > 0), (this.controller.axes[6] < 0), (this.controller.axes[6] > 0));
      }
      this.horizontalVelocity = this.horizontalVelocity / 1.06;

      //Prevent player from going off screen
      var screenDeadzone = 10;
      if (this.x - self.camX <= screenDeadzone) {
        this.x += self.camX - (this.x - screenDeadzone);
      }
      if (this.x + self.playerSize - self.camX >= width - screenDeadzone) {
        this.x += (self.camX + (width - screenDeadzone)) - (this.x + self.playerSize);
      }
      if (this.y - self.camY <= screenDeadzone) {
        this.y += self.camY - (this.y - screenDeadzone);
      }
      if (this.y + self.playerSize - self.camY >= height - screenDeadzone) {
        this.y += (self.camY + (height - screenDeadzone)) - (this.y + self.playerSize);
      }

      //Apply gravities
      this.y += this.gravity;
      this.x += this.horizontalVelocity;
    }
    Player.prototype.shoot = function () {
      //Shooting
      if (this.keyboardShoot || this.controllerShoot) {
        if (self.menuState === "game") {
          var shotDirection = 1;
          if (this.direction === 'left') {
            shotDirection = -1;
          }
          if (this.gun.special === false) {
            if (this.gun.automatic === false && this.gunFired === false) {
              for (var i = 0; i < this.shotMultiplier; i++) {
                fireBullet(this.x + self.playerSize / 2, this.y + self.playerSize / 2, shotDirection, customRandom(-this.gun.spread / 100, this.gun.spread / 100), this);
              }
              this.gunFired = true;
            }
            if (this.gun.automatic === true) {
              this.gunTimer.update();
              this.gunCooldownCounter += getTransition(this.gun.fireRate, 1000, this.gunTimer);
              if (this.gunShotCount <= this.gunCooldownCounter) {
                for (var i = 0; i < this.shotMultiplier; i++) {
                  fireBullet(this.x + self.playerSize / 2, this.y + self.playerSize / 2, shotDirection, customRandom(-this.gun.spread / 100, this.gun.spread / 100), this);
                }
                this.gunShotCount++;
              }
            }
          } else {
            if (this.gun.name === "shotgun" && this.gunFired === false) {
              for (var i = 0; i < 8 + (this.shotMultiplier - 1); i++) {
                fireBullet(this.x + self.playerSize / 2, this.y + self.playerSize / 2, shotDirection, customRandom(-this.gun.spread / 100, this.gun.spread / 100), this);
              }
              this.gunFired = true;
            }
          }
        }
      } else {
        this.gunFired = false;
        this.gunCooldownCounter = 0;
        this.gunShotCount = 0;
      }
    }
    Player.prototype.moveCamera = function () {
      //Move camera when approaching the end of the screen
      if (this.x - self.camX + self.playerSize + this.horizontalVelocity > width - horizontalScreenEdgeDeadzone) {
        self.camX += (this.x - self.camX + self.playerSize) - (width - horizontalScreenEdgeDeadzone);
      }
      if (this.x - self.camX + this.horizontalVelocity < horizontalScreenEdgeDeadzone) {
        self.camX += (this.x - self.camX) - horizontalScreenEdgeDeadzone;
      }
      if (this.y - self.camY + self.playerSize + this.gravity > height - verticalScreenEdgeDeadzone) {
        self.camY += (this.y - self.camY + self.playerSize) - (height - verticalScreenEdgeDeadzone);
      }
      if (this.y - self.camY + this.gravity < verticalScreenEdgeDeadzone) {
        self.camY += (this.y - self.camY) - verticalScreenEdgeDeadzone;
      }
    }
    Player.prototype.updateWorld = function () {
      //Deal with world interaction
      var fallingVariableBuffer = true;
      var hasShopBuffer = false;
      for (var i = -1; i < Math.floor(self.playerSize / self.groundStepWidth + 2); i++) {
        let currentWorld = self.world[Math.abs(i + Math.floor(this.x / self.groundStepWidth))];
        if (currentWorld) {
          let currentWorldLevel = currentWorld[0];
          let currentWorldLevelX = Math.floor(this.x / self.groundStepWidth + i) * self.groundStepWidth;
          //Deal with collisions
          if (this.y + self.playerSize + 1 > currentWorldLevel && this.x + self.playerSize > currentWorldLevelX && this.x < currentWorldLevelX + self.groundStepWidth) {
            fallingVariableBuffer = false;
            if (this.jumpKeyReleased === true) {
              this.jumping = false;
            }
            if (self.playerSize / 5 + this.gravity > this.y + self.playerSize + 1 - currentWorldLevel) {
              this.y = currentWorldLevel - self.playerSize;
            } else {
              if (this.horizontalVelocity > 0 && this.x + self.playerSize > currentWorldLevelX) {
                this.x = currentWorldLevelX - self.playerSize - this.horizontalVelocity;
                this.horizontalVelocity = 0;
              }
              if (this.horizontalVelocity < 0 && this.x < currentWorldLevelX + self.groundStepWidth) {
                this.x = currentWorldLevelX + self.groundStepWidth - this.horizontalVelocity;
                this.horizontalVelocity = 0;
              }
            }
          }
          if (this.y > currentWorldLevel) {
            this.y = currentWorldLevel - self.playerSize;
          }
          if (currentWorld[1] === true) {
            hasShopBuffer = true;
          }
        }
      }
      this.hasShop = hasShopBuffer;
      this.falling = fallingVariableBuffer;
    }
    //Draw player
    Player.prototype.draw = function () {
      if (this.x - self.camX >= 0 && this.y - self.camY >= 0 && this.x - self.camX + self.playerSize <= width && this.y - self.camY + self.playerSize <= height) {
        push();
        stroke(0);
        fill(255, 50, 50);
        translate(this.x - self.camX, this.y - self.camY);
        rect(0, -10, this.health / this.maxHealth * self.playerSize, 5);
        fillPlayerNumber(this.number);
        rect(0, 0, self.playerSize, self.playerSize);

        if (this.shopOpened === true) {
          //Shop menu
          push();
          var shopScale = 1.3;
          translate(self.playerSize / 2, -65 * shopScale);
          scale(shopScale);
          fill(230, 230, 230);
          ellipse(0, 0, 70, 70);
          stroke(0);
          line(-20, -20, 20, 20);
          line(20, -20, -20, 20);
          textSize(10);
          var thisPlayer = this;
          var displayGun = new Gun();
          function displayPrice(price, side) {
            if (thisPlayer.points < price) {
              fill(255, 70, 70);
            } else {
              fill(0, 225, 0);
            }
            var textAlignment;
            switch (side) {
              case 'left':
                textAlignment = [-51, 5];
                break;
              case 'right':
                textAlignment = [51, 5];
                break;
              case 'bottom':
                textAlignment = [0, 47];
                break;
              case 'top':
                textAlignment = [0, -44];
                break;
            }
            simpleCenterText("$" + price, textAlignment[0], textAlignment[1]);
          }
          if (this.shopMenu === "main") {
            //Health
            noStroke();
            displayPrice(self.shopItems[0][0].cost, 'left');
            fill(255, 30, 30);
            rect(-22.5, 0, 5, 5);
            rect(-19.5, -3.5, 5, 5);
            rect(-25.5, -3.5, 5, 5);

            //Perks
            fill(10, 90, 255);
            rect(-7.5, 17, 17, 6);
            rect(-2, 12, 6, 16);

            //Gun
            push();
            translate(13, -11 / 2);
            displayGun.pistol();
            displayGun.art();
            pop();

            //Revive
            fill(70, 200, 70)
            triangle(0, -28, 8, -21, -8, -21);
            rect(-4, -23, 8, 10, 2);

          }
          function displayShopPrices(shopItemList) {
            noStroke();
            for (var i = 0; i < shopItemList.length; i++) {
              var displaySide;
              switch (i) {
                case 0:
                  displaySide = "top";
                  break;
                case 1:
                  displaySide = "right";
                  break;
                case 2:
                  displaySide = "bottom";
                  break;
                case 3:
                  displaySide = "left";
                  break;
              }
              displayPrice(shopItemList[i].cost, displaySide);
            }
          }
          if (this.shopMenu === "guns") {
            //SMG
            push();
            translate(-12, -28);
            scale(0.5);
            displayGun.smg();
            displayGun.art();
            pop();

            //Assault Rifle
            push();
            translate(11, -2);
            scale(0.48);
            displayGun.assault();
            displayGun.art();
            pop();

            //Shotgun
            push();
            translate(-10, 17);
            scale(0.4);
            displayGun.shotgun();
            displayGun.art();
            pop();

            //Sniper
            push();
            translate(-28, -1);
            scale(0.5);
            displayGun.sniper();
            displayGun.art();
            pop();

            displayShopPrices(self.shopItems[1]);
          }
          if (this.shopMenu === "perks") {
            push();
            //Bullet damage
            scale(0.5);
            noStroke();
            push();
            translate(-18, -50);
            fill(125, 125, 125);
            rect(12, 0, 11, 10, 10);
            rect(0, 0, 18, 10, 1);

            fill(255, 64, 64);
            var xOffset = 23;
            var yOffset = 1;
            rect(-5.5 + xOffset, 17 + yOffset, 17, 6);
            rect(0 + xOffset, 12 + yOffset, 6, 16);
            pop();

            //More max health
            push();
            translate(35, 0);
            scale(2);
            noStroke();
            fill(255, 200, 40);
            rect(0, 0, 5, 5);
            rect(3, -3.5, 5, 5);
            rect(-3, -3.5, 5, 5);
            pop();

            //Speed
            push();
            translate(-14, 30);
            scale(0.7);
            fill(40, 220, 225);
            stroke(0);

            beginShape();
            vertex(0, -5);
            vertex(20, -5);
            vertex(16, -15);
            vertex(34, 0);
            vertex(16, 15);
            vertex(20, 5);
            vertex(0, 5);
            vertex(0, -5);
            endShape();

            translate(17, 26);

            beginShape();
            vertex(0, -5);
            vertex(20, -5);
            vertex(16, -15);
            vertex(34, 0);
            vertex(16, 15);
            vertex(20, 5);
            vertex(0, 5);
            vertex(0, -5);
            endShape();
            pop();

            //More Bullets
            push();
            translate(-60, -13);
            fill(125, 125, 125);
            rect(12, 0, 11, 10, 10);
            rect(0, 0, 18, 10, 1);

            rect(21, 17, 11, 10, 10);
            rect(9, 17, 18, 10, 1);
            pop();

            pop();

            displayShopPrices(self.shopItems[2]);
          }
          if (this.shopMenu === "revive") {
            for (var i = 0; i < self.deadPlayers.length; i++) {
              push();
              switch (i) {
                case 0:
                  displayPrice(self.shopItems[3][i].cost, 'top');
                  translate(0, -20);
                  break;
                case 1:
                  displayPrice(self.shopItems[3][i].cost, 'right');
                  translate(20, 0);
                  break;
                case 2:
                  displayPrice(self.shopItems[3][i].cost, 'bottom');
                  translate(0, 20);
                  break;
                case 3:
                  displayPrice(self.shopItems[3][i].cost, 'left');
                  translate(-20, 0);
                  break;
              }
              fillPlayerNumber(self.deadPlayers[i].number);
              rect(-8, -8, 16, 16);
              pop();
            }
          }
          pop();
        } else if (this.hasShop === true) {
          //Shop hint
          fill(255);
          noStroke();
          textSize(16);
          if (this.controller) {
            simpleCenterText("Hold L1 to open the shop", self.playerSize / 2, -20);
          } else {
            simpleCenterText("Hold X to open the shop", self.playerSize / 2, -20);
          }
        }

        this.gun.art(this.direction);
        pop();
      }
    }
    //Enemies
    function Enemy(enemy) {
      if (enemy) {
        this.x = enemy.x + customRandom(-self.enemySize * 2, self.enemySize * 2);
        this.y = enemy.y - 2;
        this.gravity = enemy.gravity;
        this.horizontalVelocity = enemy.horizontalVelocity;
      } else {
        this.x = self.camX + Math.random() * width;
        this.y = -self.enemySize + self.camY;
        this.gravity = 0;
        this.horizontalVelocity = 0;
      }

      this.health = 100;
      this.timer = create_timer();

      this.falling = true;
      this.geneticVariation = Math.random() + 0.5;
    }
    //Update enemy world interaction logic
    Enemy.prototype.updateWorld = function () {
      //Deal with ground collision and jumping
      var fallingVariableBuffer = true;
      var verticalMovementSpeed = self.enemySize / 5;
      for (var i = -1; i < Math.floor(self.enemySize / self.groundStepWidth + 2); i++) {
        let currentWorld = self.world[Math.abs(i + Math.floor(this.x / self.groundStepWidth))];
        if (currentWorld) {
          let currentWorldLevel = currentWorld[0];
          let currentWorldLevelX = Math.floor(this.x / self.groundStepWidth + i) * self.groundStepWidth;
          //Deal with collisions
          if (this.y + self.enemySize + 1 > currentWorldLevel && (this.x + self.enemySize) > currentWorldLevelX && (this.x) < currentWorldLevelX + self.groundStepWidth) {
            fallingVariableBuffer = false;
            if ((this.y + self.enemySize + 1 - currentWorldLevel) < self.enemySize / 5 + this.gravity) {
              this.y = currentWorldLevel - self.enemySize;
            } else {
              if (this.horizontalVelocity > 0 && this.x + self.enemySize > currentWorldLevelX) {
                this.x = currentWorldLevelX - self.enemySize;
                this.horizontalVelocity = 0;
                this.gravity -= verticalMovementSpeed * this.geneticVariation;
                this.jumping = true;
              }
              if (this.horizontalVelocity < 0 && this.x < currentWorldLevelX + self.groundStepWidth) {
                this.x = currentWorldLevelX + self.groundStepWidth;
                this.horizontalVelocity = 0;
                this.gravity -= verticalMovementSpeed * this.geneticVariation;
                this.jumping = true;
              }
            }
          }
        } else {
          this.suspend = true;
        }
      }
      this.falling = fallingVariableBuffer;
    }
    //Update enemy logic
    Enemy.prototype.update = function () {
      this.timer.update();
      var enemyMovementSpeed = getTransition((100 / Math.max(5, this.health)) + (self.gravityForce * 1.2 + (this.geneticVariation * 3 - 1.5)), 1000, this.timer);
      // console.log(this.health)
      if (this.suspend === false) {
        let currentGravityForce = getTransition(self.gravityForce, 1000, this.timer);
        if (this.falling) {
          this.gravity += currentGravityForce;
        } else if (!this.jumping) {
          this.gravity = 0;
        }
        this.jumping = false;

        //Find nearest player to target
        var leastPlayerDistance = Infinity;
        let targetPlayer;
        for (var i = 0; i < self.players.length; i++) {
          var currentPlayer = self.players[i];
          var playerDistance = Math.abs(this.x - currentPlayer.x) + Math.abs(this.y - currentPlayer.y);
          if (playerDistance < leastPlayerDistance) {
            leastPlayerDistance = playerDistance;
            targetPlayer = currentPlayer;
          }
        }
        if (!targetPlayer) {
          targetPlayer = new Player(this.x, 0);
        }

        //Horizontal
        if (this.x < targetPlayer.x + self.playerSize / 2 - self.enemySize / 2) {
          this.horizontalVelocity += enemyMovementSpeed;
        } else {
          this.horizontalVelocity -= enemyMovementSpeed;
        }
        this.horizontalVelocity = this.horizontalVelocity / 1.06;

        //Apply gravities
        this.y += this.gravity;
        this.x += this.horizontalVelocity;
      }
      this.suspend = false;
    }
    let percieved_enemy_x, percieved_enemy_y, anger;
    let enemy_size = self.enemySize;
    Enemy.prototype.draw = function () {
      percieved_enemy_x = this.x - self.camX;
      percieved_enemy_y = this.y - self.camY;
      if (percieved_enemy_x > 0 && percieved_enemy_y > 0 && percieved_enemy_x + enemy_size < width && percieved_enemy_y + enemy_size < height) {
        anger = (this.health / 100) * 130;
        fill(255, anger, anger);
        rect(percieved_enemy_x, percieved_enemy_y, enemy_size, enemy_size);
      }
    }

    this.mayhem = function(){
      for(let i = 0; i < 10000; i++){
        this.enemies.push(new Enemy(this.enemies[0]));
      }
      // kill(1);
      console.log(this.enemies.length);
      this.uncapped = true;
    }
    self.world[0] = [height / 2, false, false];

    //Menu system
    this.levelTransitionTimer.update();
    if (this.menuState === "start") {
      fill(150, 205, 150);
      rect(0, 0, width, height);

      fill(0);
      centerText("SOTF", width / 2 - 20, height / 2 - 20, 40, 40, 75);
      this.startupScreenTimer -= getTransition(72, 2500, this.levelTransitionTimer);
      if (this.startupScreenTimer <= 0) {
        this.menuState = "menu";
      }
    }
    if (this.menuState === "menu") {
      fill(127);
      rect(0, 0, width, height);
      fill(255);
      centerText("Survival of the Fittest", width / 2 - 20, 30, 40, 40, 75);

      //Start Game button
      function singlePlayerMenuState() {
        self.menuState = "game";
        resume(self.pid);
        self.players.push(new Player(width / 2, 60));
        self.enemies.push(new Enemy());
      }
      function multiplayerMenuState() {
        self.menuState = "multiplayer";
      }
      fill(30);
      labledButton(100, 150, width - 200, 100, singlePlayerMenuState, "Single Player", 30);
      fill(30);
      labledButton(100, 300, width - 200, 100, multiplayerMenuState, "Multiplayer", 30);
    }
    if (this.menuState === "multiplayer") {
      fill(127);
      rect(0, 0, width, height);
      fill(255);
      centerText("To join, press X on your controller.", width / 2 - 20, 50, 40, 40, 32);
      function startMultiplayerGame() {
        self.players = self.playerBuffer;
        self.menuState = "game";
        resume(self.pid);
        for (var i = 0; i < self.playerBuffer.length; i++) {
          self.enemies.push(new Enemy());
        }
        self.levelKillGoal = self.levelKillGoal * self.playerBuffer.length;
        self.playerBuffer = [];
      }
      if (this.playerBuffer.length > 0) {
        labledButton(100, 400, width - 200, 40, startMultiplayerGame, "All players are ready", 20);
      }
      let devices = get_devices();
      for (let i = 0; i < devices.controllers.length; i++) {
        if (devices.controllers[i].buttons[0].pressed === true) {
          var controllerHasPlayer = false;
          for (let l = 0; l < this.playerBuffer.length; l++) {
            if (devices.controllers[i].index === this.playerBuffer[l].controller.index) {
              controllerHasPlayer = true;
            }
          }
          if (controllerHasPlayer === false) {
            this.playerBuffer.push(new Player(width / 2, 60, devices.controllers[i], this.playerBuffer.length));
          }
        }
        if (devices.controllers[i].buttons[1].pressed === true) {
          for (var l = 0; l < this.playerBuffer.length; l++) {
            if (devices.controllers[i].index === this.playerBuffer[l].controller.index) {
              this.playerBuffer.splice(l, 1);
              for (var x = 0; x < this.playerBuffer.length; x++) {
                this.playerBuffer[x].number = x;
              }
            }
          }
        }
      }
      for (let i = 0; i < this.playerBuffer.length; i++) {
        push();
        fillPlayerNumber(this.playerBuffer[i].number);
        if (this.playerBuffer[i].controller.buttons[0].pressed) {
          fill(255);
        }
        rect(200 + (width - 200) * (i / this.playerBuffer.length), 200, self.playerSize, self.playerSize);
        blankButton(200 + (width - 200) * (i / this.playerBuffer.length), 200, self.playerSize, self.playerSize, () => {
          self.playerBuffer.splice(i, 1);
        });
        pop();
      }
    }

    if (this.transitionNextLevel === true) {
      this.nextLevelTransitionCounter += getTransition(1, 1000, this.levelTransitionTimer);
      var timeLeft = (3 - floor(this.nextLevelTransitionCounter));
      if (timeLeft <= 0) {
        this.levelKillGoal = Math.round(this.levelKillGoal * 1.5);
        this.enemiesKilled = 0;
        this.level++;
        for (var i = 0; i < this.level * this.players.length; i++) {
          this.enemies.push(new Enemy());
        }
        this.levelFinished = false;
        this.transitionNextLevel = false;
        this.nextLevelTransitionCounter = 0;
      } else {
        push();
        fill(50, 155, 50);
        centerText("Level Complete!", width / 2 - 40, 100, 40, 40, 20);
        fill(35);
        textSize(18)
        text("Next level beginning in " + timeLeft + " seconds...", 100, 100);
        pop();
      }
    }

    if (this.menuState === "no players") {
      //Start Game button
      function revertMenuState() {
        self.menuState = "menu";
        self.world = [];
        self.enemies = [];
        self.players = [];
        self.deadPlayers = [];
        self.level = 1;
        self.camX = 0;
        self.camY = 0;
        self.levelKillGoal = 2;
        self.enemiesKilled = 0;
        for (var i = 0; i < self.shopItems.length; i++) {
          for (var l = 0; l < self.shopItems[i].length; l++) {
            self.shopItems[i][l].resetPrice();
          }
        }
        suspend(self.pid);
        console.log(self.pid)
      }
      push();
      fill(255, 0, 0);
      centerText("Loser Cruiser", width / 2 - 20, 100, 40, 40, 40);

      fill(30);
      Button(width / 2 - 150, height / 2 - 100, 300, 200, revertMenuState);
      fill(255)
      centerText("Main Menu", width / 2 - 20, height / 2 - 20, 40, 40, 20);
      pop();
    }
    if (this.menuState === "paused") {
      push();
      fill(127, 127, 127);
      centerText("The game has been paused", width / 2 - 20, 100, 40, 40, 40);
      centerText("Press ESC to resume", width / 2 - 20, 300, 40, 40, 40);
      pop();
    }
  }
  updateLogic() {
    if (this.enemiesKilled >= Math.round(this.levelKillGoal) && this.menuState === "game" && this.transitionNextLevel === false) {
      this.transitionNextLevel = true;
      this.enemies = [];
      for (var i = 0; i < this.players.length; i++) {
        this.players[i].health += 15;
        if (this.players[i].health > this.players[i].maxHealth) {
          this.players[i].health = this.players[i].maxHealth;
        }
        this.players[i].points += this.level;
      }
    }
    if (this.players.length === 0) {
      this.menuState = "no players";
    }
  }
  createWindow() {
    instance = new SOTF();
    //Functions for updating game mechanics
    function drawPlayers() {
      push();
      for (var i = instance.players.length - 1; i >= 0; i--) {
        instance.players[i].moveCamera();
        instance.players[i].draw();
      }
      pop();
    }
    function updatePlayers() {
      for (var i = 0; i < instance.players.length; i++) {
        instance.players[i].updateWorld();
        instance.players[i].update();
      }
      sleep(8);
    }
    function updatePlayersInputs() {
      for (var i = 0; i < instance.players.length; i++) {
        instance.players[i].updateInput();
      }
    }
    function updatePlayerShooting() {
      for (var i = 0; i < instance.players.length; i++) {
        instance.players[i].shoot();
      }
    }
    function drawEnemies() {
      push();
      stroke(0);
      for (let i = 0; i < instance.enemies.length; i++) {
          instance.enemies[i].draw();
      }
      pop();
    }
    function updateEnemies() {
      for (var i = 0; i < instance.enemies.length; i++) {
        instance.enemies[i].updateWorld();
        instance.enemies[i].update();
        if (instance.enemies.dead === true) {
          instance.enemies.splice(i, 1);
        }
      }
      sleep(10);
    }
    let enemy_collision_timer = create_timer();
    function updateEnemyPlayerCollisions() {
      enemy_collision_timer.update();
      for (var i = 0; i < instance.players.length; i++) {
        var currentPlayer = instance.players[i];
        for (var l = 0; l < instance.enemies.length; l++) {
          var currentEnemy = instance.enemies[l];
          if (currentEnemy.x + instance.enemySize > currentPlayer.x && currentEnemy.x < currentPlayer.x + instance.playerSize && currentEnemy.y + instance.playerSize > currentPlayer.y && currentEnemy.y < currentPlayer.y + instance.playerSize) {
            currentPlayer.health -= getTransition(100, 5000, enemy_collision_timer);
          }
        }
        if (currentPlayer.health < 0) {
          instance.deadPlayers.push(instance.players[i]);
          instance.players.splice(i, 1);
        }
      }
      sleep(30);
    }
    const maxEnemies = 10000;
    function capEnemyCount() {
      if (instance.enemies.length > instance.levelKillGoal - instance.enemiesKilled && instance.enemies.length > 0 && !instance.uncapped) {
        for (var i = instance.enemies.length; i >= Math.min(instance.levelKillGoal - instance.enemiesKilled, maxEnemies); i--) {
          instance.enemies.splice(i, 1);
        }
      }
      sleep(100);
    }
    //World Generation
    function generateWorld() {
      let newGenerationHeight;
      let generationOverscan = (60 / instance.groundStepWidth);
      for (let i = 1; i < width / instance.groundStepWidth + generationOverscan * 2; i++) {
        let worldIndex = Math.abs(i + Math.floor(instance.camX / instance.groundStepWidth - generationOverscan));
        if (!instance.world[worldIndex]) {
          if (worldIndex !== 0) {
            let previousWorld = instance.world[worldIndex - 1];
            for (var l = 1; previousWorld === undefined; l++) {
              previousWorld = instance.world[worldIndex - l];
            }
            if (instance.worldGenerationNumber > 0) {
              instance.worldGenerationNumber = Math.min(instance.groundStepHeight * 15, instance.worldGenerationNumber + customRandom(-instance.groundStepHeight, instance.groundStepHeight));
            } else {
              instance.worldGenerationNumber = Math.max(-(instance.groundStepHeight * 15), instance.worldGenerationNumber + customRandom(-instance.groundStepHeight, instance.groundStepHeight));
            }
            newGenerationHeight = previousWorld[0] + instance.worldGenerationNumber;
          }
          //World Features: [y, hasShop, hasFlower]
          instance.world[worldIndex] = [newGenerationHeight, (Math.random() < 0.005), (Math.random() < 0.08)];
        }
      }
      sleep(100);
    }
    function renderWorld() {
      push();
      noStroke();
      fill(100, 255, 100);
      var adjustedCamX = instance.camX / instance.groundStepWidth;
      for (var i = Math.floor(adjustedCamX); i < width / instance.groundStepWidth + adjustedCamX; i++) {
        let worldBlock = instance.world[Math.abs(i)];
        if (worldBlock) {
          translate(i * instance.groundStepWidth - instance.camX, worldBlock[0] - instance.camY);
          rect(0, 0, instance.groundStepWidth, Math.max(height - (worldBlock[0] - instance.camY), 0));
          if (worldBlock[2] === true) {
            fill(100, 255, 100);
            rect(instance.groundStepWidth / 2 - 1, -3, 2, 3);
            fill(255, 0, 240);
            rect(instance.groundStepWidth / 2 - 2.5, -8, 5, 5);
            fill(100, 255, 100);
          }
          if (worldBlock[1] === true) {
            push();
            scale(0.5);
            translate(0, -148);
            fill(210, 40, 40);
            triangle(0, 69, 0, 0, 81, 69);
            fill(220);
            rect(0, 68, 80, 80);
            fill(50, 50, 255)
            rect(54, 72, 20, 20);
            rect(5, 72, 20, 20);
            rect(5, 37, 20, 20);
            rect(25, 102, 30, 46);
            fill(127, 127, 127);
            ellipse(50, 122, 5, 5);
            pop();
          }
          translate(-(i * instance.groundStepWidth - instance.camX), -(worldBlock[0] - instance.camY));
        }
      }
      pop();
    }
    function renderHud() {
      push();
      var hudScale = 1.5;
      scale(hudScale);
      width = width / hudScale;
      height = height / hudScale;
      fill(100);
      rect(width / 2, 0, width / 2, 20);

      fill(255);
      textSize(12);
      text("Level: " + instance.level, width / 2 + 6, 14);
      text("Enemies Left: " + Math.max(instance.levelKillGoal - instance.enemiesKilled, 0), width / 2 + 70, 14);

      //Scoreboard
      noStroke();
      for (var i = 0; i < instance.players.length; i++) {
        var currentPlayer = instance.players[i];
        fillPlayerNumber(currentPlayer.number);
        rect(width - 200, 20 * i, 200, 20);
        fill(0);
        var killMessage = currentPlayer.kills + " kills | ";
        if (currentPlayer.kills === 1) {
          killMessage = currentPlayer.kills + " kill | ";
        }
        text("$" + currentPlayer.points + " | " + killMessage + currentPlayer.damageDone + " damage", width - 195, 14 + (20 * i));
      }
      width = width * hudScale;
      height = height * hudScale;
      pop();
    }
    function updateGameLogic() {
      instance.updateLogic();
      sleep(30);
    }

    //Background
    let backgroundCanvas, imagedata;
    let resolutionScale = 1;
    create_init(() => {
      backgroundCanvas = createGraphics(width, height);
      //Sky
      //TODO: Add day/night cycle
      backgroundCanvas.noStroke();
      for (var i = 0; i < height; i += resolutionScale) {
        var scaledBackground = (i/height) * 255;
        backgroundCanvas.fill(100 + scaledBackground, 150, 255 - scaledBackground / 3);
        backgroundCanvas.rect(0, i, width, resolutionScale + 1);
      }
      //Clouds

      /* Emo black background
      fill(0, 0, 0);
      rect(0, 0, width, height);
      */
      exit();
    });
    function drawBackground() {
      image(backgroundCanvas, 0, 0);
    }
    function updateGame() {
      instance.update();
    }
    let logic = function(){
      instance.pid = getpid();
      // proc().suspend = true
      suspendLogic();
      priority(1);
      thread(updateGame);
      thread(generateWorld);
      thread(capEnemyCount);
      thread(updatePlayers);
      thread(updateEnemyPlayerCollisions);
      thread(updateGameLogic);
      exit();
    }
    // Separate enemy handling because it is what causes the most lag
    let enemy_logic = function() {
      priority(-1);
      thread(updateEnemies);
      exit();
    }
    create_init(enemy_logic);

    create_init(logic);
    function suspendLogic() {
      suspend(instance.pid);
      console.log(instance.pid)
    }
    function resumeLogic() {
      resume(instance.pid);
      console.log(instance.pid)
    }
    function pauseDaemon() {
      for (let i = 0; i < instance.players.length; i++) {
        let currentPlayer = instance.players[i];
        if (currentPlayer.controller) {
          //TODO: Add code for pause button on controller
        } else {
          let devices = get_devices();
          if (instance.menuState === "game" && devices.keyboard.keyCodes[27]) {
            instance.menuState = "paused";
            suspendLogic();
          }
          if (instance.menuState === "paused" && devices.keyboard.keyCodes[27]) {
            instance.menuState = "game";
            resumeLogic();
          }
        }
      }
    }

    function displayGamePerformance(latency) {
      push();
      translate(76, 0)
      fill(127, 127, 255);
      rect(0, 0, 38, 30);
      stroke(0);
      fill(0);
      textSize(14);
      text(Math.round(1000 / latency), 10, 19);
      pop();
    }
    draws = [];
    let Draw = function(command){
      this.command = command;
      this.time = 0;
    }
    Draw.prototype.run = function(){
      let time = get_time();
      this.command();
      this.time = get_time() - time;
    }
    let c_draw = function(command){
      draws.push(new Draw(command));
    }
    let run_draws = function(){
      for(let i = 0; i < draws.length; i++)
        draws[i].run();
    }
    c_draw(drawBackground);
    c_draw(renderWorld);
    c_draw(drawEnemies);
    c_draw(updatePlayerShooting);
    c_draw(drawPlayers);
    c_draw(renderHud);
    c_draw(updateGame);
    c_draw(pauseDaemon);

    //Create processes to pass into the window manager
    let time_tracker = performance.now();
    let drawing_process = function () {
      let time_before = performance.now();
      let time_delay = time_before - time_tracker;
      time_tracker = time_before;
      // drawBackground();
      // renderWorld();
      // drawEnemies();
      // updatePlayerShooting();
      // drawPlayers();
      // renderHud();
      // updateGame();
      // pauseDaemon();
      run_draws();
      displayGamePerformance(time_delay);
      sleep(16);
    };

    create_init(drawing_process);
  }
  iconFunction() {
    noStroke();
    fill(80, 200, 80);
    rect(0, 0, width, height, 3);
    fill(255, 255, 255);
    textSize(width / 3.2);
    text("SOTF", width / 10, height / 2.5);
    rect(width / 10, height * 0.7, width * 0.8, height / 5);
  }
}

//Create sotf instance
let sotfSystem = new SOTF;
sotfSystem.createWindow();