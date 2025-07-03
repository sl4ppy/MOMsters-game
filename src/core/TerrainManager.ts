import { Sprite, Texture, Rectangle, Assets } from 'pixi.js'

export interface TerrainTile {
  sprite: Sprite
  tileType: number
  x: number
  y: number
  biome?: string
}

export interface DecorationTile {
  sprite: Sprite
  tileType: number
  x: number
  y: number
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
  private decorationTexture?: Texture
  private tileSize: number = 32 // Target rendering size - textures will be scaled to this size
  private actualTileSize: number = 32 // Actual texture tile size (new atlas is 32x32)
  private tilesPerRow: number = 10
  private tilesPerColumn: number = 2
  private totalTiles: number = this.tilesPerRow * this.tilesPerColumn
  
  // Decoration atlas properties
  private decorationTilesPerRow: number = 10
  private decorationTilesPerColumn: number = 6
  private totalDecorationTiles: number = this.decorationTilesPerRow * this.decorationTilesPerColumn
  
  // Ultra-cohesive biome configurations for massive, spread-out terrain clusters
  private defaultBiomes: BiomeType[] = [
    {
      name: 'grassland',
      tileWeights: [0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // Focus heavily on first 2 tiles of each row
      frequency: 0.25,
      clusterSize: 40, // Massive clusters
      colorTint: 0x90EE90 // Light green tint
    },
    {
      name: 'forest',
      tileWeights: [0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], // Focus heavily on middle tiles of each row
      frequency: 0.25,
      clusterSize: 50, // Massive clusters
      colorTint: 0x228B22 // Forest green tint
    },
    {
      name: 'rocky',
      tileWeights: [0.0, 0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0], // Focus heavily on later tiles of each row
      frequency: 0.25,
      clusterSize: 35, // Large clusters
      colorTint: 0x696969 // Dim gray tint
    },
    {
      name: 'water',
      tileWeights: [0.0, 0.0, 0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3, 0.6, 0.1, 0.0, 0.0, 0.0, 0.0], // Focus heavily on water tiles of each row
      frequency: 0.25,
      clusterSize: 60, // Massive clusters for water
      colorTint: 0x4169E1 // Royal blue tint
    }
  ]
  
  constructor() {
    this.loadTerrainSheet()
    this.loadDecorationSheet()
  }

  private async loadTerrainSheet(): Promise<void> {
    try {
      console.log('🔄 Loading terrain sprite sheet...')
      this.terrainTexture = await Assets.load(import.meta.env.BASE_URL + 'sprites/terrain2_10x2.png')
      console.log('✅ Terrain sprite sheet loaded successfully!')
      console.log(`📊 Sheet contains ${this.totalTiles} tiles (${this.tilesPerRow}x${this.tilesPerColumn})`)
      console.log('🔍 Terrain texture dimensions:', this.terrainTexture.width, 'x', this.terrainTexture.height)
      
      // Calculate actual tile size based on texture dimensions
      const actualTileWidth = Math.floor(this.terrainTexture.width / this.tilesPerRow)
      const actualTileHeight = Math.floor(this.terrainTexture.height / this.tilesPerColumn)
      
      console.log('🔍 Calculated tile size:', actualTileWidth, 'x', actualTileHeight)
      
      // Update tile size if different from expected
      if (actualTileWidth !== this.actualTileSize || actualTileHeight !== this.actualTileSize) {
        console.log(`⚠️ Tile size mismatch! Expected ${this.actualTileSize}x${this.actualTileSize}, got ${actualTileWidth}x${actualTileHeight}`)
        console.log(`📏 Texture tiles are ${actualTileWidth}x${actualTileHeight}, will be scaled to ${this.tileSize}x${this.tileSize} for rendering`)
        // Update the actual tile size to match what we found
        this.actualTileSize = Math.min(actualTileWidth, actualTileHeight)
        console.log(`✅ Tiles will render at ${this.tileSize}x${this.tileSize} (scaled from ${this.actualTileSize}x${this.actualTileSize})`)
      }
    } catch (error) {
      console.error('❌ Failed to load terrain sprite sheet:', error)
      console.error('Error details:', error)
    }
  }

  private async loadDecorationSheet(): Promise<void> {
    try {
      console.log('🔄 Loading decoration sprite sheet...')
      this.decorationTexture = await Assets.load(import.meta.env.BASE_URL + 'sprites/terrain_decoration-10x6.png')
      console.log('✅ Decoration sprite sheet loaded successfully!')
      console.log(`📊 Sheet contains ${this.totalDecorationTiles} decoration tiles (${this.decorationTilesPerRow}x${this.decorationTilesPerColumn})`)
      console.log('🔍 Decoration texture dimensions:', this.decorationTexture.width, 'x', this.decorationTexture.height)
    } catch (error) {
      console.error('❌ Failed to load decoration sprite sheet:', error)
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
      console.warn(`⚠️ Invalid tile type: ${tileType}. Must be 0-${this.totalTiles - 1} (20 tiles total)`)
      return null
    }

    // Calculate the position of the tile in the sprite sheet
    const row = Math.floor(tileType / this.tilesPerRow)
    const col = tileType % this.tilesPerRow
    
    // Calculate tile position using actual texture tile size
    const tileX = col * this.actualTileSize
    const tileY = row * this.actualTileSize
    
    // Safety check: ensure the tile rectangle fits within the texture
    if (tileX + this.actualTileSize > this.terrainTexture.width || tileY + this.actualTileSize > this.terrainTexture.height) {
      console.warn(`⚠️ Tile ${tileType} (row ${row}, col ${col}) would exceed texture bounds!`)
      console.warn(`   Tile position: (${tileX}, ${tileY}) with size ${this.actualTileSize}x${this.actualTileSize}`)
      console.warn(`   Texture size: ${this.terrainTexture.width}x${this.terrainTexture.height}`)
      return null
    }
    
    // Create a texture rectangle for this specific tile
    const tileRect = new Rectangle(
      tileX,
      tileY,
      this.actualTileSize,
      this.actualTileSize
    )
    
    // Create a new texture from the rectangle
    const tileTexture = new Texture(this.terrainTexture.baseTexture, tileRect)
    
    // Create the sprite
    const sprite = new Sprite(tileTexture)
    sprite.x = x
    sprite.y = y
    sprite.anchor.set(0, 0) // Top-left anchor for tiles
    sprite.zIndex = -10000 // Ensure terrain renders underneath ALL other sprites with maximum priority
    sprite.alpha = 0.25 + Math.random() * 0.75 // Set terrain tiles to random opacity between 25% and 100%
    
    // Scale the sprite to render at the desired tile size (32x32)
    // The actual texture tile size is 32x32, so no scaling needed
    const scaleFactor = this.tileSize / this.actualTileSize // 32 / 32 = 1
    sprite.scale.set(scaleFactor, scaleFactor)
    
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
   * Create a decoration tile sprite from the decoration sprite sheet
   * @param tileType - The decoration tile type (0-59, where 0-9 are first row, 10-19 are second row, etc.)
   * @param x - World X coordinate
   * @param y - World Y coordinate
   * @returns DecorationTile object with sprite and metadata
   */
  createDecorationTile(tileType: number, x: number, y: number): DecorationTile | null {
    if (!this.decorationTexture || tileType < 0 || tileType >= this.totalDecorationTiles) {
      console.warn(`⚠️ Invalid decoration tile type: ${tileType}. Must be 0-${this.totalDecorationTiles - 1} (60 tiles total)`)
      return null
    }

    // Calculate the position of the tile in the sprite sheet
    const row = Math.floor(tileType / this.decorationTilesPerRow)
    const col = tileType % this.decorationTilesPerRow
    
    // Calculate tile position using actual texture tile size
    const tileX = col * this.actualTileSize
    const tileY = row * this.actualTileSize
    
    // Safety check: ensure the tile rectangle fits within the texture
    if (tileX + this.actualTileSize > this.decorationTexture.width || tileY + this.actualTileSize > this.decorationTexture.height) {
      console.warn(`⚠️ Decoration tile ${tileType} (row ${row}, col ${col}) would exceed texture bounds!`)
      return null
    }
    
    // Create a texture rectangle for this specific tile
    const tileRect = new Rectangle(
      tileX,
      tileY,
      this.actualTileSize,
      this.actualTileSize
    )
    
    // Create a new texture from the rectangle
    const tileTexture = new Texture(this.decorationTexture.baseTexture, tileRect)
    
    // Create the sprite
    const sprite = new Sprite(tileTexture)
    sprite.x = x
    sprite.y = y
    sprite.anchor.set(0, 0) // Top-left anchor for tiles
    sprite.zIndex = -5000 // Ensure decorations render above terrain but below other sprites
    sprite.alpha = 0.6 + Math.random() * 0.4 // Set decoration tiles to random opacity between 60% and 100%
    
    // Scale the sprite with random size variation for visual variety
    // Base scale factor for 32x32 tiles
    const baseScaleFactor = this.tileSize / this.actualTileSize // 32 / 32 = 1
    // Add random scaling between 1x and 4x
    const randomScaleMultiplier = 1 + Math.random() * 3 // Random value between 1 and 4
    const finalScaleFactor = baseScaleFactor * randomScaleMultiplier
    sprite.scale.set(finalScaleFactor, finalScaleFactor)
    
    return {
      sprite,
      tileType,
      x,
      y
    }
  }

  /**
   * Generate sparse decorations across the world
   * @param options - Terrain generation options
   * @returns Array of DecorationTile objects
   */
  generateSparseDecorations(options: TerrainGenerationOptions): DecorationTile[] {
    console.log('🌿 Generating sparse decorations...')
    
    const decorations: DecorationTile[] = []
    const decorationDensity = 0.02 // 2% of tiles will have decorations (very sparse)
    
    // Calculate grid dimensions
    const gridWidth = Math.ceil(options.worldWidth / options.tileSize)
    const gridHeight = Math.ceil(options.worldHeight / options.tileSize)
    
    console.log(`📊 Generating decorations for ${gridWidth}x${gridHeight} grid with ${decorationDensity * 100}% density`)
    
    // Create seeded random for consistent decoration placement
    const randomFn = this.createSeededRandom(options.biomeSeed ? options.biomeSeed + 1000 : undefined)
    
    // Place decorations sparsely
    for (let gridY = 0; gridY < gridHeight; gridY++) {
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        // Only place decoration if random check passes (sparse placement)
        if (randomFn() < decorationDensity) {
          // Random decoration tile type (0-59)
          const decorationType = Math.floor(randomFn() * this.totalDecorationTiles)
          
          // Calculate world position
          const worldX = gridX * options.tileSize
          const worldY = gridY * options.tileSize
          
          // Create decoration tile
          const decoration = this.createDecorationTile(decorationType, worldX, worldY)
          if (decoration) {
            decorations.push(decoration)
          }
        }
      }
    }
    
    console.log(`✅ Generated ${decorations.length} decoration tiles`)
    return decorations
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
    
    // Generate tile type map for cohesive tile clustering within biomes
    const tileTypeMap = this.generateTileTypeMap(gridWidth, gridHeight, biomeMap, biomes, options.biomeSeed)
    
    // Create terrain tiles
    for (let gridY = 0; gridY < gridHeight; gridY++) {
      for (let gridX = 0; gridX < gridWidth; gridX++) {
        const worldX = (gridX * options.tileSize) - (options.worldWidth / 2)
        const worldY = (gridY * options.tileSize) - (options.worldHeight / 2)
        
        // Check if we should place terrain here based on density
        if (densityMap[gridY][gridX] > Math.random()) {
          const biome = biomeMap[gridY][gridX]
          const tileType = tileTypeMap[gridY][gridX]
          
          const tile = this.createTerrainTile(tileType, worldX, worldY, biome.name)
          if (tile) {
            tiles.push(tile)
          }
        }
      }
    }
    
    console.log(`✅ Generated ${tiles.length} decorative terrain tiles`)
    console.log(`📊 Density map statistics: min=${Math.min(...densityMap.flat())}, max=${Math.max(...densityMap.flat())}, avg=${densityMap.flat().reduce((a, b) => a + b, 0) / densityMap.flat().length}`)
    console.log(`🎯 Terrain placement: ${tiles.length} tiles placed out of ${gridWidth * gridHeight} possible positions`)
    console.log(`🔍 Density settings: base=${options.terrainDensity}, threshold=0.4, grid=${gridWidth}x${gridHeight}`)
    
    // Debug: Show some density values
    const nonZeroDensities = densityMap.flat().filter(d => d > 0)
    console.log(`🔍 Non-zero density values: ${nonZeroDensities.length} out of ${densityMap.flat().length} (${(nonZeroDensities.length / densityMap.flat().length * 100).toFixed(1)}%)`)
    if (nonZeroDensities.length > 0) {
      console.log(`🔍 Density range: ${Math.min(...nonZeroDensities).toFixed(3)} to ${Math.max(...nonZeroDensities).toFixed(3)}`)
    }
    
    return tiles
  }

  /**
   * Generate a biome map using enhanced cellular automata for larger, more cohesive clusters
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
    
    // Apply ultra-enhanced cellular automata to create massive, spread-out clusters
    for (let iteration = 0; iteration < 8; iteration++) { // Many more iterations for massive clustering
      const newMap: BiomeType[][] = []
      
      for (let y = 0; y < height; y++) {
        newMap[y] = []
        for (let x = 0; x < width; x++) {
          const neighbors = this.getNeighborBiomes(biomeMap, x, y, width, height)
          const mostCommonBiome = this.getMostCommonBiome(neighbors)
          
          // Very high chance (90%) to become the most common neighbor biome for ultra-strong clustering
          if (seededRandom() < 0.9) {
            newMap[y][x] = mostCommonBiome
          } else {
            newMap[y][x] = biomeMap[y][x]
          }
        }
      }
      
      biomeMap.splice(0, biomeMap.length, ...newMap)
    }
    
    // Apply multiple smoothing passes for ultra-cohesive regions
    for (let iteration = 0; iteration < 4; iteration++) {
      const newMap: BiomeType[][] = []
      
      for (let y = 0; y < height; y++) {
        newMap[y] = []
        for (let x = 0; x < width; x++) {
          const neighbors = this.getNeighborBiomes(biomeMap, x, y, width, height)
          const mostCommonBiome = this.getMostCommonBiome(neighbors)
          
          // Extremely high chance (98%) for final ultra-smoothing
          if (seededRandom() < 0.98) {
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
   * Generate a density map for more natural terrain placement with larger open areas
   */
  private generateDensityMap(width: number, height: number, density: number): number[][] {
    const densityMap: number[][] = []
    
    for (let y = 0; y < height; y++) {
      densityMap[y] = []
      for (let x = 0; x < width; x++) {
        // Create ultra-natural variation in density using multiple noise layers
        const noise1 = this.simpleNoise(x * 0.03, y * 0.03) // Very large-scale variation
        const noise2 = this.simpleNoise(x * 0.08, y * 0.08) // Large-scale variation
        const noise3 = this.simpleNoise(x * 0.2, y * 0.2)   // Medium-scale variation
        
        // Combine noise layers for ultra-natural patterns with more dramatic variations
        const combinedNoise = (noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1)
        const adjustedDensity = density + (combinedNoise * 0.6) - 0.3
        
        // Create very dramatic density variations for much larger open areas
        const finalDensity = Math.max(0, Math.min(1, adjustedDensity))
        
        // Apply moderate threshold to ensure terrain placement while maintaining open areas
        const threshold = 0.4
        densityMap[y][x] = finalDensity > threshold ? finalDensity : 0
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
   * Generate a tile type map that creates cohesive clusters of similar tiles within biomes
   */
  private generateTileTypeMap(width: number, height: number, biomeMap: BiomeType[][], biomes: BiomeType[], seed?: number): number[][] {
    const tileTypeMap: number[][] = []
    const seededRandom = this.createSeededRandom(seed ? seed + 1000 : undefined) // Different seed for tile types
    
    // Initialize with random tile types based on biome
    for (let y = 0; y < height; y++) {
      tileTypeMap[y] = []
      for (let x = 0; x < width; x++) {
        const biome = biomeMap[y][x]
        tileTypeMap[y][x] = this.selectTileTypeForBiome(biome, biomes)
      }
    }
    
    // Apply ultra-strong cellular automata to cluster similar tiles within each biome
    for (let iteration = 0; iteration < 6; iteration++) { // More iterations for stronger clustering
      const newMap: number[][] = []
      
      for (let y = 0; y < height; y++) {
        newMap[y] = []
        for (let x = 0; x < width; x++) {
          const biome = biomeMap[y][x]
          const neighbors = this.getNeighborTileTypes(tileTypeMap, x, y, width, height, biomeMap)
          const mostCommonTileType = this.getMostCommonTileType(neighbors)
          
          // 90% chance to become the most common neighbor tile type for ultra-strong clustering
          if (seededRandom() < 0.9) {
            newMap[y][x] = mostCommonTileType
          } else {
            newMap[y][x] = tileTypeMap[y][x]
          }
        }
      }
      
      tileTypeMap.splice(0, tileTypeMap.length, ...newMap)
    }
    
    // Apply additional smoothing passes for ultra-cohesive tile regions
    for (let iteration = 0; iteration < 3; iteration++) {
      const newMap: number[][] = []
      
      for (let y = 0; y < height; y++) {
        newMap[y] = []
        for (let x = 0; x < width; x++) {
          const biome = biomeMap[y][x]
          const neighbors = this.getNeighborTileTypes(tileTypeMap, x, y, width, height, biomeMap)
          const mostCommonTileType = this.getMostCommonTileType(neighbors)
          
          // 95% chance for final tile smoothing
          if (seededRandom() < 0.95) {
            newMap[y][x] = mostCommonTileType
          } else {
            newMap[y][x] = tileTypeMap[y][x]
          }
        }
      }
      
      tileTypeMap.splice(0, tileTypeMap.length, ...newMap)
    }
    
    return tileTypeMap
  }

  /**
   * Get neighboring tile types within the same biome
   */
  private getNeighborTileTypes(tileTypeMap: number[][], x: number, y: number, width: number, height: number, biomeMap: BiomeType[][]): number[] {
    const neighbors: number[] = []
    const currentBiome = biomeMap[y][x]
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        
        const nx = x + dx
        const ny = y + dy
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // Only consider neighbors from the same biome
          if (biomeMap[ny][nx].name === currentBiome.name) {
            neighbors.push(tileTypeMap[ny][nx])
          }
        }
      }
    }
    
    return neighbors
  }

  /**
   * Get the most common tile type from a list
   */
  private getMostCommonTileType(tileTypes: number[]): number {
    if (tileTypes.length === 0) return 0
    
    const counts = new Map<number, number>()
    
    for (const tileType of tileTypes) {
      counts.set(tileType, (counts.get(tileType) || 0) + 1)
    }
    
    let mostCommon = tileTypes[0]
    let maxCount = 0
    
    for (const [tileType, count] of counts) {
      if (count > maxCount) {
        maxCount = count
        mostCommon = tileType
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