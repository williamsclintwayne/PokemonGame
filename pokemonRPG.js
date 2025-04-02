(function () {
    class Game {
      constructor(p) {
        this.p = p;
        this.player = {
          x: 300,
          y: 300,
          spriteSheet: null,
          currentFrame: 0,
          animationTimer: 0,
          direction: "down",
          inventory: new Inventory(),
          quests: [],
          pokemon: [
            {
              name: "Bulbasaur",
              level: 5,
              hp: 45,
              maxHp: 45,
              type: "grass",
              moves: ["Tackle", "Growl"]
            }
          ],
        };
  
        this.mapData = null;
        this.npcsData = null;
        this.npcs = [];
        this.sounds = {};
        this.camera = { x: 0, y: 0 };
        this.lastStep = 0;
        this.inDialog = false;
        this.collisionLayer = [];
      }
  
      async preload() {
        this.playerSpriteSheet = this.p.loadImage("./assets/sprites/player.png");
        this.player.spriteSheet = this.playerSpriteSheet;
        this.npcSpriteSheet = this.p.loadImage("./assets/sprites/npcs.png");
        this.mapTileset = this.p.loadImage("./assets/tileset.png");
        
        this.sounds.step = this.p.loadSound("./assets/sfx/step.mp3");
        this.sounds.battle = this.p.loadSound("./assets/sfx/battle.mp3");
        
        this.mapData = await this.p.loadJSON("./data/map.json");
        this.npcsData = await this.p.loadJSON("./data/npcs.json");

        console.log("NPC Data Loaded:", this.npcsData); // Debug log
      }
  
      setup() {
        this.p.createCanvas(800, 600);
        this.updateCamera();
        this.loadMapCollisions();
        this.initNPCs();
        this.p.frameRate(60);
      }
  
      initNPCs() {
        if (!Array.isArray(this.npcsData)) {
            console.error("NPC data is not an array:", this.npcsData);
            return;
        }
        this.npcs = this.npcsData.map(npc => new NPC(npc));
    }
  
      loadMapCollisions() {
        const collisionLayer = this.mapData.layers.find(layer => layer.name === "collisions");
    if (!collisionLayer) {
        console.error("Collision layer not found in map data.");
        return;
    }
    this.collisionLayer = collisionLayer.data;
      }
  
      draw() {
        this.updateCamera();
        this.p.background("#78C850");
        this.drawMap();
        this.drawObjects();
        this.drawNPCs();
        this.drawPlayer();
        this.drawHUD();
  
        if (!this.inDialog) this.handleMovement();
        this.checkInteractions();
      }
  
      drawMap() {
        const tileSize = this.mapData.tilewidth; // Assuming tilewidth is the same for height
        const groundLayer = this.mapData.layers.find(layer => layer.name === "Ground");
        
        for (let y = 0; y < this.mapData.height; y++) {
            for (let x = 0; x < this.mapData.width; x++) {
                const index = x + y * this.mapData.width;
                const tile = groundLayer.data[index];
                if (tile === 0) continue; // Skip empty tiles
                
                const sx = (tile - 1) % 8 * tileSize; // Calculate source x position
                const sy = Math.floor((tile - 1) / 8) * tileSize; // Calculate source y position
                
                this.p.image(
                    this.map .tileset,
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize,
                    sx,
                    sy,
                    tileSize,
                    tileSize
                );
            }
        }
    }
    
    drawObjects() {
        const objectLayer = this.mapData.layers.find(layer => layer.name === "Objects");
        
        for (let y = 0; y < this.mapData.height; y++) {
            for (let x = 0; x < this.mapData.width; x++) {
                const index = x + y * this.mapData.width;
                const tile = objectLayer.data[index];
                if (tile === 0) continue; // Skip empty tiles
                
                const sx = (tile - 1) % 8 * tileSize; // Calculate source x position
                const sy = Math.floor((tile - 1) / 8) * tileSize; // Calculate source y position
                
                this.p.image(
                    this.map.tileset,
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize,
                    sx,
                    sy,
                    tileSize,
                    tileSize
                );
            }
        }
    }

      drawNPCs() {
        this.npcs.forEach(npc => {
          const spriteSize = 32;
          this.p.image(
            this.npcSpriteSheet,
            npc.x - this.camera.x,
            npc.y - this.camera.y,
            spriteSize,
            spriteSize,
            npc.frame * spriteSize,
            0,
            spriteSize,
            spriteSize
          );
        });
      }
  
      checkCollision() {
        const tileX = Math.floor(this.player.x / 32);
        const tileY = Math.floor(this.player.y / 32);
        const mapWidth = this.mapData.layers[0].width;
        
        return this.collisionLayer[tileX + tileY * mapWidth] === 1;
      }
  
      checkInteractions() {
        if (this.p.keyIsDown(32)) { // Space bar
          const interactDir = {
            up: { x: 0, y: -32 },
            down: { x: 0, y: 32 },
            left: { x: -32, y: 0 },
            right: { x: 32, y: 0 }
          }[this.player.direction];
  
          const checkPos = {
            x: this.player.x + interactDir.x,
            y: this.player.y + interactDir.y
          };
  
          const npc = this.npcs.find(npc => 
            Math.abs(npc.x - checkPos.x) <  32 && 
            Math.abs(npc.y - checkPos.y) < 32
          );
  
          if (npc) {
            this.inDialog = true;
            this.showDialog(npc.dialog);
          }
        }
      }
  
      showDialog(text) {
        const dialogueBox = document.getElementById("dialogue-box");
        dialogueBox.querySelector("p").textContent = text;
        dialogueBox.classList.remove("hidden");
      }
  
      startBattle() {
        this.sounds.battle.play();
        this.fadeToBlack(() => {
          localStorage.setItem("playerData", JSON.stringify(this.player));
          window.location.href = "battle.html";
        });
      }
  
      fadeToBlack(callback) {
        const transition = document.getElementById("transition-screen");
        transition.style.opacity = 0;
  
        let opacity = 0;
        const animate = () => {
          opacity += 0.05;
          transition.style.opacity = opacity;
          if (opacity < 1) requestAnimationFrame(animate);
          else callback();
        };
        animate();
      }
  
      drawHUD() {
        fill(0);
        rect(10, 10, 200, 20);
        fill("#FF0000");
        rect(
          10,
          10,
          (this.player.pokemon[0].hp / this.player.pokemon[0].maxHp) * 200,
          20
        );
  
        if (this.p.keyIsPressed && (this.p.key === 'i' || this.p.key === 'I')) {
          this.player.inventory.toggle();
        }
      }
  
      updateCamera() {
        this.camera.x = this.player.x - this.p.width / 2;
        this.camera.y = this.player.y - this.p.height / 2;
      }
  
      handleMovement() {
        let moved = false;
        const speed = 3;
  
        if (this.p.keyIsDown(this.p.LEFT_ARROW)) {
          this.player.x -= speed;
          this.player.direction = "left";
          moved = true;
        }
        if (this.p.keyIsDown(this.p.RIGHT_ARROW)) {
          this.player.x += speed;
          this.player.direction = "right";
          moved = true;
        }
        if (this.p.keyIsDown(this.p.UP_ARROW)) {
          this.player.y -= speed;
          this.player.direction = "up";
          moved = true;
        }
        if (this.p.keyIsDown(this.p.DOWN_ARROW)) {
          this.player.y += speed;
          this.player.direction = "down";
          moved = true;
        }
  
        if (moved) {
          if (millis() - this.lastStep > 300) {
            this.sounds.step.play();
            this.lastStep = millis();
          }
          if (this.checkCollision()) {
            if (this.p.keyIsDown(this.p.LEFT_ARROW)) this.player.x += speed;
            if (this.p.keyIsDown(this.p.RIGHT_ARROW)) this.player.x -= speed;
            if (this.p.keyIsDown(this.p.UP_ARROW)) this.player.y += speed;
            if (this.p.keyIsDown(this.p.DOWN_ARROW)) this.player.y -= speed;
          }
        }
      }
    }
  
    class NPC {
        constructor(data) {
          Object.assign(this, data);
          this.sprite = {
            x: data.x,
            y: data.y,
            frame: data.spriteFrame || 0, // Default to frame 0 if not specified
          };
        }
      
        draw(p) {
          const spriteSize = 32; // Adjust based on your sprite size
          const sx = this.frame * spriteSize; // Calculate the source x position based on the frame
          const sy = 0; // Assuming all NPCs are on the first row of the sprite sheet
      
          p.image(
            game.npcSpriteSheet,
            this.sprite.x - game.camera.x,
            this.sprite.y - game.camera.y,
            spriteSize,
            spriteSize,
            sx,
            sy,
            spriteSize,
            spriteSize
          );
        }
    }
  
    class Inventory {
      constructor() {
        this.items = {};
        this.open = false;
      }
  
      addItem(item, quantity = 1) {
        this.items[item] = (this.items[item] || 0) + quantity;
      }
  
      toggle() {
        this.open = !this.open;
        document.getElementById("inventory").style.display = this.open
          ? "block"
          : "none";
        if (this.open) this.updateDisplay();
      }
  
      updateDisplay() {
        const container = document.getElementById("inventory");
        container.innerHTML = "<h3>Inventory</h3>";
        Object.entries(this.items).forEach(([item, qty]) => {
          container.innerHTML += `<p>${item}: ${qty}</p>`;
        });
      }
    }
  
    const sketch = (p) => {
      let game;
  
      p.preload = () => {
        game = new Game(p);
        game.preload();
      };
  
      p.setup = () => {
        p.createCanvas(800, 600);
        game.setup();
      };
  
      p.draw = () => {
        game.draw();
      };
  
      p.keyPressed = () => {
        if (p.key === 'i' || p.key === 'I') {
          game.player.inventory.toggle();
        }
      };
    };
  
    document.getElementById("start-button").addEventListener("click", () => {
      new p5(sketch, 'game-container');
      document.getElementById("start-button").style.display = "none";
    });
  
    document.getElementById("close-dialogue").addEventListener("click", () => {
      document.getElementById("dialogue-box").classList.add("hidden");
      game.inDialog = false;
    });
  })();
