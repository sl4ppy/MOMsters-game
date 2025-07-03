import { Sprite, Texture, Rectangle, Assets } from 'pixi.js'

export interface TerrainTile {
  sprite: Sprite
  tileType: number
  x: number
  y: number
  biome?: string
}

export interface TerrainGenerationOptions {
  worldWidth: number
  worldHeight: number
  tileSize: number
  biomeSeed?: number
  terrainDensity?: number // 0.0 to 1.0, how much of the world should have terrain
  biomeTypes?: BiomeType[]
}

export interface BiomeType {
  name: string
  tileWeights: number[] // Weight for each tile type (0-13)
  frequency: number // How common this biome is (0.0 to 1.0)
  clusterSize: number // How large biome clusters should be
  colorTint?: number // Optional visual tint for the biome
}

export class TerrainManager {
  private terrainTexture?: Texture
  private tileSize: number = 16
  private tilesPerRow: number = 7
  private tilesPerColumn: number = 2
  private totalTiles: number = this.tilesPerRow * this.tilesPerColumn
  
  // Simplified biome configurations for decorative terrain
  private defaultBiomes: BiomeType[] = [
    {
      name: 'grassland',
      tileWeights: [0.3, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.2, 0.15, 0.1, 0.05, 0.05, 0.05, 0.05],
      frequency: 0.4,
      clusterSize: 8,
      colorTint: 0x90EE90 // Light green tint
    },
    {
      name: 'forest',
      tileWeights: [0.1, 0.2, 0.3, 0.2, 0.1, 0.05, 0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05, 0.05],
      frequency: 0.3,
      clusterSize: 12,
      colorTint: 0x228B22 // Forest green tint
    },
    {
      name: 'rocky',
      tileWeights: [0.05, 0.1, 0.15, 0.2, 0.25, 0.15, 0.1, 0.05, 0.1, 0.15, 0.2, 0.25, 0.15, 0.1],
      frequency: 0.2,
      clusterSize: 6,
      colorTint: 0x696969 // Dim gray tint
    },
    {
      name: 'water',
      tileWeights: [0.05, 0.05, 0.1, 0.15, 0.2, 0.25, 0.2, 0.05, 0.05, 0.1, 0.15, 0.2, 0.25, 0.2],
      frequency: 0.1,
      clusterSize: 10,
      colorTint: 0x4169E1 // Royal blue tint
    }
  ]
  
  constructor() {
    this.loadTerrainSheet()
  }

  private async loadTerrainSheet(): Promise<void> {
    try {
      console.log('🔄 Loading terrain sprite sheet...')
      this.terrainTexture = await Assets.load('/sprites/terrain_7x2.png')
      console.log('✅ Terrain sprite sheet loaded successfully!')
      console.log(`📊 Sheet contains ${this.totalTiles} tiles (${this.tilesPerRow}x${this.tilesPerColumn})`)
      console.log('🔍 Terrain texture dimensions:', this.terrainTexture.width, 'x', this.terrainTexture.height)
      
      // Calculate actual tile size based on texture dimensions
      const actualTileWidth = Math.floor(this.terrainTexture.width / this.tilesPerRow)
      const actualTileHeight = Math.floor(this.terrainTexture.height / this.tilesPerColumn)
      
      console.log('🔍 Calculated tile size:', actualTileWidth, 'x', actualTileHeight)
      
      // Update tile size if different from expected
      if (actualTileWidth !== this.tileSize || actualTileHeight !== this.tileSize) {
        console.log(`⚠️ Tile size mismatch! Expected ${this.tileSize}x${this.tileSize}, got ${actualTileWidth}x${actualTileHeight}`)
        this.tileSize = Math.min(actualTileWidth, actualTileHeight) // Use the smaller dimension
        console.log(`✅ Updated tile size to ${this.tileSize}x${this.tileSize}`)
      }
    } catch (error) {
      console.error('❌ Failed to load terrain sprite sheet:', error)
      console.error('Error details:', error)
    }
  }

