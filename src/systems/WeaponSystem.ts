import { Container } from 'pixi.js'
import { CollisionManager, CollisionGroup } from '../core/CollisionManager'
import { Enemy } from '../entities/Enemy'
import { Projectile } from '../entities/Projectile'
import { Beam } from '../entities/Beam'
import { WaveSpawner } from './WaveSpawner'

// Simple interface for player objects that have a position
interface PlayerLike {
  position: { x: number, y: number }
}

// Weapon types for kaiju defending against smaller monsters
export enum WeaponType {
  FIREBALL = 'fireball',           // Single target projectile
  LIGHTNING = 'lightning',         // Chain lightning
  WHIP = 'whip',                   // Melee area attack
  AXE = 'axe',                     // Thrown weapon that returns
  KNIFE = 'knife',                 // Multiple projectiles in all directions
  MAGIC_WAND = 'magic_wand',       // Rapid fire single target
  BIBLE = 'bible',                 // Rotating tail attacks around kaiju
  GARLIC = 'garlic',               // Heat wave aura from kaiju body
  HOLY_WATER = 'holy_water',       // Acid spit that creates pools
  RUNE_TRACER = 'rune_tracer',     // Eye beam laser projectiles
  EYE_BEAM = 'eye_beam'            // Continuous beam weapon
}

export interface WeaponConfig {
  type: WeaponType
  name: string
  description: string
  icon: string
  baseDamage: number
  baseAttackSpeed: number
  baseRange: number
  basePierce: number
  projectileSpeed: number
  maxLevel: number
  currentLevel: number
  effects: {
    damageMultiplier?: number
    fireRateMultiplier?: number
    rangeBonus?: number
    pierceBonus?: number
    projectileCount?: number
    areaRadius?: number
    chainCount?: number
  }
}

export class WeaponSystem {
  private projectiles: Projectile[] = []
  private beams: Beam[] = []
  private gameContainer: Container
  private collisionManager: CollisionManager
  private player: PlayerLike
  private enemySpawner: WaveSpawner
  
  // Track recent beam hits to prevent multiple hits per second
  private recentBeamHits: Map<any, number> = new Map()
  
  // Multiple weapons system
  private weapons: Map<WeaponType, WeaponConfig> = new Map()
  private activeWeapons: WeaponType[] = [WeaponType.FIREBALL] // Start with fireball
  private weaponTimers: Map<WeaponType, number> = new Map()
  
  // Legacy weapon settings (for backward compatibility)
  private attackInterval: number = 1.0
  private timeSinceLastShot: number = 0
  private range: number = 300
  private projectileSpeed: number = 400
  private projectileDamage: number = 25
  private pierceBonus: number = 0
  
  // Stats
  private totalShotsFired: number = 0
  private totalHits: number = 0

  constructor(gameContainer: Container, collisionManager: CollisionManager, player: PlayerLike, enemySpawner: WaveSpawner) {
    this.gameContainer = gameContainer
    this.collisionManager = collisionManager
    this.player = player
    this.enemySpawner = enemySpawner
    this.initializeWeapons()
  }

