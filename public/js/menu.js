export default class extends Phaser.Scene {
  constructor(){
    super("menu")
  }

  preload(){
    this.load.setPath("../images/").image("menu-background")
  }

  create(){
    this.add.image(400, 300, "menu-background")
    this.nameInput = document.createElement("input")
    this.nameInput.setAttribute("type", "text")
    this.nameInput.setAttribute("class", "form-control")
    this.nameInput.setAttribute("placeholder", "Name")

    const startButton = document.createElement("button")
    startButton.setAttribute("type", "button")
    startButton.setAttribute("class", "btn btn-primary")
    startButton.innerText = "Start"
    startButton.addEventListener("click", () => {
      const name = this.nameInput.value
      this.scene.start("game", name ? name.substring(0, 13) : "anonymous")
      document.body.removeChild(this.form)
    })

    const buttonDiv = document.createElement("div")
    buttonDiv.setAttribute("class", "input-group-append")
    buttonDiv.appendChild(startButton)

    this.form = document.createElement("div")
    this.form.setAttribute("class", "input-group m-auto")
    this.form.setAttribute("style", "width: 400px; position: relative; bottom: 250px")
    this.form.appendChild(this.nameInput)
    this.form.appendChild(buttonDiv)

    document.body.appendChild(this.form)
  }
}