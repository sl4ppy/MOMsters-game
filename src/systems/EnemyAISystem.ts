import { Enemy } from '../entities/Enemy';

// Behavior Tree Nodes
export abstract class BehaviorNode {
  abstract execute(enemy: Enemy, _deltaTime: number): BehaviorStatus;
}

export enum BehaviorStatus {
  SUCCESS,
  FAILURE,
  RUNNING
}

// Composite Nodes
export class SequenceNode extends BehaviorNode {
  private children: BehaviorNode[];

  constructor(children: BehaviorNode[]) {
    super();
    this.children = children;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    for (const child of this.children) {
      const status = child.execute(enemy, _deltaTime);
      if (status !== BehaviorStatus.SUCCESS) {
        return status;
      }
    }
    return BehaviorStatus.SUCCESS;
  }
}

export class SelectorNode extends BehaviorNode {
  private children: BehaviorNode[];

  constructor(children: BehaviorNode[]) {
    super();
    this.children = children;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    for (const child of this.children) {
      const status = child.execute(enemy, _deltaTime);
      if (status !== BehaviorStatus.FAILURE) {
        return status;
      }
    }
    return BehaviorStatus.FAILURE;
  }
}

// Decorator Nodes
export class InverterNode extends BehaviorNode {
  private child: BehaviorNode;

  constructor(child: BehaviorNode) {
    super();
    this.child = child;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    const status = this.child.execute(enemy, _deltaTime);
    return status === BehaviorStatus.SUCCESS ? BehaviorStatus.FAILURE : BehaviorStatus.SUCCESS;
  }
}

export class RepeatNode extends BehaviorNode {
  private child: BehaviorNode;
  private times: number;
  private current: number = 0;

  constructor(child: BehaviorNode, times: number = -1) {
    super();
    this.child = child;
    this.times = times;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (this.times > 0 && this.current >= this.times) {
      return BehaviorStatus.SUCCESS;
    }

    const status = this.child.execute(enemy, _deltaTime);
    if (status === BehaviorStatus.SUCCESS) {
      this.current++;
    }
    return BehaviorStatus.RUNNING;
  }
}

// Action Nodes
export class MoveToTargetNode extends BehaviorNode {
  private speed: number;
  private tolerance: number;

  constructor(speed: number = 100, tolerance: number = 10) {
    super();
    this.speed = speed;
    this.tolerance = tolerance;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (!enemy.target) {
      return BehaviorStatus.FAILURE;
    }

    const dx = enemy.target.x - enemy.sprite.x;
    const dy = enemy.target.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.tolerance) {
      return BehaviorStatus.SUCCESS;
    }

    const angle = Math.atan2(dy, dx);
    const velocityX = Math.cos(angle) * this.speed * _deltaTime;
    const velocityY = Math.sin(angle) * this.speed * _deltaTime;

    enemy.sprite.x += velocityX;
    enemy.sprite.y += velocityY;

    return BehaviorStatus.RUNNING;
  }
}

export class AttackTargetNode extends BehaviorNode {
  private attackRange: number;
  private attackCooldown: number;
  private lastAttackTime: number = 0;

  constructor(attackRange: number = 50, attackCooldown: number = 1) {
    super();
    this.attackRange = attackRange;
    this.attackCooldown = attackCooldown;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (!enemy.target) {
      return BehaviorStatus.FAILURE;
    }

    const dx = enemy.target.x - enemy.sprite.x;
    const dy = enemy.target.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.attackRange) {
      return BehaviorStatus.FAILURE;
    }

    const currentTime = Date.now() / 1000;
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return BehaviorStatus.RUNNING;
    }

    // Perform attack
    this.lastAttackTime = currentTime;
    enemy.attack();
    return BehaviorStatus.SUCCESS;
  }
}

export class FleeFromTargetNode extends BehaviorNode {
  private speed: number;
  private fleeDistance: number;

  constructor(speed: number = 120, fleeDistance: number = 200) {
    super();
    this.speed = speed;
    this.fleeDistance = fleeDistance;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (!enemy.target) {
      return BehaviorStatus.FAILURE;
    }

    const dx = enemy.target.x - enemy.sprite.x;
    const dy = enemy.target.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= this.fleeDistance) {
      return BehaviorStatus.SUCCESS;
    }

    // Move away from target
    const angle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
    const velocityX = Math.cos(angle) * this.speed * _deltaTime;
    const velocityY = Math.sin(angle) * this.speed * _deltaTime;

