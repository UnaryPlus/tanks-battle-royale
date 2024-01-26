export default class extends Phaser.Scene {
  constructor(){
    super("game")
  }
  
  preload(){
    // Load images
    this.load.setPath("../images/")
    .image("game-background")
    .image("crate")
    .image("blue-tank")
    .image("red-tank")
    .image("bullet")
  }

  create(name){
    // Set world and camera bounds and add background
    this.matter.world.setBounds(0, 0, 1600, 1600)
    this.cameras.main.setBounds(0, 0, 1600, 1600)
    .setViewport(0, 0, 600, 600)
    this.add.image(800, 800, "game-background")

    // Create leaderboard camera and title
    this.cameras.add(600, 0, 200, 600)
    .setScroll(-200, 0)
    this.add.text(-100, 30, "Scores")
    .setOrigin(0.5, 0.5)
    .setFontFamily("Helvetica")
    .setFontSize(36)
    .setColor("#000000")
   
    // Connect to server
    this.socket = io()
    this.players = {}
    this.cursors = this.input.keyboard.createCursorKeys()

    // Shoot if space is down with gap of 750 seconds
    let canShoot = true
    this.input.keyboard.addKey("space").on("down", () => {
      if(canShoot){
        this.socket.emit("shoot")
        canShoot = false
        this.time.addEvent({
          delay: 750,
          callback: () => { canShoot = true }
        })
      }
    })

    // Add crates and players and listen for messages
    this.addCrates()
    this.addPlayer(name)
    this.socket.on("update", (data) => this.updatePlayer(data))
    this.socket.on("shoot", (id) => this.addBullet(id))
    this.socket.on("disconnection", (id) => this.removePlayer(id))
  }

  addCrates(){
    // Map of crate positions
    const map = [
      "XXXXXXXXXXXXXXXXXXXX",
      "X------------------X",
      "X------------------X",
      "X---X----XX----X---X",
      "X--XX----------XX--X",
      "X------------------X",
      "X------------------X",
      "X---X---XXXX---X---X",
      "X---X----------X---X",
      "X---X----------X---X",
      "X---X----------X---X",
      "X---X----------X---X",
      "X---X---XXXX---X---X",
      "X------------------X",
      "X------------------X",
      "X--XX----------XX--X",
      "X---X----XX----X---X",
      "X------------------X",
      "X------------------X",
      "XXXXXXXXXXXXXXXXXXXX"
    ]

    // Loop through each character in map and add crate if it is "X"
    for(let row = 0; row < 20; row++){
      for(let col = 0; col < 20; col++){
        const char = map[row][col]
        const x = col * 80 + 40
        const y = row * 80 + 40
        if(char === "X"){
          this.matter.add.image(x, y, "crate")
          .setStatic(true)
        }
      }
    }
  }

  addPlayer(name){
    // Generate random coordinates for player
    const x = this.xCoordinate()
    const y = this.yCoordinate()

    // Create player and change shape of body
    this.player = this.matter.add.image(x, y, "blue-tank")
    .setBody({x, y}, {
      vertices: [
        {x: -30, y: -30},
        {x: 30, y: -30},
        {x: 30, y: -5},
        {x: 45, y: -5},
        {x: 45, y: 5},
        {x: 30, y: 5},
        {x: 30, y: 30},
        {x: -30, y: 30}
      ]
    })
    .setAngle(Math.random() * 360)
    
    // Text above player showing name
    this.player.nameText = this.add.text(x, y - 50, name)
    .setOrigin(0.5, 0.5)
    .setFontFamily("Helvetica")
    .setColor("#000000")

    // Leaderboard text showing name and score
    this.player.scoreText = this.add.text(-100, 75, name + " - 0")
    .setOrigin(0.5, 0.5)
    .setFontFamily("Helvetica")
    .setColor("#000000")

    this.player.name = name
    this.player.score = 0
    this.cameras.main.startFollow(this.player, 0.5)
  }

  updatePlayer(data){
    const {x, y, angle, name, score, id} = data

    // If player already exists, update position
    if(id in this.players){
      this.players[id].setPosition(x, y)
      .setAngle(angle)

      this.players[id].nameText.setPosition(x, y - 50)
      this.players[id].scoreText.setText(name + " - " + score)
    }

    // Otherwise, create new player
    else {
      this.players[id] = this.matter.add.image(x, y, "red-tank")
      .setBody({x, y}, {
        vertices: [
          {x: -30, y: -30},
          {x: 30, y: -30},
          {x: 30, y: -5},
          {x: 45, y: -5},
          {x: 45, y: 5},
          {x: 30, y: 5},
          {x: 30, y: 30},
          {x: -30, y: 30}
        ]
      })
      .setAngle(angle)

      this.players[id].nameText = this.add.text(x, y - 50, name)
      .setOrigin(0.5, 0.5)
      .setFontFamily("Helvetica")
      .setColor("#000000")

      this.players[id].scoreText = this.add.text(-100, 75, name + " - " + data.score)
      .setOrigin(0.5, 0.5)
      .setFontFamily("Helvetica")
      .setColor("#000000")
    }
  }

  addBullet(id){
    // Calculate bullet velocity based on angle of player
    const player = id === this.socket.id ? this.player : this.players[id]
    const offset = this.vectorFromAngle(player.angle, 50)
    const velocity = this.vectorFromAngle(player.angle, 6)

    // Create bullet and change body to a circle
    const bullet = this.matter.add.image(player.x + offset.x, player.y + offset.y, "bullet")
    .setCircle(5)
    .setVelocity(velocity.x, velocity.y)
    .setBounce(1)
    .setFrictionAir(0)

    // Destroy bullet after 1.5 seconds
    this.time.addEvent({
      delay: 1500,
      callback: () => {
        bullet.destroy()
      }
    })

    // If bullet collides with player, destroy it and reset coordinates
    bullet.setOnCollideWith(this.player, () => {
      bullet.destroy()
      
      if(id !== this.socket.id){
        this.player.setPosition(this.xCoordinate(), this.yCoordinate())
        .setAngle(Math.random() * 360)
      }
    })

    // If it collides with another player, destroy it and increment score
    bullet.setOnCollideWith(Object.values(this.players), () => {
      bullet.destroy()

      if(id === this.socket.id){
        this.player.score += 1
        this.player.scoreText.setText(this.player.name + " - " + this.player.score)
      }
    })
  }

  removePlayer(id){
    // Destroy player and associated text
    this.players[id].destroy()
    this.players[id].nameText.destroy()
    this.players[id].scoreText.destroy()
    delete this.players[id]
  }

  update(){
    // Move player with arrow keys
    const velocity = this.vectorFromAngle(this.player.angle, this.cursors.up.isDown ? 2.4 : this.cursors.down.isDown ? -2.4 : 0)
    this.player.setVelocity(velocity.x, velocity.y)
    .setAngularVelocity(this.cursors.left.isDown ? -0.04 : this.cursors.right.isDown ? 0.04 : 0)

    // Make sure text is in the right place
    this.player.nameText.setPosition(this.player.x, this.player.y - 50)

    // Send update message to server
    this.socket.emit("update", {
      x: this.player.x,
      y: this.player.y,
      angle: this.player.angle,
      name: this.player.name,
      score: this.player.score
    })

    // Update position of leaderboard text so that it is evenly spaced
    let y = 105
    for(let id in this.players){
      this.players[id].scoreText.setPosition(-100, y)
      y += 30
    }
  }

  vectorFromAngle(angle, magnitude){
    // Calculate x and y from angle and magnitude
    angle = Phaser.Math.DegToRad(angle)
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    }
  }

  xCoordinate(){
    // Calculate random x coordinate
    const r = Math.random()
    if(r < 1/11) return Phaser.Math.Between(120, 200)
    else if(r < 10/11) return Phaser.Math.Between(440, 1160)
    else return Phaser.Math.Between(1400, 1480)
  }

  yCoordinate(){
    // When used with xCoordinate(), generates coordinates guaranteed not to be on top of a crate
    const r = Math.random()
    if(r < 1/9) return Phaser.Math.Between(120, 200)
    else if(r < 3/9) return Phaser.Math.Between(360, 520)
    else if(r < 6/9) return Phaser.Math.Between(680, 920)
    else if(r < 8/9) return Phaser.Math.Between(1080, 1240)
    else return Phaser.Math.Between(1400, 1480)
  }
}