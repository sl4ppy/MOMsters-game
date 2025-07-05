import { Container, Graphics, Sprite, Texture, Application } from 'pixi.js';

export interface ParticleConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
  gravity?: number;
  friction?: number;
  rotation?: number;
  rotationSpeed?: number;
  scale?: number;
  scaleSpeed?: number;
  texture?: Texture;
}

export interface ParticleEmitterConfig {
  x: number;
  y: number;
  particleCount: number;
  particleConfig: Partial<ParticleConfig>;
  duration?: number;
  burst?: boolean;
  spread?: number;
  speed?: number;
  size?: number;
  color?: number;
  alpha?: number;
  gravity?: number;
  friction?: number;
  texture?: Texture;
}

export class Particle {
  public sprite: Sprite | Graphics;
  public x: number;
  public y: number;
  public velocityX: number;
  public velocityY: number;
  public life: number;
  public maxLife: number;
  public size: number;
  public color: number;
  public alpha: number;
  public gravity: number;
  public friction: number;
  public rotation: number;
  public rotationSpeed: number;
  public scale: number;
  public scaleSpeed: number;
  public active: boolean = false;

  constructor() {
    this.sprite = new Graphics();
    this.x = 0;
    this.y = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 1;
    this.color = 0xffffff;
    this.alpha = 1;
    this.gravity = 0;
    this.friction = 1;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.scale = 1;
    this.scaleSpeed = 0;
  }

  init(config: ParticleConfig): void {
    this.x = config.x;
    this.y = config.y;
    this.velocityX = config.velocityX;
    this.velocityY = config.velocityY;
    this.life = config.life;
    this.maxLife = config.maxLife;
    this.size = config.size;
    this.color = config.color;
    this.alpha = config.alpha;
    this.gravity = config.gravity || 0;
    this.friction = config.friction || 1;
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
    this.scale = config.scale || 1;
    this.scaleSpeed = config.scaleSpeed || 0;
    this.active = true;

    // Update sprite
    this.updateSprite();
  }

  update(deltaTime: number): void {
    if (!this.active) return;

    // Update life
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Update position
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // Apply gravity
    this.velocityY += this.gravity * deltaTime;

    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime;

    // Update scale
    this.scale += this.scaleSpeed * deltaTime;

    // Update sprite
    this.updateSprite();
  }

  private updateSprite(): void {
    if (this.sprite instanceof Graphics) {
      const graphics = this.sprite as Graphics;
      graphics.clear();
      
      const lifeRatio = this.life / this.maxLife;
      const currentAlpha = this.alpha * lifeRatio;
      
      graphics.beginFill(this.color, currentAlpha);
      graphics.drawCircle(0, 0, this.size * this.scale);
      graphics.endFill();
      
      graphics.x = this.x;
      graphics.y = this.y;
      graphics.rotation = this.rotation;
    } else {
      const sprite = this.sprite as Sprite;
      const lifeRatio = this.life / this.maxLife;
      
      sprite.x = this.x;
      sprite.y = this.y;
      sprite.rotation = this.rotation;
      sprite.scale.set(this.scale);
      sprite.alpha = this.alpha * lifeRatio;
    }
  }

  reset(): void {
    this.active = false;
    this.sprite.visible = false;
  }
}

export class ParticleEmitter {
  private x: number;
  private y: number;
  private particleCount: number;
  private particleConfig: Partial<ParticleConfig>;
  private duration: number;
  private burst: boolean;
  private spread: number;
  private speed: number;
  private size: number;
  private color: number;
  private alpha: number;
  private gravity: number;
  private friction: number;
  private texture?: Texture;

  private timer: number = 0;
  private active: boolean = true;
  private particlesEmitted: number = 0;

  constructor(config: ParticleEmitterConfig) {
    this.x = config.x;
    this.y = config.y;
    this.particleCount = config.particleCount;
    this.particleConfig = config.particleConfig;
    this.duration = config.duration || 1;
    this.burst = config.burst || false;
    this.spread = config.spread || Math.PI * 2;
    this.speed = config.speed || 100;
    this.size = config.size || 5;
    this.color = config.color || 0xffffff;
    this.alpha = config.alpha || 1;
    this.gravity = config.gravity || 0;
    this.friction = config.friction || 0.98;
    this.texture = config.texture;
  }

  update(deltaTime: number, particleSystem: ParticleSystem): void {
    if (!this.active) return;

    this.timer += deltaTime;

    if (this.burst) {
      // Emit all particles at once
      for (let i = 0; i < this.particleCount; i++) {
        this.emitParticle(particleSystem);
      }
      this.active = false;
    } else {
      // Emit particles over time
      const particlesPerSecond = this.particleCount / this.duration;
      const particlesToEmit = particlesPerSecond * deltaTime;

      for (let i = 0; i < particlesToEmit; i++) {
        if (this.particlesEmitted < this.particleCount) {
          this.emitParticle(particleSystem);
          this.particlesEmitted++;
        }
      }

      if (this.timer >= this.duration) {
        this.active = false;
      }
    }
  }