  private initializeWeapons(): void {
    // Initialize all weapon configurations
    const weaponConfigs: WeaponConfig[] = [
      {
        type: WeaponType.FIREBALL,
        name: 'Fireball',
        description: 'Single target projectile',
        icon: '🔥',
        baseDamage: 25,
        baseAttackSpeed: 1.0,
        baseRange: 300,
        basePierce: 0,
        projectileSpeed: 400,
        maxLevel: 8,
        currentLevel: 1,
        effects: { damageMultiplier: 1.25 }
      },

      {
        type: WeaponType.AXE,
        name: 'Axe',
        description: 'Thrown weapon that returns',
        icon: '🪓',
        baseDamage: 30,
        baseAttackSpeed: 1.2,
        baseRange: 200,
        basePierce: 1,
        projectileSpeed: 350,
        maxLevel: 6,
        currentLevel: 0,
        effects: { damageMultiplier: 1.25, pierceBonus: 1 }
      },
      {
        type: WeaponType.KNIFE,
        name: 'Knife',
        description: 'Multiple projectiles in all directions',
        icon: '🗡️',
        baseDamage: 15,
        baseAttackSpeed: 1.8,
        baseRange: 250,
        basePierce: 0,
        projectileSpeed: 450,
        maxLevel: 7,
        currentLevel: 0,
        effects: { projectileCount: 4, damageMultiplier: 1.15 }
      },




      {
        type: WeaponType.RUNE_TRACER,
        name: 'Eye Beam',
        description: 'Laser-like projectiles from kaiju eyes',
        icon: '🎯',
        baseDamage: 20,
        baseAttackSpeed: 1.3,
        baseRange: 350,
        basePierce: 0,
        projectileSpeed: 380,
        maxLevel: 7,
        currentLevel: 0,
        effects: { damageMultiplier: 1.2, rangeBonus: 50 }
      },
      {
        type: WeaponType.EYE_BEAM,
        name: 'Eye Beam',
        description: 'Continuous beam weapon',
        icon: '👁️',
        baseDamage: 10,
        baseAttackSpeed: 1.3,
        baseRange: 350,
        basePierce: 0,
        projectileSpeed: 380,
        maxLevel: 7,
        currentLevel: 0,
        effects: { damageMultiplier: 1.2, rangeBonus: 50 }
      }
    ]

    // Store weapons in map
    weaponConfigs.forEach(weapon => {
      this.weapons.set(weapon.type, weapon)
      this.weaponTimers.set(weapon.type, 0)
    })
  }

  /**
   * Update weapon system - handle auto-firing and projectile management
   */
  update(deltaTime: number): void {
    // Update all weapons
    this.updateAllWeapons(deltaTime)
    
    // Update all projectiles
    this.updateProjectiles(deltaTime)
    
    // Update all beams
    this.updateBeams(deltaTime)
    
    // Clean up inactive projectiles and beams
    this.cleanupInactiveProjectiles()
    this.cleanupInactiveBeams()
  }

  /**
   * Update all active weapons
   */
  private updateAllWeapons(deltaTime: number): void {
    for (const weaponType of this.activeWeapons) {
      const weapon = this.weapons.get(weaponType)
      if (!weapon) continue

      const timer = this.weaponTimers.get(weaponType) || 0
      const newTimer = timer + deltaTime / 60 // Convert to seconds
      this.weaponTimers.set(weaponType, newTimer)

      const attackInterval = this.getWeaponAttackInterval(weapon)
      if (newTimer >= attackInterval) {
        this.fireWeapon(weaponType)
        this.weaponTimers.set(weaponType, 0)
      }
    }
  }

  /**
   * Get attack interval for a weapon with upgrades applied
   */
  private getWeaponAttackInterval(weapon: WeaponConfig): number {
    const baseInterval = weapon.baseAttackSpeed
    const fireRateMultiplier = weapon.effects.fireRateMultiplier || 1.0
    return Math.max(0.1, baseInterval / fireRateMultiplier)
  }

  /**
   * Fire a specific weapon
   */
  private fireWeapon(weaponType: WeaponType): void {
    const weapon = this.weapons.get(weaponType)
    if (!weapon) {
      console.log(`⚠️ Weapon ${weaponType} not found`)
      return
    }
    
    // Check if weapon has been leveled up (unlocked weapons should be level 1+)
    if (weapon.currentLevel <= 0) {
      console.log(`⚠️ Weapon ${weaponType} not leveled up (level ${weapon.currentLevel})`)
      return
    }
    
    console.log(`🔫 Firing ${weaponType} (level ${weapon.currentLevel})`)

    switch (weaponType) {
      case WeaponType.FIREBALL:
        this.fireFireball(weapon)
        break
      case WeaponType.AXE:
        this.fireAxe(weapon)
        break
      case WeaponType.KNIFE:
        this.fireKnife(weapon)
        break
      case WeaponType.RUNE_TRACER:
        this.fireRuneTracer(weapon)
        break
      case WeaponType.EYE_BEAM:
        this.fireEyeBeam(weapon)
        break
      
      // DISABLED - Weapons without unique art assets
      case WeaponType.LIGHTNING:
      case WeaponType.WHIP:
      case WeaponType.MAGIC_WAND:
      case WeaponType.BIBLE:
      case WeaponType.GARLIC:
      case WeaponType.HOLY_WATER:
        console.log(`Weapon ${weaponType} is disabled (no art assets)`)
        break
    }
  }

