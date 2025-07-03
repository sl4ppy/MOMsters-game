import { Application } from 'pixi.js'
import { Game } from './core/Game'
import { testSharkManDisplay } from './test-shark-man'

// Create and initialize the game
async function init() {
  // Create the PixiJS application
  const app = new Application({
    width: 1024,
    height: 768,
    backgroundColor: 0x1a1a1a,
    antialias: true,
  })

  // Add the canvas to the DOM
  const gameContainer = document.getElementById('gameContainer')
  if (gameContainer) {
    const canvas = app.view as HTMLCanvasElement
    gameContainer.appendChild(canvas)
    
    // Make canvas focusable and focus it for keyboard events
    canvas.tabIndex = 0
    canvas.focus()
    
    // Ensure canvas stays focused when clicked
    canvas.addEventListener('click', () => canvas.focus())
  }

  // Create and start the game
  const game = new Game(app)
  await game.init()
  game.start()
  
  // Hide the loading text once the game is initialized and title screen is ready
  const loadingText = document.getElementById('loadingText')
  if (loadingText) {
    loadingText.style.display = 'none'
    console.log('Loading text hidden - game ready!')
  }
}

// Start the game when the page loads
init().catch(console.error) 