  private emitParticle(particleSystem: ParticleSystem): void {
    const angle = Math.random() * this.spread;
    const velocity = this.speed * (0.5 + Math.random() * 0.5);
    
    const config: ParticleConfig = {
      x: this.x + (Math.random() - 0.5) * 10,
      y: this.y + (Math.random() - 0.5) * 10,
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity,
      life: 1 + Math.random() * 2,
      maxLife: 1 + Math.random() * 2,
      size: this.size * (0.5 + Math.random() * 0.5),
      color: this.color,
      alpha: this.alpha,
      gravity: this.gravity,
      friction: this.friction,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,
      scale: 1,
      scaleSpeed: -0.5,
      texture: this.texture,
      ...this.particleConfig
    };

    particleSystem.emitParticle(config);
  }

  isActive(): boolean {
    return this.active;
  }
}

export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private emitters: ParticleEmitter[] = [];
  private particlePool: Particle[] = [];
  private maxParticles: number;
  private quality: 'low' | 'medium' | 'high';

  constructor(app: Application, maxParticles: number = 1000, quality: 'low' | 'medium' | 'high' = 'medium') {
    this.container = new Container();
    this.maxParticles = maxParticles;
    this.quality = quality;
    
    app.stage.addChild(this.container);
    
    // Pre-allocate particle pool
    this.initializeParticlePool();
  }

  private initializeParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const particle = new Particle();
      this.particlePool.push(particle);
      this.container.addChild(particle.sprite);
    }
  }

  private getParticleFromPool(): Particle | null {
    // Find inactive particle
    for (const particle of this.particlePool) {
      if (!particle.active) {
        return particle;
      }
    }
    return null;
  }

  emitParticle(config: ParticleConfig): void {
    const particle = this.getParticleFromPool();
    if (particle) {
      particle.init(config);
      particle.sprite.visible = true;
    }
  }

  createEmitter(config: ParticleEmitterConfig): ParticleEmitter {
    const emitter = new ParticleEmitter(config);
    this.emitters.push(emitter);
    return emitter;
  }

  createExplosion(x: number, y: number, intensity: number = 1): void {
    const config: ParticleEmitterConfig = {
      x,
      y,
      particleCount: Math.floor(20 * intensity),
      burst: true,
      spread: Math.PI * 2,
      speed: 150 * intensity,
      size: 3 * intensity,
      color: 0xff6600,
      alpha: 0.8,
      gravity: 200,
      friction: 0.95,
      particleConfig: {
        life: 0.5 + Math.random() * 1,
        scaleSpeed: -1,
        rotationSpeed: (Math.random() - 0.5) * 20
      }
    };

    this.createEmitter(config);
  }

  createSparkle(x: number, y: number, color: number = 0xffff00): void {
    const config: ParticleEmitterConfig = {
      x,
      y,
      particleCount: 5,
      burst: true,
      spread: Math.PI * 2,
      speed: 50,
      size: 2,
      color,
      alpha: 1,
      gravity: -50,
      friction: 0.9,
      particleConfig: {
        life: 1 + Math.random() * 1,
        scaleSpeed: -0.5,
        rotationSpeed: (Math.random() - 0.5) * 10
      }
    };

    this.createEmitter(config);
  }

  createTrail(x: number, y: number, color: number = 0x00ffff): void {
    const config: ParticleEmitterConfig = {
      x,
      y,
      particleCount: 1,
      burst: true,
      speed: 0,
      size: 2,
      color,
      alpha: 0.6,
      gravity: 0,
      friction: 0.9,
      particleConfig: {
        life: 0.3,
        scaleSpeed: -2,
        alpha: 0.6
      }
    };

    this.createEmitter(config);
  }

  createMagicEffect(x: number, y: number): void {
    const config: ParticleEmitterConfig = {
      x,
      y,
      particleCount: 15,
      burst: true,
      spread: Math.PI * 2,
      speed: 80,
      size: 3,
      color: 0x9933ff,
      alpha: 0.8,
      gravity: 0,
      friction: 0.95,
      particleConfig: {
        life: 1.5 + Math.random() * 1,
        scaleSpeed: -0.3,
        rotationSpeed: (Math.random() - 0.5) * 15
      }
    };

    this.createEmitter(config);
  }

  update(deltaTime: number): void {
    // Update particles
    for (const particle of this.particlePool) {
      if (particle.active) {
        particle.update(deltaTime);
      }
    }

    // Update emitters
    this.emitters = this.emitters.filter(emitter => {
      emitter.update(deltaTime, this);
      return emitter.isActive();
    });

    // Clean up inactive particles
    for (const particle of this.particlePool) {
      if (!particle.active && particle.sprite.visible) {
        particle.reset();
      }
    }
  }

  setQuality(quality: 'low' | 'medium' | 'high'): void {
    this.quality = quality;
    
    // Adjust particle limits based on quality
    switch (quality) {
      case 'low':
        this.maxParticles = 500;
        break;
      case 'medium':
        this.maxParticles = 1000;
        break;
      case 'high':
        this.maxParticles = 2000;
        break;
    }
  }

  clear(): void {
    // Reset all particles
    for (const particle of this.particlePool) {
      particle.reset();
    }
    
    // Clear emitters
    this.emitters = [];
  }

  getParticleCount(): number {
    return this.particlePool.filter(p => p.active).length;
  }

  getEmitterCount(): number {
    return this.emitters.length;
  }

  getContainer(): Container {
    return this.container;
  }
} 