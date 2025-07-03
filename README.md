# 🧛 MOMsters! - a survivor-like bullet-heaven game

## 🎮 [▶️ **PLAY NOW**](https://sl4ppy.github.io/MOMsters-game/) ⚡

A browser-based roguelike survival game built with PixiJS and TypeScript, inspired by Vampire Survivors.

**✨ Now with 30 unique enemies, animated projectiles, and a Godzilla player character!**

---

## 🆕 Major Features (2024)
- **30 unique enemy types** (see full list below), phased in one at a time every 40-60 seconds
- **Animated fireball projectile** as the main attack
- **2 XP gem types**: 1XP (green), 10XP (orange)
- **Progressive enemy spawning**: Only one enemy type spawns at a time, advancing every 40-60s
- **Godzilla player character** (default, no fallback)
- **Upgrade system**: Health, speed, magnet range, attack interval, piercing, and more
- **New terrain and decoration systems** for richer environments

---

## 👾 Enemy Roster (All 30 Types)
Blob, Goblin, Plant, Hobgoblin, Mermaid, Gargoyle, ChompChest, TreeEnt, Reaper, Palomino,
Green Dragon, Red Dragon, Blue Dragon, Skeleton, Mollusk, Banshee, Floating Maw, Cacodemon, Sea Hag, Demon,
Centaur, Green Orc, Golden Orc, Void, Golem, Ice Golem, Jawa, Mud Golem, Skull, PlasmaMan

---

## 🛡️ Player Abilities & Upgrades
- **Auto-fire**: Animated fireball projectiles
- **Upgrades** (choose on level up):
  - Max Health
  - Health Regeneration
  - Move Speed
  - Magnet Range (XP pickup distance)
  - Attack Interval (fire rate)
  - Projectile Piercing
  - (More coming soon!)

---

## 🟢 XP Gems
- **Green Gem**: 1 XP
- **Orange Gem**: 10 XP
- Gems are attracted to the player when in magnet range

---

## 🌎 Terrain & Decoration
- Multiple terrain tile atlases
- Randomly placed decorative elements for visual variety

---

## 🎯 Completed Features
- [x] **Core Game Engine** (PixiJS, TypeScript, camera, collision, etc)
- [x] **30 unique enemy types** with progressive spawning
- [x] **Animated fireball projectile** system
- [x] **Godzilla player character** (default, no fallback)
- [x] **Experience & Leveling** (XP gems, upgrades)
- [x] **Upgrade system** (health, speed, magnet, attack interval, piercing, etc)
- [x] **Terrain & Decoration** (multiple atlases, random placement)
- [x] **UI/HUD** (health, XP, timer, upgrades, screens)
- [x] **Comprehensive test harness & CI/CD**

---

## 🔄 Current Development
- [ ] Visual effects (particles, screen shake, death anims)
- [ ] Audio system (music, SFX)
- [ ] More upgrades and abilities
- [ ] Advanced enemy behaviors

---

## 🎮 Controls
- **Movement**: WASD or Arrow Keys
- **Game Start**: SPACE or ENTER (on title screen)
- **Upgrades**: 1, 2, 3 keys (during level up)
- **Restart**: R key (on game over screen)

---

## 📝 For full details, see the rest of this README and the [test documentation](tests/README.md).

## 🎮 Game Overview

This is a 2D top-down survival game where the player character automatically fights waves of enemies while collecting experience, leveling up, and choosing powerful upgrades to survive as long as possible.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sl4ppy/MOMsters-game.git
cd MOMsters-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3001`

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## 🧪 Testing & Quality Assurance

This project includes a comprehensive test harness that validates the build process, deployment, and live game functionality to ensure reliable deployments and prevent caching issues.

### Quick Testing

```bash
# Run all tests (recommended before deploying)
npm run test:all

# Quick validation (build only - fastest)
npm run test --quick

# Individual test suites
npm run test:build        # Validate build process (~30-60s)
npm run test:deployment   # Test GitHub Pages deployment (~2-5min)
npm run test:integration  # Test live game functionality (~1-3min)
```

### Test Suites

#### 1. 🏗️ Build Validation
- ✅ Build process completion
- ✅ Distribution folder structure
- ✅ HTML content validation (title, cache-busting headers)
- ✅ Asset path correctness (`/MOMsters/assets/...`)
- ✅ JavaScript file validity and size
- ✅ Cache-busting implementation
- ✅ Configuration consistency

#### 2. 🚀 Deployment Validation
- ✅ GitHub Pages deployment process
- ✅ Site propagation and availability
- ✅ Live HTML content validation
- ✅ Asset accessibility (no 404 errors)
- ✅ HTTP headers validation
- ✅ Old cached asset cleanup

#### 3. 🎮 Integration Testing
- ✅ Game page loading and PIXI.js initialization
- ✅ Canvas creation and rendering
- ✅ Title screen interaction
- ✅ Keyboard input testing (WASD, arrows, numbers)
- ✅ Performance metrics validation
- ✅ Responsive design testing

### Continuous Integration

The project uses GitHub Actions to automatically:
- **On Pull Requests**: Run build validation
- **On Master Push**: Run full test suite including deployment
- **Provide Results**: Clear pass/fail status with detailed reports

### Test Options

```bash
# Show all test options
npm run test --help