    enemy.sprite.x += velocityX;
    enemy.sprite.y += velocityY;

    return BehaviorStatus.RUNNING;
  }
}

export class PatrolNode extends BehaviorNode {
  private patrolPoints: { x: number; y: number }[];
  private currentPoint: number = 0;
  private speed: number;
  private tolerance: number;

  constructor(patrolPoints: { x: number; y: number }[], speed: number = 80, tolerance: number = 10) {
    super();
    this.patrolPoints = patrolPoints;
    this.speed = speed;
    this.tolerance = tolerance;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (this.patrolPoints.length === 0) {
      return BehaviorStatus.FAILURE;
    }

    const targetPoint = this.patrolPoints[this.currentPoint];
    const dx = targetPoint.x - enemy.sprite.x;
    const dy = targetPoint.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= this.tolerance) {
      this.currentPoint = (this.currentPoint + 1) % this.patrolPoints.length;
      return BehaviorStatus.SUCCESS;
    }

    const angle = Math.atan2(dy, dx);
    const velocityX = Math.cos(angle) * this.speed * _deltaTime;
    const velocityY = Math.sin(angle) * this.speed * _deltaTime;

    enemy.sprite.x += velocityX;
    enemy.sprite.y += velocityY;

    return BehaviorStatus.RUNNING;
  }
}

export class CheckHealthNode extends BehaviorNode {
  private threshold: number;

  constructor(threshold: number = 0.3) {
    super();
    this.threshold = threshold;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    const healthRatio = enemy.currentHealth / enemy.maximumHealth;
    return healthRatio <= this.threshold ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
}

export class CheckTargetDistanceNode extends BehaviorNode {
  private maxDistance: number;

  constructor(maxDistance: number = 300) {
    super();
    this.maxDistance = maxDistance;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (!enemy.target) {
      return BehaviorStatus.FAILURE;
    }

    const dx = enemy.target.x - enemy.sprite.x;
    const dy = enemy.target.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= this.maxDistance ? BehaviorStatus.SUCCESS : BehaviorStatus.FAILURE;
  }
}

// Formation Movement
export class FormationNode extends BehaviorNode {
  private formationType: 'circle' | 'line' | 'triangle';
  private radius: number;
  private speed: number;

  constructor(formationType: 'circle' | 'line' | 'triangle' = 'circle', radius: number = 100, speed: number = 80) {
    super();
    this.formationType = formationType;
    this.radius = radius;
    this.speed = speed;
  }

  execute(enemy: Enemy, _deltaTime: number): BehaviorStatus {
    if (!enemy.target) {
      return BehaviorStatus.FAILURE;
    }

    const formationPosition = this.getFormationPosition(enemy);
    const dx = formationPosition.x - enemy.sprite.x;
    const dy = formationPosition.y - enemy.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      return BehaviorStatus.SUCCESS;
    }

    const angle = Math.atan2(dy, dx);
    const velocityX = Math.cos(angle) * this.speed * _deltaTime;
    const velocityY = Math.sin(angle) * this.speed * _deltaTime;

    enemy.sprite.x += velocityX;
    enemy.sprite.y += velocityY;

    return BehaviorStatus.RUNNING;
  }

  private getFormationPosition(enemy: Enemy): { x: number; y: number } {
    if (!enemy.target) {
      return { x: enemy.sprite.x, y: enemy.sprite.y };
    }

    const baseX = enemy.target.x;
    const baseY = enemy.target.y;
    const enemyIndex = enemy.formationIndex || 0;

    switch (this.formationType) {
      case 'circle':
        const angle = (enemyIndex / (enemy.formationSize || 1)) * Math.PI * 2;
        return {
          x: baseX + Math.cos(angle) * this.radius,
          y: baseY + Math.sin(angle) * this.radius
        };

      case 'line':
        const spacing = this.radius / (enemy.formationSize || 1);
        const offset = (enemyIndex - (enemy.formationSize || 1) / 2) * spacing;
        return {
          x: baseX + offset,
          y: baseY
        };

      case 'triangle':
        const triangleAngle = (enemyIndex / 3) * Math.PI * 2;
        return {
          x: baseX + Math.cos(triangleAngle) * this.radius,
          y: baseY + Math.sin(triangleAngle) * this.radius
        };

      default:
        return { x: baseX, y: baseY };
    }
  }
}

