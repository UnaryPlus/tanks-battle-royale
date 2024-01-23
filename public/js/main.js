import Menu from "./menu.js"
import Game from "./game.js"

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-div",
  width: 800,
  height: 600,
  backgroundColor: 0xffffff,
  physics: {
    default: "matter",
    matter: {
      gravity: {
        x: 0,
        y: 0
      }
    }
  },
  scene: [ Menu, Game ]
})