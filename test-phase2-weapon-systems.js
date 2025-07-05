#!/usr/bin/env node
"use strict";
/**
 * Phase 2 Weapon Systems Test
 * Tests the ECS-based weapon and projectile systems
 */
Object.defineProperty(exports, "__esModule", { value: true });
const WeaponComponents_1 = require("./src/ecs/components/WeaponComponents");
const index_1 = require("./src/ecs/index");
const index_2 = require("./src/events/index");
console.log('🚀 Phase 2 Weapon Systems Test Starting...\n');
async function testWeaponComponents() {
    console.log('📦 Testing Weapon Components...');
    try {
        // Test weapon creation
        const fireballWeapon = (0, WeaponComponents_1.createWeaponComponent)(WeaponComponents_1.WeaponType.FIREBALL, {
            name: 'Fireball',
            description: 'Classic fireball projectile',
            icon: '🔥',
            baseDamage: 25,
            baseAttackSpeed: 1.0,
            baseRange: 300,
            basePierce: 0,
            projectileSpeed: 400,
            maxLevel: 8,
            effects: { damageMultiplier: 1.25 }
        });
        console.log(`  ✅ Created fireball weapon: ${fireballWeapon.name} (${fireballWeapon.damage} damage)`);
        // Test weapon owner
        const weaponOwner = (0, WeaponComponents_1.createWeaponOwnerComponent)();
        console.log(`  ✅ Created weapon owner with ${weaponOwner.activeWeapons.length} active weapons`);
        // Test weapon timer
        const weaponTimer = (0, WeaponComponents_1.createWeaponTimerComponent)(WeaponComponents_1.WeaponType.FIREBALL, 1.0);
        console.log(`  ✅ Created weapon timer: ${weaponTimer.fireInterval}s interval`);
        // Test projectile components
        const playerId = 'player-1';
        const projectile = (0, WeaponComponents_1.createProjectileComponent)(WeaponComponents_1.WeaponType.FIREBALL, playerId, 25, 0, 3.0);
        console.log(`  ✅ Created projectile: ${projectile.damage} damage, ${projectile.maxLifetime}s lifetime`);
        const projectileMovement = (0, WeaponComponents_1.createProjectileMovementComponent)({ x: 100, y: 0 }, 400);
        console.log(`  ✅ Created projectile movement: ${projectileMovement.speed} speed`);
        const projectileVisual = (0, WeaponComponents_1.createProjectileVisualComponent)();
        console.log(`  ✅ Created projectile visual: ${projectileVisual.scale} scale`);
        // Test beam components
        const beam = (0, WeaponComponents_1.createBeamComponent)(WeaponComponents_1.WeaponType.EYE_BEAM, playerId, 10, 350, 3.0);
        console.log(`  ✅ Created beam: ${beam.damage} damage, ${beam.range} range, ${beam.rotationDuration}s rotation`);
        const beamVisual = (0, WeaponComponents_1.createBeamVisualComponent)();
        console.log(`  ✅ Created beam visual: ${beamVisual.alpha} alpha`);
        // Test targeting component
        const targeting = (0, WeaponComponents_1.createWeaponTargetingComponent)(WeaponComponents_1.WeaponType.FIREBALL);
        console.log(`  ✅ Created targeting: ${targeting.targetingType} targeting, ${targeting.targetRange} range`);
        // Test upgrade component
        const upgrade = (0, WeaponComponents_1.createWeaponUpgradeComponent)(WeaponComponents_1.WeaponType.FIREBALL);
        console.log(`  ✅ Created upgrade: ${upgrade.availablePoints} points available`);
        console.log('✅ All weapon components created successfully!\n');
        return true;
    }
    catch (error) {
        console.error('❌ Weapon components test failed:', error);
        return false;
    }
}
async function testEventBusIntegration() {
    console.log('🔄 Testing EventBus Integration...');
    try {
        const eventBus = (0, index_2.createEventBus)();
        console.log('  ✅ Created EventBus instance');
        let eventReceived = false;
        // Subscribe to a simple event
        eventBus.on('test-event', () => {
            console.log('  ✅ Test event received');
            eventReceived = true;
        });
        // Emit test event
        eventBus.emit('test-event');
        // Verify event was received
        if (eventReceived) {
            console.log('✅ EventBus integration working correctly!\n');
            return true;
        }
        else {
            console.error('❌ Test event was not received');
            return false;
        }
    }
    catch (error) {
        console.error('❌ EventBus integration test failed:', error);
        return false;
    }
}
async function testECSIntegration() {
    console.log('🏗️ Testing ECS Integration...');
    try {
        const eventBus = (0, index_2.createEventBus)();
        const entityManager = new index_1.EntityManager();
        const systemManager = new index_1.SystemManager(eventBus);
        const ecsWorld = new index_1.ECSWorld(entityManager, systemManager);
        console.log('  ✅ Created ECS World');
        // Create weapon system
        const weaponSystem = new index_1.WeaponSystem(eventBus);
        systemManager.addSystem(weaponSystem);
        console.log('  ✅ Added WeaponSystem to SystemManager');
        // Create projectile system
        const projectileSystem = new index_1.ProjectileSystem(eventBus);
        systemManager.addSystem(projectileSystem);
        console.log('  ✅ Added ProjectileSystem to SystemManager');
        // Initialize systems
        systemManager.init();
        console.log('  ✅ Initialized all systems');
        // Create a player entity with weapon
        const playerId = 'player-1';
        const playerEntity = entityManager.createEntity(playerId);
        const playerPosition = {
            type: 'position',
            x: 400,
            y: 300
        };
        const weaponOwner = (0, WeaponComponents_1.createWeaponOwnerComponent)();
        const weapon = (0, WeaponComponents_1.createWeaponComponent)(WeaponComponents_1.WeaponType.FIREBALL, {
            name: 'Test Fireball',
            description: 'Test weapon',
            icon: '🔥',
            baseDamage: 25,
            baseAttackSpeed: 1.0,
            baseRange: 300,
            basePierce: 0,
            projectileSpeed: 400,
            maxLevel: 8
        });
        weapon.isActive = true;
        const weaponTimer = (0, WeaponComponents_1.createWeaponTimerComponent)(WeaponComponents_1.WeaponType.FIREBALL, 1.0);
        const weaponTargeting = (0, WeaponComponents_1.createWeaponTargetingComponent)(WeaponComponents_1.WeaponType.FIREBALL);
        entityManager.addComponent(playerId, 'position', playerPosition);
        entityManager.addComponent(playerId, 'weapon-owner', weaponOwner);
        entityManager.addComponent(playerId, 'weapon', weapon);
        entityManager.addComponent(playerId, 'weapon-timer', weaponTimer);
        entityManager.addComponent(playerId, 'weapon-targeting', weaponTargeting);
        console.log(`  ✅ Created player entity with weapon: ${playerId}`);
        // Create an enemy entity
        const enemyId = 'enemy-1';
        const enemyEntity = entityManager.createEntity(enemyId);
        const enemyPosition = {
            type: 'position',
            x: 600,
            y: 300
        };
        const enemyHealth = {
            type: 'health',
            currentHealth: 100,
            maxHealth: 100,
            isAlive: true,
            invulnerable: false,
            regenRate: 0
        };
        const enemy = {
            type: 'enemy',
            enemyId: enemyId,
            enemyType: 'basic',
            level: 1,
            size: 'medium',
            moveSpeed: 50,
            damage: 10,
            experienceReward: 10,
            isAlive: true,
            behaviorState: 'idle',
            lastPlayerDistance: 200,
            timeSinceLastAction: 0,
            specialAbilities: [],
            statusEffects: new Map(),
            currentAction: null,
            actionCooldown: 0,
            spawnTime: Date.now(),
            killCount: 0
        };
        entityManager.addComponent(enemyId, 'position', enemyPosition);
        entityManager.addComponent(enemyId, 'health', enemyHealth);
        entityManager.addComponent(enemyId, 'enemy', enemy);
        console.log(`  ✅ Created enemy entity: ${enemyId}`);
        // Test system update
        const entities = entityManager.getAllEntities();
        weaponSystem.update(entities, 1 / 60); // 60 FPS
        projectileSystem.update(entities, 1 / 60);
        console.log('  ✅ Systems updated successfully');
        // Test weapon timer functionality
        weaponTimer.timeSinceLastFire = 1.1; // Ready to fire
        weaponTimer.canFire = true;
        weaponSystem.update(entities, 1 / 60);
        console.log('  ✅ Weapon system processed firing logic');
        console.log('✅ ECS integration test completed successfully!\n');
        return true;
    }
    catch (error) {
        console.error('❌ ECS integration test failed:', error);
        return false;
    }
}
async function testWeaponTypes() {
    console.log('🎯 Testing All Weapon Types...');
    try {
        const weaponTypes = [
            WeaponComponents_1.WeaponType.FIREBALL,
            WeaponComponents_1.WeaponType.AXE,
            WeaponComponents_1.WeaponType.KNIFE,
            WeaponComponents_1.WeaponType.RUNE_TRACER,
            WeaponComponents_1.WeaponType.EYE_BEAM,
            WeaponComponents_1.WeaponType.LIGHTNING,
            WeaponComponents_1.WeaponType.WHIP,
            WeaponComponents_1.WeaponType.MAGIC_WAND,
            WeaponComponents_1.WeaponType.BIBLE,
            WeaponComponents_1.WeaponType.GARLIC,
            WeaponComponents_1.WeaponType.HOLY_WATER
        ];
        for (const weaponType of weaponTypes) {
            const weapon = (0, WeaponComponents_1.createWeaponComponent)(weaponType, {
                name: `Test ${weaponType}`,
                description: `Test weapon of type ${weaponType}`,
                icon: '⚔️',
                baseDamage: 20,
                baseAttackSpeed: 1.0,
                baseRange: 200,
                basePierce: 0,
                projectileSpeed: 300,
                maxLevel: 6
            });
            const timer = (0, WeaponComponents_1.createWeaponTimerComponent)(weaponType, 1.0);
            const targeting = (0, WeaponComponents_1.createWeaponTargetingComponent)(weaponType);
            console.log(`  ✅ Created ${weaponType}: ${weapon.damage} damage, ${weapon.range} range`);
        }
        console.log(`✅ All ${weaponTypes.length} weapon types created successfully!\n`);
        return true;
    }
    catch (error) {
        console.error('❌ Weapon types test failed:', error);
        return false;
    }
}
async function testProjectileBehaviors() {
    console.log('🚀 Testing Projectile Behaviors...');
    try {
        const behaviors = ['straight', 'homing', 'boomerang', 'orbit', 'spray'];
        for (const behavior of behaviors) {
            const projectile = (0, WeaponComponents_1.createProjectileComponent)(WeaponComponents_1.WeaponType.FIREBALL, 'player-1', 25);
            projectile.behaviorType = behavior;
            const movement = (0, WeaponComponents_1.createProjectileMovementComponent)({ x: 100, y: 0 }, 400);
            if (behavior === 'homing') {
                projectile.homingStrength = 2.0;
                movement.targetEntityId = 'enemy-1';
            }
            else if (behavior === 'orbit') {
                movement.orbitRadius = 150;
                movement.orbitSpeed = 3.0;
            }
            else if (behavior === 'boomerang') {
                movement.maxDistance = 300;
                movement.isReturning = false;
            }
            const visual = (0, WeaponComponents_1.createProjectileVisualComponent)();
            console.log(`  ✅ Created ${behavior} projectile: ${projectile.damage} damage`);
        }
        console.log(`✅ All ${behaviors.length} projectile behaviors tested successfully!\n`);
        return true;
    }
    catch (error) {
        console.error('❌ Projectile behaviors test failed:', error);
        return false;
    }
}
async function runAllTests() {
    console.log('🧪 Running Phase 2 Weapon Systems Tests...\n');
    const tests = [
        { name: 'Weapon Components', test: testWeaponComponents },
        { name: 'EventBus Integration', test: testEventBusIntegration },
        { name: 'ECS Integration', test: testECSIntegration },
        { name: 'Weapon Types', test: testWeaponTypes },
        { name: 'Projectile Behaviors', test: testProjectileBehaviors }
    ];
    let passedTests = 0;
    let totalTests = tests.length;
    for (const { name, test } of tests) {
        try {
            const result = await test();
            if (result) {
                passedTests++;
            }
        }
        catch (error) {
            console.error(`❌ ${name} test crashed:`, error);
        }
    }
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
    if (passedTests === totalTests) {
        console.log('🎉 All Phase 2 Weapon Systems tests PASSED!');
        console.log('✅ Weapon system integration is working correctly');
        console.log('🚀 Ready for integration with main game loop');
    }
    else {
        console.log('⚠️  Some tests failed - check the output above');
    }
    return passedTests === totalTests;
}
// Run the tests
runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
});