# Run specific tests
npm run test --build-only
npm run test --deployment-only
npm run test --integration-only

# Skip specific tests
npm run test --skip-integration
npm run test --skip-deployment
```

See [`tests/README.md`](tests/README.md) for comprehensive testing documentation.

## 🎯 Development Status

### ✅ Completed Features
- [x] **Core Game Engine**
  - [x] PixiJS setup with TypeScript
  - [x] Game loop and state management
  - [x] Player character and movement system
  - [x] Input handling (WASD/Arrow keys)
  - [x] Camera system that follows the player
  - [x] Collision detection system

- [x] **Enemy System**
  - [x] Basic enemy spawning system
  - [x] Multiple enemy types with different behaviors
  - [x] Enemy AI and pathfinding
  - [x] Enemy health and damage

- [x] **Weapon System**
  - [x] Auto-attacking weapons
  - [x] Projectile system
  - [x] Different weapon types
  - [x] Weapon effectiveness

- [x] **Experience & Leveling**
  - [x] Experience pickup from defeated enemies
  - [x] Level-up system with upgrade choices
  - [x] Character stats progression

- [x] **UI/HUD System**
  - [x] Health bar and experience bar
  - [x] Game timer and score display
  - [x] Upgrade selection interface
  - [x] Title screen and game over screen

- [x] **Quality Assurance**
  - [x] Comprehensive test harness
  - [x] Automated deployment validation
  - [x] Browser-based integration testing
  - [x] CI/CD pipeline with GitHub Actions

### 🔄 Current Development
- [ ] **Visual Effects**
  - [ ] Enhanced particle systems
  - [ ] Screen shake and juice effects
  - [ ] Improved death animations

- [ ] **Audio System**
  - [ ] Background music
  - [ ] Sound effects for all actions
  - [ ] Audio settings and controls

### 📋 Future Enhancements
- [ ] **Advanced Features**
  - [ ] Multiple characters with unique abilities
  - [ ] Different stages/environments
  - [ ] Achievement system
  - [ ] Local high score tracking

- [ ] **Game Balance**
  - [ ] Advanced difficulty scaling
  - [ ] Weapon evolution and combinations
  - [ ] Enemy variety and behaviors

## 🎮 Controls

- **Movement**: WASD or Arrow Keys
- **Game Start**: SPACE or ENTER (on title screen)
- **Upgrades**: 1, 2, 3 keys (during level up)
- **Restart**: R key (on game over screen)

## 🏗️ Architecture

### Core Systems
- **Game**: Main game loop and state management
- **InputManager**: Handles keyboard and mouse input
- **GameState**: Manages level, experience, score progression
- **Player**: Player character logic and rendering
- **Camera**: Follows player and manages viewport
- **CollisionManager**: Efficient collision detection

### Game Systems
- **EnemySpawner**: Manages enemy spawning and waves
- **WeaponSystem**: Auto-attacking weapon logic  
- **LevelingSystem**: Experience and upgrade management
- **ExperienceOrb**: Collectible experience items

### UI Components
- **TitleScreen**: Game start interface
- **HUD**: In-game health, experience, timer display
- **LevelUpScreen**: Upgrade selection interface
- **GameOverScreen**: End game results and restart

### Quality Assurance
- **Test Harness**: Comprehensive testing framework
  - **Build Validation**: Ensures proper build output
  - **Deployment Testing**: Validates GitHub Pages deployment
  - **Integration Testing**: Browser automation with Puppeteer
  - **CI/CD Pipeline**: Automated testing and deployment

## 🛠️ Tech Stack

- **PixiJS 7.x**: 2D WebGL rendering engine
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **GitHub Actions**: Automated deployment and testing
- **GitHub Pages**: Free hosting for the game

### Testing Stack
- **Puppeteer**: Browser automation for integration testing
- **Node.js**: Test runner and build validation
- **Chalk**: Colored console output for test results
- **Node-Fetch**: HTTP requests for deployment validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests to ensure everything works (`npm run test:all`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request (tests will run automatically)

### Development Workflow
- **Before committing**: Run `npm run test --quick` for fast validation
- **Before deploying**: Run `npm run test:all` for comprehensive testing
- **After major changes**: Check integration tests pass

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎖️ Credits

Inspired by [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/) by poncle.

## 🔗 Links

- **🎮 Play the Game**: [https://sl4ppy.github.io/MOMsters/](https://sl4ppy.github.io/MOMsters/)
- **📚 Test Documentation**: [tests/README.md](tests/README.md)
- **🔧 GitHub Repository**: [https://github.com/sl4ppy/MOMsters](https://github.com/sl4ppy/MOMsters)
- **🚀 GitHub Actions**: Automated testing and deployment
- **📊 Build Status**: Check the latest build status in the Actions tab 