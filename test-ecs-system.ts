import { ECSWorld } from './src/ecs/index';
import { 
  createPositionComponent, 
  createVelocityComponent, 
  createTransformComponent,
  createRenderComponent,
  createMovementComponent,
  POSITION_COMPONENT,
  VELOCITY_COMPONENT,
  TRANSFORM_COMPONENT,
  RENDER_COMPONENT,
  MOVEMENT_COMPONENT,
  PositionComponent,
} from './src/ecs/components/BaseComponents';
import { 
  MovementSystem, 
  RenderSystem, 
  PhysicsSystem, 
  TransformSyncSystem 
} from './src/ecs/systems/BaseSystems';

async function testECSSystem(): Promise<void> {
  console.log('🧪 Testing ECS System...\n');

  // Test 1: Create ECS World
  console.log('1️⃣ Creating ECS World:');
  const world = new ECSWorld();
  
  try {
    console.log('✅ ECS World created successfully');
    console.log('📊 Initial stats:', world.getStats());
  } catch (error) {
    console.error('❌ ECS World creation failed:', error);
    return;
  }

  // Test 2: Create and register systems
  console.log('\n2️⃣ Creating and registering systems:');
  try {
    const physicsSystem = new PhysicsSystem(world.entityManager);
    const movementSystem = new MovementSystem(world.entityManager);
    const transformSyncSystem = new TransformSyncSystem(world.entityManager);
    const renderSystem = new RenderSystem(world.entityManager);

    world.systemManager.registerSystem(physicsSystem);
    world.systemManager.registerSystem(movementSystem);
    world.systemManager.registerSystem(transformSyncSystem);
    world.systemManager.registerSystem(renderSystem);

    console.log('✅ Systems registered successfully');
    console.log('📊 System count:', world.systemManager.getSystemCount());
  } catch (error) {
    console.error('❌ System registration failed:', error);
    return;
  }

  // Test 3: Initialize ECS World
  console.log('\n3️⃣ Initializing ECS World:');
  try {
    world.initialize();
    console.log('✅ ECS World initialized successfully');
  } catch (error) {
    console.error('❌ ECS World initialization failed:', error);
    return;
  }

  // Test 4: Create entities with components
  console.log('\n4️⃣ Creating entities with components:');
  try {
    // Create a moving entity
    const movingEntity = world.entityManager.createEntity();
    world.entityManager.addComponent(movingEntity.id, createPositionComponent(100, 100));
    world.entityManager.addComponent(movingEntity.id, createVelocityComponent(0, 0));
    world.entityManager.addComponent(movingEntity.id, createTransformComponent(100, 100));
    world.entityManager.addComponent(movingEntity.id, createMovementComponent(50, 1, 0));

    // Create a renderable entity
    const renderableEntity = world.entityManager.createEntity();
    world.entityManager.addComponent(renderableEntity.id, createTransformComponent(200, 200));
    world.entityManager.addComponent(renderableEntity.id, createRenderComponent(null, true, 1, 0));

    // Create a complex entity with all components
    const complexEntity = world.entityManager.createEntity();
    world.entityManager.addComponent(complexEntity.id, createPositionComponent(300, 300));
    world.entityManager.addComponent(complexEntity.id, createVelocityComponent(25, -25));
    world.entityManager.addComponent(complexEntity.id, createTransformComponent(300, 300));
    world.entityManager.addComponent(complexEntity.id, createRenderComponent(null, true, 1.5, 0));
    world.entityManager.addComponent(complexEntity.id, createMovementComponent(75, 0.5, -0.5));

    console.log('✅ Entities created successfully');
    console.log('📊 Entity count:', world.entityManager.getEntityCount());
    console.log('📊 Component count:', world.entityManager.getComponentCount());
  } catch (error) {
    console.error('❌ Entity creation failed:', error);
    return;
  }

  // Test 5: Component queries
  console.log('\n5️⃣ Testing component queries:');
  try {
    const positionEntities = world.entityManager.query({
      with: [POSITION_COMPONENT],
    });
    console.log('✅ Position entities:', positionEntities.length);

    const movingEntities = world.entityManager.query({
      with: [POSITION_COMPONENT, VELOCITY_COMPONENT],
    });
    console.log('✅ Moving entities:', movingEntities.length);

    const renderableEntities = world.entityManager.query({
      with: [TRANSFORM_COMPONENT, RENDER_COMPONENT],
    });
    console.log('✅ Renderable entities:', renderableEntities.length);

    const complexEntities = world.entityManager.query({
      with: [POSITION_COMPONENT, VELOCITY_COMPONENT, TRANSFORM_COMPONENT, RENDER_COMPONENT],
    });
    console.log('✅ Complex entities:', complexEntities.length);
  } catch (error) {
    console.error('❌ Component queries failed:', error);
    return;
  }

  // Test 6: System updates
  console.log('\n6️⃣ Testing system updates:');
  try {
    console.log('📊 Before update:');
    const positionsBefore = world.entityManager.query({ with: [POSITION_COMPONENT] });
    for (const entity of positionsBefore) {
      const position = world.entityManager.getComponent<PositionComponent>(entity.id, POSITION_COMPONENT);
      if (position) {
        console.log(`  Entity ${entity.id}: (${position.x}, ${position.y})`);
      }
    }

    // Update systems for 3 frames
    for (let i = 0; i < 3; i++) {
      world.update(16.67); // 60 FPS
      console.log(`  Frame ${i + 1} updated`);
    }

    console.log('📊 After update:');
    const positionsAfter = world.entityManager.query({ with: [POSITION_COMPONENT] });
    for (const entity of positionsAfter) {
      const position = world.entityManager.getComponent<PositionComponent>(entity.id, POSITION_COMPONENT);
      if (position) {
        console.log(`  Entity ${entity.id}: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
      }
    }

    console.log('✅ System updates completed successfully');
  } catch (error) {
    console.error('❌ System updates failed:', error);
    return;
  }

  // Test 7: Component manipulation
  console.log('\n7️⃣ Testing component manipulation:');
  try {
    const entities = world.entityManager.getAllEntities();
    if (entities.length > 0) {
      const firstEntity = entities[0];
      
      // Check if entity has position component
      const hasPosition = world.entityManager.hasComponent(firstEntity.id, POSITION_COMPONENT);
      console.log(`✅ Entity ${firstEntity.id} has position component: ${hasPosition}`);

      // Remove a component
      world.entityManager.removeComponent(firstEntity.id, VELOCITY_COMPONENT);
      const hasVelocity = world.entityManager.hasComponent(firstEntity.id, VELOCITY_COMPONENT);
      console.log(`✅ Entity ${firstEntity.id} has velocity component after removal: ${hasVelocity}`);

      // Add it back
      world.entityManager.addComponent(firstEntity.id, createVelocityComponent(10, 10));
      const hasVelocityAgain = world.entityManager.hasComponent(firstEntity.id, VELOCITY_COMPONENT);
      console.log(`✅ Entity ${firstEntity.id} has velocity component after re-adding: ${hasVelocityAgain}`);
    }
  } catch (error) {
    console.error('❌ Component manipulation failed:', error);
    return;
  }

  // Test 8: Entity destruction
  console.log('\n8️⃣ Testing entity destruction:');
  try {
    const initialCount = world.entityManager.getEntityCount();
    console.log(`📊 Initial entity count: ${initialCount}`);

    const entities = world.entityManager.getAllEntities();
    if (entities.length > 0) {
      const entityToDestroy = entities[0];
      world.entityManager.destroyEntity(entityToDestroy.id);
      
      const finalCount = world.entityManager.getEntityCount();
      console.log(`📊 Final entity count: ${finalCount}`);
      console.log(`✅ Entity destruction successful: ${finalCount < initialCount}`);
    }
  } catch (error) {
    console.error('❌ Entity destruction failed:', error);
  }

  // Test 9: Final stats and cleanup
  console.log('\n9️⃣ Final stats and cleanup:');
  try {
    console.log('📊 Final ECS World stats:', world.getDetailedStats());
    
    world.shutdown();
    console.log('✅ ECS World shutdown successfully');
  } catch (error) {
    console.error('❌ ECS World shutdown failed:', error);
  }

  console.log('\n🎉 ECS System Test Complete!');
}

// Run tests immediately
testECSSystem().catch(console.error);

export { testECSSystem }; 