  /**
   * Create a terrain tile sprite from the sprite sheet
   * @param tileType - The tile type (0-13, where 0-6 are first row, 7-13 are second row)
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @param biome - Optional biome name for this tile
   * @returns TerrainTile object with sprite and metadata
   */
  createTerrainTile(tileType: number, x: number, y: number, biome?: string): TerrainTile | null {
    if (!this.terrainTexture || tileType < 0 || tileType >= this.totalTiles) {
      console.warn(`⚠️ Invalid tile type: ${tileType}. Must be 0-${this.totalTiles - 1}`)
      return null
    }

    // Calculate the position of the tile in the sprite sheet
    const row = Math.floor(tileType / this.tilesPerRow)
    const col = tileType % this.tilesPerRow
    
    // Calculate tile position and ensure it fits within the texture
    const tileX = col * this.tileSize
    const tileY = row * this.tileSize
    
    // Safety check: ensure the tile rectangle fits within the texture
    if (tileX + this.tileSize > this.terrainTexture.width || tileY + this.tileSize > this.terrainTexture.height) {
      console.warn(`⚠️ Tile ${tileType} (row ${row}, col ${col}) would exceed texture bounds!`)
      console.warn(`   Tile position: (${tileX}, ${tileY}) with size ${this.tileSize}x${this.tileSize}`)
      console.warn(`   Texture size: ${this.terrainTexture.width}x${this.terrainTexture.height}`)
      return null
    }
    
    // Create a texture rectangle for this specific tile
    const tileRect = new Rectangle(
      tileX,
      tileY,
      this.tileSize,
      this.tileSize
    )
    
    // Create a new texture from the rectangle
    const tileTexture = new Texture(this.terrainTexture.baseTexture, tileRect)
    
    // Create the sprite
    const sprite = new Sprite(tileTexture)
    sprite.x = x
    sprite.y = y
    sprite.anchor.set(0, 0) // Top-left anchor for tiles
    
    // Apply biome color tint if available
    if (biome) {
      const biomeConfig = this.defaultBiomes.find(b => b.name === biome)
      if (biomeConfig?.colorTint) {
        sprite.tint = biomeConfig.colorTint
      }
    }
    
    return {
      sprite,
      tileType,
      x,
      y,
      biome
    }
  }

  /**
   * Generate decorative procedural terrain across the entire world
   * @param options - Terrain generation options
   * @returns Array of TerrainTile objects
   */
  generateProceduralTerrain(options: TerrainGenerationOptions): TerrainTile[] {
    console.log('🌍 Generating decorative procedural terrain...')
    console.log(`📐 World size: ${options.worldWidth}x${options.worldHeight}`)
    console.log(`🔲 Tile size: ${options.tileSize}`)
    
    const tiles: TerrainTile[] = []
    const biomes = options.biomeTypes || this.defaultBiomes
    
    // Calculate grid dimensions
    const gridWidth = Math.ceil(options.worldWidth / options.tileSize)
    const gridHeight = Math.ceil(options.worldHeight / options.tileSize)
    
    console.log(`📊 Grid dimensions: ${gridWidth}x${gridHeight} tiles`)
    
    // Generate biome map using cellular automata for natural clustering
    const biomeMap = this.generateBiomeMap(gridWidth, gridHeight, biomes, options.biomeSeed)
    
    // Generate terrain density map for varied placement
    const densityMap = this.generateDensityMap(gridWidth, gridHeight, options.terrainDensity || 0.8)
    
    // Create terrain tiles
    for (let gridY = 0; gridY < gridHeight; gridY++) {
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        const worldX = (gridX * options.tileSize) - (options.worldWidth / 2)
        const worldY = (gridY * options.tileSize) - (options.worldHeight / 2)
        
        // Check if we should place terrain here based on density
        if (densityMap[gridY][gridX] > Math.random()) {
          const biome = biomeMap[gridY][gridX]
          const tileType = this.selectTileTypeForBiome(biome, biomes)
          
          const tile = this.createTerrainTile(tileType, worldX, worldY, biome.name)
          if (tile) {
            tiles.push(tile)
          }
        }
      }
    }
    