  /**
   * Fireball - single target projectile
   */
  private fireFireball(weapon: WeaponConfig): void {
    const target = this.findNearestEnemy()
    if (!target) return

    const playerPos = this.player.position
    const targetPos = target.position
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)

    const projectile = new Projectile(
      playerPos.x, playerPos.y,
      targetPos.x, targetPos.y,
      weapon.projectileSpeed, damage, pierce, 'fireball'
    )

    this.setupProjectile(projectile)
  }

  /**
   * Lightning - chain lightning between enemies
   */
  private fireLightning(weapon: WeaponConfig): void {
    const enemies = this.enemySpawner.getEnemies()
    if (enemies.length === 0) return

    const playerPos = this.player.position
    const chainCount = weapon.effects.chainCount || 3
    const damage = this.getWeaponDamage(weapon)
    
    // Find nearest enemy to start chain
    let currentTarget = this.findNearestEnemy()
    if (!currentTarget) return

    const hitEnemies = new Set<Enemy>()
    let currentPos = playerPos

    for (let i = 0; i < chainCount && currentTarget; i++) {
      hitEnemies.add(currentTarget)
      
      // Create lightning projectile
      const projectile = new Projectile(
        currentPos.x, currentPos.y,
        currentTarget.position.x, currentTarget.position.y,
        weapon.projectileSpeed, damage, 0
      )

      this.setupProjectile(projectile)

      // Find next target (nearest enemy not hit yet)
      currentPos = currentTarget.position
      currentTarget = this.findNearestEnemyNotInSet(hitEnemies)
    }
  }

  /**
   * Whip - melee area attack
   */
  private fireWhip(weapon: WeaponConfig): void {
    const playerPos = this.player.position
    const areaRadius = weapon.effects.areaRadius || 80
    const damage = this.getWeaponDamage(weapon)

    // Find all enemies in area
    const enemies = this.enemySpawner.getEnemies()
    const enemiesInRange = enemies.filter(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - playerPos.x, 2) + 
        Math.pow(enemy.position.y - playerPos.y, 2)
      )
      return distance <= areaRadius
    })

    // Damage all enemies in range
    enemiesInRange.forEach(enemy => {
      if (enemy.takeDamage) {
        enemy.takeDamage(damage)
      }
    })

    // Create visual effect (could be enhanced with graphics)
    console.log(`Whip attack hit ${enemiesInRange.length} enemies`)
  }

  /**
   * Axe - thrown weapon that returns
   */
  private fireAxe(weapon: WeaponConfig): void {
    const target = this.findNearestEnemy()
    if (!target) return

    const playerPos = this.player.position
    const targetPos = target.position
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)

    const projectile = new Projectile(
      playerPos.x, playerPos.y,
      targetPos.x, targetPos.y,
      weapon.projectileSpeed, damage, pierce, 'axe'
    )

    this.setupProjectile(projectile)
  }

  /**
   * Knife - multiple projectiles in all directions
   */
  private fireKnife(weapon: WeaponConfig): void {
    const playerPos = this.player.position
    const projectileCount = weapon.effects.projectileCount || 4
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)

    for (let i = 0; i < projectileCount; i++) {
      const angle = (i / projectileCount) * 2 * Math.PI
      const targetX = playerPos.x + Math.cos(angle) * 100
      const targetY = playerPos.y + Math.sin(angle) * 100

      const projectile = new Projectile(
        playerPos.x, playerPos.y,
        targetX, targetY,
        weapon.projectileSpeed, damage, pierce, 'knife'
      )

      this.setupProjectile(projectile)
    }
  }

  /**
   * Magic Wand - rapid fire single target
   */
  private fireMagicWand(weapon: WeaponConfig): void {
    const target = this.findNearestEnemy()
    if (!target) return

    const playerPos = this.player.position
    const targetPos = target.position
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)

    const projectile = new Projectile(
      playerPos.x, playerPos.y,
      targetPos.x, targetPos.y,
      weapon.projectileSpeed, damage, pierce, 'fireball'
    )

    this.setupProjectile(projectile)
  }

  /**
   * Tail Sweep - rotating tail attacks around kaiju
   */
  private fireBible(weapon: WeaponConfig): void {
    const playerPos = this.player.position
    const projectileCount = weapon.effects.projectileCount || 3
    const areaRadius = weapon.effects.areaRadius || 100
    const damage = this.getWeaponDamage(weapon)

    // Create rotating tail attacks (simplified as projectiles for now)
    for (let i = 0; i < projectileCount; i++) {
      const angle = (i / projectileCount) * 2 * Math.PI
      const targetX = playerPos.x + Math.cos(angle) * areaRadius
      const targetY = playerPos.y + Math.sin(angle) * areaRadius

      const projectile = new Projectile(
        playerPos.x, playerPos.y,
        targetX, targetY,
        weapon.projectileSpeed, damage, 0, 'fireball'
      )

      this.setupProjectile(projectile)
    }
  }

  /**
   * Heat Wave - intense heat radiating from kaiju body
   */
  private fireGarlic(weapon: WeaponConfig): void {
    const playerPos = this.player.position
    const areaRadius = weapon.effects.areaRadius || 120
    const damage = this.getWeaponDamage(weapon)

    // Find all enemies in area
    const enemies = this.enemySpawner.getEnemies()
    const enemiesInRange = enemies.filter(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.position.x - playerPos.x, 2) + 
        Math.pow(enemy.position.y - playerPos.y, 2)
      )
      return distance <= areaRadius
    })

    // Damage all enemies in range
    enemiesInRange.forEach(enemy => {
      if (enemy.takeDamage) {
        enemy.takeDamage(damage)
      }
    })

    console.log(`Heat Wave hit ${enemiesInRange.length} enemies`)
  }

  /**
   * Acid Spit - caustic projectiles that create acid pools
   */
  private fireHolyWater(weapon: WeaponConfig): void {
    const target = this.findNearestEnemy()
    if (!target) return

    const playerPos = this.player.position
    const targetPos = target.position
    const damage = this.getWeaponDamage(weapon)
    const areaRadius = weapon.effects.areaRadius || 90

    // Create projectile that creates acid pool on impact
    const projectile = new Projectile(
      playerPos.x, playerPos.y,
      targetPos.x, targetPos.y,
      weapon.projectileSpeed, damage, 0, 'fireball'
    )

    // Override the hit callback to create acid pool damage
    projectile.onHitTarget = (hitTarget) => {
      this.handleProjectileHit(projectile, hitTarget)
      
      // Create acid pool damage effect
      const hitPos = projectile.position
      const enemies = this.enemySpawner.getEnemies()
      const enemiesInRange = enemies.filter(enemy => {
        const distance = Math.sqrt(
          Math.pow(enemy.position.x - hitPos.x, 2) + 
          Math.pow(enemy.position.y - hitPos.y, 2)
        )
        return distance <= areaRadius
      })

      enemiesInRange.forEach(enemy => {
        if (enemy.takeDamage) {
          enemy.takeDamage(damage * 0.5) // Reduced damage for area effect
        }
      })

      console.log(`Acid Spit pool hit ${enemiesInRange.length} enemies`)
    }

    this.setupProjectile(projectile)
  }

  /**
   * Eye Beam - laser-like projectiles from kaiju eyes
   */
  private fireRuneTracer(weapon: WeaponConfig): void {
    const target = this.findNearestEnemy()
    if (!target) return

    const playerPos = this.player.position
    const targetPos = target.position
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)

    const projectile = new Projectile(
      playerPos.x, playerPos.y,
      targetPos.x, targetPos.y,
      weapon.projectileSpeed, damage, pierce, 'rune_tracer'
    )

    this.setupProjectile(projectile)
  }

  /**
   * Eye Beam - rotating beam weapon
   */
  private fireEyeBeam(weapon: WeaponConfig): void {
    // Only allow one beam at a time
    if (this.beams.length > 0) return
    const playerPos = this.player.position
    const damage = this.getWeaponDamage(weapon)
    const pierce = this.getWeaponPierce(weapon)
    
    // Calculate range and rotation speed based on upgrade level
    // Level 1: 1x range and speed, Level 7: 3x range and speed
    const levelProgress = (weapon.currentLevel - 1) / (weapon.maxLevel - 1) // 0 to 1
    const rangeMultiplier = 1 + (levelProgress * 2) // 1x to 3x
    const rotationSpeedMultiplier = 1 + (levelProgress * 2) // 1x to 3x
    
    const baseRange = weapon.baseRange + (weapon.effects.rangeBonus || 0)
    const baseRotationSpeed = 30 // degrees per second at level 1
    
    const finalRange = Math.floor(baseRange * rangeMultiplier)
    const finalRotationSpeed = Math.floor(baseRotationSpeed * rotationSpeedMultiplier)
    
    // Convert degrees per second to rotation duration (seconds for full rotation)
    const rotationDuration = 360 / finalRotationSpeed

    const beam = new Beam(
      playerPos.x, playerPos.y,
      damage, pierce, finalRange, rotationDuration
    )

    this.setupBeam(beam)
  }

  private setupBeam(beam: Beam): void {
    // Add to game container
    this.gameContainer.addChild(beam.sprite)
    
    // Add to beams array
    this.beams.push(beam)
    
    // Don't add to collision manager - we'll handle collision manually for precise detection
    // this.collisionManager.addEntity(beam)
    
    // Set up callbacks
    beam.onHitTarget = (target: any) => {
      this.handleBeamHit(beam, target)
    }
    
    beam.onExpired = () => {
      this.handleBeamExpired(beam)
    }
    
    // Update stats
    this.totalShotsFired++
  }

  private handleBeamHit(beam: Beam, target: any): void {
    // Handle beam hitting a target
    if (target.collisionGroup === CollisionGroup.ENEMY) {
      const enemy = target as Enemy
      enemy.takeDamage(beam.projectileDamage)
      this.totalHits++
    }
  }

  private handleBeamExpired(beam: Beam): void {
    // Remove beam from arrays and cleanup
    const beamIndex = this.beams.indexOf(beam)
    if (beamIndex > -1) {
      this.beams.splice(beamIndex, 1)
    }
    
    // Beam was not added to collision manager, so no need to remove
    // this.collisionManager.removeEntity(beam)
    this.gameContainer.removeChild(beam.sprite)
    beam.destroy()
  }

  /**
   * Helper methods for weapon calculations
   */
  private getWeaponDamage(weapon: WeaponConfig): number {
    const baseDamage = weapon.baseDamage
    const damageMultiplier = weapon.effects.damageMultiplier || 1.0
    return Math.floor(baseDamage * Math.pow(damageMultiplier, weapon.currentLevel))
  }

  private getWeaponPierce(weapon: WeaponConfig): number {
    const basePierce = weapon.basePierce
    const pierceBonus = weapon.effects.pierceBonus || 0
    return basePierce + (pierceBonus * weapon.currentLevel)
  }

  private findNearestEnemyNotInSet(excludedEnemies: Set<Enemy>): Enemy | null {
    const enemies = this.enemySpawner.getEnemies()
    if (enemies.length === 0) return null
    
    let nearestEnemy: Enemy | null = null
    let nearestDistance = Infinity
    
    const playerPos = this.player.position
    
    for (const enemy of enemies) {
      if (excludedEnemies.has(enemy)) continue
      
      const enemyPos = enemy.position
      const distance = Math.sqrt(
        Math.pow(enemyPos.x - playerPos.x, 2) + 
        Math.pow(enemyPos.y - playerPos.y, 2)
      )
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    }
    
    return nearestEnemy
  }

  /**
   * Setup projectile with callbacks
   */
  private setupProjectile(projectile: Projectile): void {
    projectile.onHitTarget = (hitTarget) => {
      this.handleProjectileHit(projectile, hitTarget)
    }
    
    projectile.onExpired = () => {
      this.handleProjectileExpired(projectile)
    }
    
    this.gameContainer.addChild(projectile.sprite)
    projectile.sprite.zIndex = 75
    this.collisionManager.addEntity(projectile)
    this.projectiles.push(projectile)
    
    this.totalShotsFired++
  }

  /**
   * Add a new weapon to active weapons
   */
  addWeapon(weaponType: WeaponType): void {
    if (!this.activeWeapons.includes(weaponType)) {
      this.activeWeapons.push(weaponType)
      console.log(`Added weapon: ${weaponType}`)
    }
  }

  /**
   * Remove a weapon from active weapons
   */
  removeWeapon(weaponType: WeaponType): void {
    const index = this.activeWeapons.indexOf(weaponType)
    if (index > -1) {
      this.activeWeapons.splice(index, 1)
      console.log(`Removed weapon: ${weaponType}`)
    }
  }

  /**
   * Get all available weapons
   */
  getAvailableWeapons(): WeaponConfig[] {
    return Array.from(this.weapons.values())
  }

  /**
   * Get active weapons
   */
  getActiveWeapons(): WeaponType[] {
    return [...this.activeWeapons]
  }

  /**
   * Upgrade a specific weapon
   */
  upgradeWeapon(weaponType: WeaponType): void {
    const weapon = this.weapons.get(weaponType)
    if (weapon && weapon.currentLevel < weapon.maxLevel) {
      weapon.currentLevel++
      console.log(`Upgraded ${weapon.name} to level ${weapon.currentLevel}`)
    }
  }

  /**
   * Find the nearest enemy within range
   */
  private findNearestEnemy(): Enemy | null {
    const enemies = this.enemySpawner.getEnemies()
    if (enemies.length === 0) return null
    
    let nearestEnemy: Enemy | null = null
    let nearestDistance = Infinity
    
    const playerPos = this.player.position
    
    for (const enemy of enemies) {
      const enemyPos = enemy.position
      const distance = Math.sqrt(
        Math.pow(enemyPos.x - playerPos.x, 2) + 
        Math.pow(enemyPos.y - playerPos.y, 2)
      )
      
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    }
    
    return nearestEnemy
  }

  /**
   * Update all active projectiles
   */
  private updateProjectiles(deltaTime: number): void {
    for (const projectile of this.projectiles) {
      if (projectile.active) {
        projectile.update(deltaTime)
      }
    }
  }

  /**
   * Remove inactive projectiles from the game
   */
  private cleanupInactiveProjectiles(): void {
    const activeProjectiles: Projectile[] = []
    
    for (const projectile of this.projectiles) {
      if (projectile.active) {
        activeProjectiles.push(projectile)
      } else {
        // Remove from collision system
        this.collisionManager.removeEntity(projectile)
        
        // Remove from display after a short delay (for hit effect)
        setTimeout(() => {
          if (projectile.sprite.parent) {
            projectile.sprite.parent.removeChild(projectile.sprite)
          }
        }, 100)
      }
    }
    
    const removedCount = this.projectiles.length - activeProjectiles.length
    if (removedCount > 0) {
      // Only log cleanup of large batches
      if (removedCount >= 5) {
        console.log(`Cleaned up ${removedCount} projectiles`)
      }
    }
    
    this.projectiles = activeProjectiles
  }

  /**
   * Handle projectile hitting a target
   */
  private handleProjectileHit(projectile: Projectile, target: any): void {
    // Deal damage to the target
    if (target.takeDamage && typeof target.takeDamage === 'function') {
      const killed = target.takeDamage(projectile.projectileDamage)
      if (killed && this.totalHits % 10 === 0) {
        console.log(`Enemy eliminated! Total kills: ${Math.floor(this.totalHits / 1)}`)
      }
    }
    
    this.totalHits++
  }

  /**
   * Handle projectile expiring (reached max lifetime)
   */
  private handleProjectileExpired(_projectile: Projectile): void {
    // Projectile expired without hitting anything
    // Could add visual effect here if needed
  }

  /**
   * Get weapon statistics
   */
  getStats(): { shotsFired: number, hits: number, accuracy: number, activeProjectiles: number } {
    const accuracy = this.totalShotsFired > 0 ? (this.totalHits / this.totalShotsFired) * 100 : 0
    
    return {
      shotsFired: this.totalShotsFired,
      hits: this.totalHits,
      accuracy: Math.round(accuracy),
      activeProjectiles: this.projectiles.length
    }
  }

  /**
   * Upgrade weapon properties
   */
  upgrade(property: 'attackSpeed' | 'damage' | 'speed' | 'range', amount: number): void {
    switch (property) {
      case 'attackSpeed':
        // Reduce attack interval (faster attacks)
        this.attackInterval = Math.max(0.1, this.attackInterval - amount) // Min 0.1 seconds between attacks
        break
      case 'damage':
        this.projectileDamage = Math.floor(this.projectileDamage + amount)
        break
      case 'speed':
        this.projectileSpeed += amount
        break
      case 'range':
        this.range += amount
        break
    }
    
    console.log(`Weapon upgraded: ${property} +${amount}`)
  }

  /**
   * Apply upgrades from leveling system
   */
  applyUpgrades(upgrades: {
    damageMultiplier: number,
    fireRateMultiplier: number,
    rangeBonus: number,
    pierceBonus: number
  }): void {
    // Apply damage multiplier (base damage is 25)
    this.projectileDamage = Math.floor(25 * upgrades.damageMultiplier)
    
    // Apply fire rate multiplier (base interval is 1.0 seconds)
    // Lower interval = faster attacks
    this.attackInterval = Math.max(0.1, 1.0 / upgrades.fireRateMultiplier)
    
    // Apply range bonus (base range is 300)
    this.range = 300 + upgrades.rangeBonus
    
    // Apply piercing bonus
    this.pierceBonus = upgrades.pierceBonus
    if (upgrades.pierceBonus > 0) {
      console.log(`Piercing bonus applied: +${upgrades.pierceBonus} pierce`)
    }
  }

  /**
   * Get current weapon properties
   */
  getWeaponInfo(): { attackSpeed: number, damage: number, speed: number, range: number } {
    return {
      attackSpeed: 1 / this.attackInterval, // Convert back to attacks per second for display
      damage: this.projectileDamage,
      speed: this.projectileSpeed,
      range: this.range
    }
  }

  /**
   * Clear all projectiles (for game reset)
   */
  clear(): void {
    // Clear all projectiles
    for (const projectile of this.projectiles) {
      this.collisionManager.removeEntity(projectile)
      if (projectile.sprite.parent) {
        projectile.sprite.parent.removeChild(projectile.sprite)
      }
      projectile.destroy()
    }
    this.projectiles = []
    
    // Clear all beams
    for (const beam of this.beams) {
      try {
        // Beam was not added to collision manager, so no need to remove
        // this.collisionManager.removeEntity(beam)
        if (beam.sprite.parent) {
          beam.sprite.parent.removeChild(beam.sprite)
        }
        beam.destroy()
      } catch (error) {
        console.log('Error clearing beam:', error)
      }
    }
    this.beams = []
    
    // Reset active weapons to starting configuration (fireball)
    this.activeWeapons = [WeaponType.FIREBALL]
    
    // Clear beam hit tracking
    this.recentBeamHits.clear()
    
    // Reset stats
    this.totalShotsFired = 0
    this.totalHits = 0
  }

  /**
   * Update all beams
   */
  private updateBeams(deltaTime: number): void {
    const playerPos = this.player.position
    
    for (const beam of this.beams) {
      if (beam.active && beam.sprite && beam.sprite.transform) {
        beam.update(deltaTime)
        beam.updatePosition(playerPos.x, playerPos.y)
        
        // Manual precise collision detection for beams
        this.checkBeamEnemyCollisions(beam)
      }
    }
  }

  /**
   * Check beam collisions with all enemies using precise detection
   */
  private checkBeamEnemyCollisions(beam: Beam): void {
    // Early exit if beam is invalid
    if (!beam || !beam.sprite || !beam.sprite.transform || !beam.active) {
      return
    }
    
    const enemies = this.enemySpawner.getEnemies()
    const currentTime = Date.now()
    
    for (const enemy of enemies) {
      // Skip if enemy is invalid
      if (!enemy || !enemy.position) {
        continue
      }
      
      // Check if we recently hit this enemy (prevent rapid multiple hits)
      const lastHitTime = this.recentBeamHits.get(enemy) || 0
      if (currentTime - lastHitTime < 200) { // 200ms cooldown between hits on same enemy
        continue
      }
      
      // Use the beam's precise collision detection
      if (this.isEnemyInBeamPath(beam, enemy)) {
        // Direct hit - apply damage
        if (enemy.takeDamage && typeof enemy.takeDamage === 'function') {
          enemy.takeDamage(beam.projectileDamage)
          this.totalHits++
          this.recentBeamHits.set(enemy, currentTime)
          console.log(`Beam hit enemy directly! Damage: ${beam.projectileDamage}`)
        }
      }
    }
    
    // Clean up old hit records (older than 1 second)
    for (const [enemy, hitTime] of this.recentBeamHits.entries()) {
      if (currentTime - hitTime > 1000) {
        this.recentBeamHits.delete(enemy)
      }
    }
  }

  /**
   * Precise beam-enemy collision detection
   */
  private isEnemyInBeamPath(beam: Beam, enemy: any): boolean {
    // Validate inputs - check beam, sprite, and sprite's transform
    if (!beam || !beam.sprite || !enemy || !enemy.position) {
      return false
    }
    
    // Check if sprite has valid transform and position properties
    if (!beam.sprite.transform || beam.sprite.x === undefined || beam.sprite.y === undefined) {
      return false
    }
    
    // Get enemy position relative to beam center (player position)
    const enemyX = enemy.position.x - beam.sprite.x
    const enemyY = enemy.position.y - beam.sprite.y
    
    // Rotate enemy position to beam's local coordinate system
    const cosAngle = Math.cos(-beam.sprite.rotation)
    const sinAngle = Math.sin(-beam.sprite.rotation)
    const localX = enemyX * cosAngle - enemyY * sinAngle
    const localY = enemyX * sinAngle + enemyY * cosAngle
    
    // Beam rectangle: starts at 16px from center, extends for range, 32px wide
    const beamStartX = 16
    const beamEndX = beamStartX + beam.range
    const beamHalfWidth = 16 // 32px beam width / 2
    
    // Account for enemy's collision radius
    const enemyRadius = enemy.collisionRadius || 8
    
    // Check if enemy circle overlaps with beam rectangle
    const isAlongBeamLength = (localX + enemyRadius) >= beamStartX && (localX - enemyRadius) <= beamEndX
    const isWithinBeamWidth = Math.abs(localY) <= (beamHalfWidth + enemyRadius)
    
    return isAlongBeamLength && isWithinBeamWidth
  }

  /**
   * Cleanup inactive beams
   */
  private cleanupInactiveBeams(): void {
    const activeBeams: Beam[] = []
    
    for (const beam of this.beams) {
      if (beam.active) {
        activeBeams.push(beam)
      } else {
        // Remove from display after a short delay (for hit effect)
        try {
          // Beam was not added to collision manager, so no need to remove
          // this.collisionManager.removeEntity(beam)
          
          setTimeout(() => {
            try {
              if (beam.sprite.parent) {
                beam.sprite.parent.removeChild(beam.sprite)
              }
            } catch (error) {
              console.log('Error removing beam from display:', error)
            }
          }, 100)
        } catch (error) {
          console.log('Error cleaning up inactive beam:', error)
        }
      }
    }
    
    const removedCount = this.beams.length - activeBeams.length
    if (removedCount > 0) {
      // Only log cleanup of large batches
      if (removedCount >= 5) {
        console.log(`Cleaned up ${removedCount} beams`)
      }
    }
    
    this.beams = activeBeams
  }
} 