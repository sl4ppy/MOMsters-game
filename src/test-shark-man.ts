import { Application, Assets, Sprite, Container } from 'pixi.js';

export async function testSharkManDisplay(app: Application): Promise<void> {
  console.log('Testing shark-man display...');

  try {
    // Load the shark-man sprite
    const texture = await Assets.load('/sprites/shark-man.png');
    console.log('✅ Shark-man texture loaded!');
    console.log('Texture dimensions:', texture.width, 'x', texture.height);

    // Create a sprite from the texture
    const sharkSprite = new Sprite(texture);
    sharkSprite.width = 64;
    sharkSprite.height = 64;
    sharkSprite.anchor.set(0.5, 0.5);
    sharkSprite.x = app.view.width / 2;
    sharkSprite.y = app.view.height / 2;

    // Add to the stage
    app.stage.addChild(sharkSprite);

    console.log('🎉 Shark-man sprite displayed on screen!');
    console.log('Position:', sharkSprite.x, sharkSprite.y);
    console.log('Size:', sharkSprite.width, 'x', sharkSprite.height);

    // No animation - static sprite
  } catch (error) {
    console.error('❌ Failed to display shark-man sprite:', error);
  }
}