    console.log(`✅ Generated ${tiles.length} decorative terrain tiles`)
    return tiles
  }

  /**
   * Generate a biome map using cellular automata for natural-looking clusters
   */
  private generateBiomeMap(width: number, height: number, biomes: BiomeType[], seed?: number): BiomeType[][] {
    const biomeMap: BiomeType[][] = []
    
    // Create seeded random number generator
    const seededRandom = this.createSeededRandom(seed)
    
    // Initialize with random biomes
    for (let y = 0; y < height; y++) {
      biomeMap[y] = []
      for (let x = 0; x < width; x++) {
        biomeMap[y][x] = this.selectRandomBiome(biomes, seededRandom)
      }
    }
    
    // Apply cellular automata to create natural clusters
    for (let iteration = 0; iteration < 3; iteration++) {
      const newMap: BiomeType[][] = []
      
      for (let y = 0; y < height; y++) {
        newMap[y] = []
        for (let x = 0; x < width; x++) {
          const neighbors = this.getNeighborBiomes(biomeMap, x, y, width, height)
          const mostCommonBiome = this.getMostCommonBiome(neighbors)
          
          // 70% chance to become the most common neighbor biome for natural clustering
          if (seededRandom() < 0.7) {
            newMap[y][x] = mostCommonBiome
          } else {
            newMap[y][x] = biomeMap[y][x]
          }
        }
      }
      
      biomeMap.splice(0, biomeMap.length, ...newMap)
    }
    
    return biomeMap
  }

  /**
   * Create a seeded random number generator for consistent terrain
   */
  private createSeededRandom(seed?: number): () => number {
    if (seed === undefined) {
      return Math.random
    }
    
    let state = seed
    return () => {
      state = (state * 9301 + 49297) % 233280
      return state / 233280
    }
  }

  /**
   * Generate a density map for varied terrain placement
   */
  private generateDensityMap(width: number, height: number, density: number): number[][] {
    const densityMap: number[][] = []
    
    for (let y = 0; y < height; y++) {
      densityMap[y] = []
      for (let x = 0; x < width; x++) {
        // Create natural variation in density using noise
        const noise = this.simpleNoise(x * 0.1, y * 0.1)
        const adjustedDensity = density + (noise * 0.3) - 0.15
        densityMap[y][x] = Math.max(0, Math.min(1, adjustedDensity))
      }
    }
    
    return densityMap
  }

  /**
   * Simple noise function for natural terrain variation
   */
  private simpleNoise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return n - Math.floor(n)
  }

  /**
   * Select a random biome based on frequency weights
   */
  private selectRandomBiome(biomes: BiomeType[], randomFn: () => number = Math.random): BiomeType {
    const totalWeight = biomes.reduce((sum, biome) => sum + biome.frequency, 0)
    let random = randomFn() * totalWeight
    
    for (const biome of biomes) {
      random -= biome.frequency
      if (random <= 0) {
        return biome
      }
    }
    
    return biomes[0] // Fallback
  }

  /**
   * Get neighboring biomes for cellular automata
   */
  private getNeighborBiomes(biomeMap: BiomeType[][], x: number, y: number, width: number, height: number): BiomeType[] {
    const neighbors: BiomeType[] = []
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push(biomeMap[ny][nx])
        }
      }
    }
    
    return neighbors
  }

  /**
   * Get the most common biome from a list
   */
  private getMostCommonBiome(biomes: BiomeType[]): BiomeType {
    const counts = new Map<string, number>()
    
    for (const biome of biomes) {
      counts.set(biome.name, (counts.get(biome.name) || 0) + 1)
    }
    
    let mostCommon = biomes[0]
    let maxCount = 0
    
    for (const [name, count] of counts) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = biomes.find(b => b.name === name) || biomes[0]
      }
    }
    
    return mostCommon
  }

  /**
   * Select a tile type based on biome weights for visual variety
   */
  private selectTileTypeForBiome(biome: BiomeType, allBiomes: BiomeType[]): number {
    const totalWeight = biome.tileWeights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < biome.tileWeights.length; i++) {
      random -= biome.tileWeights[i]
      if (random <= 0) {
        return i
      }
    }
    
    return 0 // Fallback to first tile
  }

  /**
   * Create a grid of terrain tiles (legacy method for backward compatibility)
   * @param startX - Starting X coordinate
   * @param startY - Starting Y coordinate
   * @param width - Number of tiles wide
   * @param height - Number of tiles tall
   * @param tileTypes - 2D array of tile types, or a function to generate tile types
   * @returns Array of TerrainTile objects
   */
  createTerrainGrid(
    startX: number,
    startY: number,
    width: number,
    height: number,
    tileTypes: number[][] | ((x: number, y: number) => number)
  ): TerrainTile[] {
    const tiles: TerrainTile[] = []
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const worldX = startX + (x * this.tileSize)
        const worldY = startY + (y * this.tileSize)
        
        let tileType: number
        if (typeof tileTypes === 'function') {
          tileType = tileTypes(x, y)
        } else {
          tileType = tileTypes[y]?.[x] ?? 0
        }
        
        const tile = this.createTerrainTile(tileType, worldX, worldY)
        if (tile) {
          tiles.push(tile)
        }
      }
    }
    
    return tiles
  }

  /**
   * Get information about the terrain sheet
   */
  getTerrainInfo() {
    return {
      tileSize: this.tileSize,
      tilesPerRow: this.tilesPerRow,
      tilesPerColumn: this.tilesPerColumn,
      totalTiles: this.totalTiles,
      isLoaded: !!this.terrainTexture
    }
  }

  /**
   * Check if the terrain sheet is loaded
   */
  isLoaded(): boolean {
    return !!this.terrainTexture
  }
} 