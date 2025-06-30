# 🧛 MOMsters! - a survivor-like bullet-heaven game

## 🎮 [▶️ **PLAY NOW**](https://sl4ppy.github.io/MOMsters/) ⚡

A browser-based roguelike survival game built with PixiJS and TypeScript, inspired by Vampire Survivors.

## 🎮 Game Overview

This is a 2D top-down survival game where the player character automatically fights waves of enemies while collecting experience, leveling up, and choosing powerful upgrades to survive as long as possible.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/vampire-survivors-clone.git
cd vampire-survivors-clone
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

## 🎯 Development Roadmap

### ✅ Phase 1: Project Setup & Foundation (Current)
- [x] Project structure and build system
- [x] PixiJS setup with TypeScript
- [x] Basic game loop and state management
- [x] Player character and movement system
- [x] Input handling (WASD/Arrow keys)
- [x] GitHub Actions deployment pipeline

### 🔄 Phase 2: Core Game Engine (Next)
- [ ] Camera system that follows the player
- [ ] Collision detection system
- [ ] Basic enemy spawning system
- [ ] Health and damage system
- [ ] Game boundaries and world limits

### 📋 Phase 3: Gameplay Mechanics
- [ ] **Enemy System**
  - [ ] Multiple enemy types with different behaviors
  - [ ] Enemy AI and pathfinding
  - [ ] Wave-based spawning system
  - [ ] Enemy health and damage
  
- [ ] **Weapon System**
  - [ ] Auto-attacking weapons
  - [ ] Projectile system
  - [ ] Different weapon types (whip, fireball, garlic, etc.)
  - [ ] Weapon evolution and combinations

- [ ] **Experience & Leveling**
  - [ ] Experience pickup from defeated enemies
  - [ ] Level-up system with upgrade choices
  - [ ] Character stats progression

### 📋 Phase 4: Advanced Features
- [ ] **Power-ups & Upgrades**
  - [ ] Upgrade selection screen
  - [ ] Passive abilities system
  - [ ] Item synergies and combinations
  - [ ] Temporary power-ups

- [ ] **UI/HUD System**
  - [ ] Health bar
  - [ ] Experience bar
  - [ ] Mini-map
  - [ ] Game timer
  - [ ] Upgrade selection interface

- [ ] **Audio System**
  - [ ] Background music
  - [ ] Sound effects for attacks, hits, pickups
  - [ ] Audio settings and controls

### 📋 Phase 5: Polish & Content
- [ ] **Visual Effects**
  - [ ] Particle systems for attacks and impacts
  - [ ] Screen shake and juice effects
  - [ ] Death animations and effects
  
- [ ] **Game Balance**
  - [ ] Difficulty scaling
  - [ ] Weapon balance and effectiveness
  - [ ] Enemy spawn rates and difficulty curves

- [ ] **Additional Content**
  - [ ] Multiple characters with unique abilities
  - [ ] Different stages/environments
  - [ ] Achievement system
  - [ ] High score tracking

## 🎮 Controls

- **Movement**: WASD or Arrow Keys
- **Weapons**: Automatic (no input required)
- **Upgrades**: Mouse click to select (when available)

## 🏗️ Architecture

### Core Systems
- **Game**: Main game loop and state management
- **InputManager**: Handles keyboard and mouse input
- **GameState**: Manages level, experience, score progression
- **Player**: Player character logic and rendering

### Planned Systems
- **EnemyManager**: Spawning and managing enemies
- **WeaponSystem**: Auto-attacking weapon logic  
- **CollisionManager**: Efficient collision detection
- **UIManager**: Game interface and menus
- **AudioManager**: Sound effects and music
- **UpgradeSystem**: Level-up choices and character progression

## 🛠️ Tech Stack

- **PixiJS 7.x**: 2D WebGL rendering engine
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and development server
- **GitHub Actions**: Automated deployment
- **GitHub Pages**: Free hosting for the game

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎖️ Credits

Inspired by [Vampire Survivors](https://store.steampowered.com/app/1794680/Vampire_Survivors/) by poncle. 