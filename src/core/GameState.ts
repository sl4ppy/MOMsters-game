export class GameState {
  private _level: number = 1;
  private _experience: number = 0;
  private _experienceToNextLevel: number = 100;
  private _score: number = 0;
  private _time: number = 0;
  private _enemiesKilled: number = 0;

  constructor() {
    // Initialize game state
  }

  update(deltaTime: number): void {
    console.warn('GameState: Updating state...');
    // Update game time (deltaTime is in seconds)
    this._time += deltaTime / 60; // Convert to seconds
    console.warn('GameState: State updated successfully');
  }

  addExperience(amount: number): boolean {
    this._experience += amount;

    // Check for level up
    if (this._experience >= this._experienceToNextLevel) {
      this.levelUp();
      return true;
    }

    return false;
  }

  private levelUp(): void {
    this._level++;
    this._experience -= this._experienceToNextLevel;
    this._experienceToNextLevel = Math.floor(this._experienceToNextLevel * 1.2);

    console.log(`Level up! Now level ${this._level}`);
  }

  addScore(points: number): void {
    this._score += points;
  }

  incrementEnemiesKilled(): void {
    this._enemiesKilled++;
  }

  // Getters
  get level(): number {
    return this._level;
  }
  get experience(): number {
    return this._experience;
  }
  get experienceToNextLevel(): number {
    return this._experienceToNextLevel;
  }
  get score(): number {
    return this._score;
  }
  get time(): number {
    return this._time;
  }
  get enemiesKilled(): number {
    return this._enemiesKilled;
  }

  // Progress percentage for UI
  get experienceProgress(): number {
    return this._experience / this._experienceToNextLevel;
  }
}