// AI Behavior Trees
export class EnemyAI {
  private behaviorTree: BehaviorNode;
  private enemy: Enemy;

  constructor(enemy: Enemy, behaviorTree: BehaviorNode) {
    this.enemy = enemy;
    this.behaviorTree = behaviorTree;
  }

  update(deltaTime: number): void {
    this.behaviorTree.execute(this.enemy, deltaTime);
  }
}

// Pre-built behavior trees
export class BehaviorTreeFactory {
  static createAggressiveBehavior(enemy: Enemy): EnemyAI {
    const behaviorTree = new SelectorNode([
      // Check if health is low and flee
      new SequenceNode([
        new CheckHealthNode(0.3),
        new FleeFromTargetNode(120, 200)
      ]),
      // Attack if in range
      new SequenceNode([
        new CheckTargetDistanceNode(50),
        new AttackTargetNode(50, 1)
      ]),
      // Move to target
      new MoveToTargetNode(100, 10)
    ]);

    return new EnemyAI(enemy, behaviorTree);
  }

  static createDefensiveBehavior(enemy: Enemy): EnemyAI {
    const behaviorTree = new SelectorNode([
      // Flee if health is low
      new SequenceNode([
        new CheckHealthNode(0.5),
        new FleeFromTargetNode(100, 300)
      ]),
      // Attack only if very close
      new SequenceNode([
        new CheckTargetDistanceNode(30),
        new AttackTargetNode(30, 1.5)
      ]),
      // Keep distance
      new SequenceNode([
        new CheckTargetDistanceNode(100),
        new FleeFromTargetNode(80, 150)
      ]),
      // Move to target slowly
      new MoveToTargetNode(60, 10)
    ]);

    return new EnemyAI(enemy, behaviorTree);
  }

  static createPatrolBehavior(enemy: Enemy, patrolPoints: { x: number; y: number }[]): EnemyAI {
    const behaviorTree = new SelectorNode([
      // Attack if target is close
      new SequenceNode([
        new CheckTargetDistanceNode(50),
        new AttackTargetNode(50, 1)
      ]),
      // Patrol
      new PatrolNode(patrolPoints, 60, 10)
    ]);

    return new EnemyAI(enemy, behaviorTree);
  }

  static createFormationBehavior(enemy: Enemy, formationType: 'circle' | 'line' | 'triangle' = 'circle'): EnemyAI {
    const behaviorTree = new SelectorNode([
      // Attack if in range
      new SequenceNode([
        new CheckTargetDistanceNode(50),
        new AttackTargetNode(50, 1)
      ]),
      // Move in formation
      new FormationNode(formationType, 100, 80)
    ]);

    return new EnemyAI(enemy, behaviorTree);
  }
}

// AI Manager for coordinating multiple enemies
export class EnemyAIManager {
  private enemies: Map<Enemy, EnemyAI> = new Map();
  private difficulty: number = 1.0;

  addEnemy(enemy: Enemy, behaviorType: 'aggressive' | 'defensive' | 'patrol' | 'formation', options?: Record<string, unknown>): void {
    let ai: EnemyAI;

    switch (behaviorType) {
      case 'aggressive':
        ai = BehaviorTreeFactory.createAggressiveBehavior(enemy);
        break;
      case 'defensive':
        ai = BehaviorTreeFactory.createDefensiveBehavior(enemy);
        break;
      case 'patrol':
        const patrolPoints = options?.patrolPoints || [];
        ai = BehaviorTreeFactory.createPatrolBehavior(enemy, patrolPoints);
        break;
      case 'formation':
        const formationType = options?.formationType || 'circle';
        ai = BehaviorTreeFactory.createFormationBehavior(enemy, formationType);
        break;
      default:
        ai = BehaviorTreeFactory.createAggressiveBehavior(enemy);
    }

    this.enemies.set(enemy, ai);
  }

  removeEnemy(enemy: Enemy): void {
    this.enemies.delete(enemy);
  }

  update(deltaTime: number): void {
    for (const [enemy, ai] of this.enemies) {
      if (enemy.isActive()) {
        ai.update(deltaTime * this.difficulty);
      }
    }
  }

  setDifficulty(difficulty: number): void {
    this.difficulty = Math.max(0.5, Math.min(2.0, difficulty));
  }

  getEnemyCount(): number {
    return this.enemies.size;
  }

  clear(): void {
    this.enemies.clear();
  }
} 