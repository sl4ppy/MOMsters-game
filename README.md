# 🧛 MOMsters! - a survivor-like bullet-heaven game

## 🎮 [▶️ **PLAY NOW**](https://sl4ppy.github.io/MOMsters-game/) ⚡

A browser-based roguelike survival game built with PixiJS and TypeScript, inspired by Vampire Survivors.

**✨ Now with 30 unique enemies, wave-based spawning system, and a Giant Chicken King boss!**

---

## 🆕 Major Features
- **Wave-Based Survival Mode**: 15.5-minute campaign with 21 distinct waves
- **30 unique enemy types** with strategic wave progression
- **Special Wave Events**: Circle Formation, Boss Events, Swarm Attacks, Final Assault
- **Overlapping Waves**: 30-second overlaps create dynamic multi-enemy encounters
- **Giant Chicken King Boss**: Epic final boss with custom sprite at 3x scale
- **Enhanced HUD**: Real-time wave information, progress tracking, and event notifications
- **Custom Sprite System**: Support for special enemy sprites beyond the main atlas
- **Animated fireball projectile** as the main attack
- **2 XP gem types**: 1XP (green), 10XP (orange)
- **Godzilla player character** (default, no fallback)
- **Upgrade system**: Health, speed, magnet range, attack interval, piercing, and more
- **New terrain and decoration systems** for richer environments

---

## 🌊 Wave System Overview

### 📅 **15.5-Minute Survival Campaign**
- **21 Progressive Waves** (0-15.5 minutes)
- **Overlapping Design**: Each wave starts 30 seconds before the previous ends
- **Dynamic Difficulty**: Spawn rates increase from 50/s to 275/s
- **Strategic Progression**: Enemy types introduced at optimal challenge points

### 🎭 **Special Wave Events**
- **Circle Formation**: Enemies spawn in circles around the player
- **Boss Events**: Single powerful enemies (Green Dragon, Void, Skull King)
- **Swarm Attacks**: Burst spawning of multiple enemies
- **Final Assault**: Multi-point spawning with maximum intensity

### 🐔 **Epic Boss Battles**
- **Wave 7** (4.5-5.25 min): Green Dragon Boss
- **Wave 14** (9.5-10.25 min): Void Boss  
- **Wave 21** (14.5-15.5 min): **Giant Chicken King** (Final Boss)

---

## 👾 Enemy Roster (All 30 Types)
**Early Game (Waves 1-6):**
Blob, Goblin, Plant, Hobgoblin, Mermaid, Gargoyle, ChompChest, TreeEnt, Reaper, Palomino

**Mid Game (Waves 7-14):**
Green Dragon, Red Dragon, Blue Dragon, Skeleton, Mollusk, Banshee, Floating Maw, Cacodemon, Sea Hag, Demon

**Late Game (Waves 15-21):**
Centaur, Green Orc, Golden Orc, Void, Golem, Ice Golem, Jawa, Mud Golem, Skull, PlasmaMan

**Final Boss:**
**🐔 Giant Chicken King** - 500 HP, 50 Damage, 3x Scale, 100 XP Reward

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
- [x] **Wave-Based Spawning System** (21 waves, 15.5-minute campaign)
- [x] **Special Wave Events** (Circle Formation, Boss Events, Swarm Attacks, Final Assault)
- [x] **Overlapping Wave Design** (30-second overlaps for dynamic gameplay)
- [x] **30 unique enemy types** with strategic wave progression
- [x] **Custom Sprite System** (special enemies can use individual sprites)
- [x] **Giant Chicken King Boss** (final boss with custom sprite and 3x scale)
- [x] **Enhanced HUD** (wave info, progress tracking, event notifications)
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

### 🌊 Wave System Details

The game features a sophisticated wave-based spawning system that creates a 15.5-minute survival campaign:

#### **Wave Progression Examples:**
- **Wave 1** (0-1 min): Blob enemies only - 50/s spawn rate
- **Wave 2** (0.5-2 min): Goblins & Plants join - 60/s spawn rate  
- **Wave 4** (2-3 min): Mermaid & Gargoyle Circle Formation - 90/s spawn rate
- **Wave 7** (4.5-5.25 min): Green Dragon Boss Event - 5/s spawn rate
- **Wave 21** (14.5-15.5 min): Giant Chicken King Final Boss - 5/s spawn rate

#### **Special Event Mechanics:**
- **Circle Formation**: Enemies spawn in a circle around the player
- **Boss Events**: Single powerful enemy spawns at distance from player
- **Swarm Events**: Burst spawning of 5 enemies every 2 seconds
- **Final Assault**: Multiple spawn points with maximum intensity

#### **Overlapping Wave Design:**
Each wave starts 30 seconds before the previous wave ends, creating dynamic encounters where multiple enemy types are active simultaneously. This design prevents predictable enemy switching and creates more strategic gameplay.

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