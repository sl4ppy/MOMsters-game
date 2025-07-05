import { Assets, Sprite } from 'pixi.js';

// Simple test to load the shark-man sprite
async function testSpriteLoading(): Promise<Sprite | null> {
  // console.log('Testing sprite loading...');

  try {
    // Try to load the shark-man sprite from public folder
    const texture = await Assets.load('/sprites/shark-man.png');
    // console.log('✅ Shark-man sprite loaded successfully!');
    // console.log('Texture dimensions:', texture.width, 'x', texture.height);

    // Create a sprite from the texture
    const sprite = new Sprite(texture);
    sprite.width = 64;
    sprite.height = 64;
    sprite.anchor.set(0.5, 0.5);

    // console.log('✅ Sprite created successfully!');
    // console.log('Sprite dimensions:', sprite.width, 'x', sprite.height);

    return sprite;
  } catch {
    // Handle error silently
    return null;
  }
}

// Export for use in other files
export { testSpriteLoading };
