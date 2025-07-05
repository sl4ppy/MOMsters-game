# 🧪 MOMsters Game Test Harness

A comprehensive testing suite designed to validate the build process, deployment, and live functionality of the MOMsters game on GitHub Pages.

## 🎯 Overview

This test harness was created to address the deployment and caching issues we experienced during development. It provides automated validation across multiple layers:

1. **Build Validation** - Ensures the game builds correctly with proper assets
2. **Deployment Validation** - Tests GitHub Pages deployment and asset accessibility
3. **Integration Testing** - Validates the live game functionality using browser automation

## 🚀 Quick Start

```bash
# Install test dependencies
npm install

# Run all tests
npm run test:all

# Run quick validation (build only)
npm run test --quick

# Run specific test suite
npm run test:build
npm run test:deployment
npm run test:integration
```

## 🚀 What's New in Testing
- **ECS & Event System**: Test entity-component-system and event-driven logic
- **Advanced UI**: Test settings menu, pause screen, HUD, mute button
- **Audio System**: Test SFX, music, fallback tones, mute-by-default (press 'M' or click speaker to unmute)
- **Save/Load**: Test localStorage saves, settings, export/import
- **Performance Monitor**: Test FPS, memory, CPU, auto-optimize
- **Particle System**: Test explosions, sparkles, trails, magic
- **Advanced AI & Items**: Test enemy behaviors, inventory, power-ups

## 🔊 Audio Testing
- **Audio is muted by default** for new users and on reset
- To test audio: Unmute with the HUD speaker button or press 'M'
- Test SFX by attacking, picking up XP, leveling up, etc.
- Test music and volume controls in the settings menu

## 🧪 UI & System Testing
- Open settings (S) and pause (ESC) menus
- Adjust audio, graphics, controls, and gameplay settings
- Test mute/unmute, tooltips, and notifications
- Check HUD stats block for correct info and no overlap

## 📋 Test Suites

### 1. Build Validation (`npm run test:build`)

**Purpose**: Validates the build process and generated artifacts

**Tests Include**:
- ✅ Build process completion
- ✅ Distribution folder structure
- ✅ HTML content validation (title, cache-busting headers)
- ✅ Asset path correctness (`/MOMsters/assets/...`)
- ✅ JavaScript file validity and size
- ✅ Cache-busting implementation
- ✅ Configuration consistency

**Duration**: ~30-60 seconds

### 2. Deployment Validation (`npm run test:deployment`)

**Purpose**: Tests the GitHub Pages deployment process and live site accessibility

**Tests Include**:
- ✅ Deployment process execution
- ✅ Site propagation and availability
- ✅ Live HTML content validation
- ✅ Asset accessibility (no 404s)
- ✅ HTTP headers validation
- ✅ Old asset cleanup verification

**Duration**: ~2-5 minutes (includes deployment time)

### 3. Integration Testing (`npm run test:integration`)

**Purpose**: Validates live game functionality using browser automation

**Tests Include**:
- ✅ Game page loading
- ✅ PIXI.js initialization
- ✅ Canvas creation and rendering
- ✅ Title screen interaction
- ✅ Keyboard input testing (WASD, arrows, numbers)
- ✅ Performance metrics
- ✅ Responsive design validation

**Duration**: ~1-3 minutes

## 🛠️ Command Options

### Test Runner Options

```bash
# Show help
npm run test --help

# Run only specific tests
npm run test --build-only
npm run test --deployment-only
npm run test --integration-only

# Skip specific tests
npm run test --skip-build
npm run test --skip-deployment
npm run test --skip-integration

# Quick validation (fastest)
npm run test --quick
```

### Individual Test Commands

```bash
npm run test:build        # Build validation only
npm run test:deployment   # Deployment validation only
npm run test:integration  # Integration tests only
npm run test:all         # All tests in sequence
```

## 📊 Understanding Test Results

### Success Indicators

- ✅ **Green checkmarks**: Test passed
- ⚠️ **Yellow warnings**: Test passed with warnings
- ❌ **Red X marks**: Test failed

### Exit Codes

- `0`: All tests passed
- `1`: Critical tests failed (build or deployment)
- Integration test failures don't cause overall failure (non-critical)

### Sample Output

```
🧪 MOMsters Game Test Harness

🔧 Test Configuration:
  Mode: Full test suite

🚀 Starting comprehensive test suite...

=== Build Process Validation ===
ℹ Cleaning existing build...
ℹ Running build process...
✓ Build process completed successfully

=== Distribution Folder Structure ===
✓ dist/ folder exists
✓ dist/index.html exists
✓ dist/assets/ folder exists
✓ Found 1 JavaScript file(s): main-fEbiOgLI-1751250088671.js

📊 Overall Test Results
✓ build: PASSED
✓ deployment: PASSED
✓ integration: PASSED

=== Final Summary ===
✓ Passed: 3
✗ Failed: 0
⊘ Skipped: 0
⏱ Total time: 145s

🎉 All tests passed! Your game is ready for deployment!
```

## 🔧 Continuous Integration

The test harness integrates with GitHub Actions to automatically validate deployments:

### Workflow Triggers

- **Push to master**: Runs all tests including deployment
- **Pull requests**: Runs build validation only
- **Manual trigger**: Available in GitHub Actions tab

### Workflow Jobs

1. **Build Validation**: Always runs, validates build process
2. **Deployment Validation**: Only on master push, tests live deployment
3. **Integration Testing**: After deployment, validates game functionality
4. **Test Summary**: Provides comprehensive results summary

## 🐛 Troubleshooting

### Common Issues

#### Build Tests Fail

```bash
# Check build manually
npm run build

# Clean and retry
rm -rf dist node_modules
npm install
npm run test:build
```

#### Deployment Tests Fail

- Check GitHub Pages settings in repository
- Verify gh-pages branch exists
- Ensure proper permissions in GitHub Actions

#### Integration Tests Fail

- Check if site is accessible manually
- Verify no JavaScript errors in browser console
- Try running tests locally:

```bash
# Install Chrome dependencies (Linux)
sudo apt-get install chromium-browser

# Run integration tests
npm run test:integration
```

### Test Dependencies

```bash
# Required dependencies
npm install --save-dev puppeteer node-fetch chalk

# Optional: Update dependencies
npm update
```

## 📁 File Structure

```
tests/
├── README.md                 # This file
├── utils.js                  # Shared utilities and logger
├── build-validator.js        # Build process validation
├── deployment-validator.js   # Deployment validation
├── integration-tests.js      # Browser automation tests
└── test-runner.js           # Main test orchestrator
```

## 🎯 Best Practices

### When to Run Tests

- **Before committing**: `npm run test --quick`
- **Before deploying**: `npm run test:all`
- **After changes**: Relevant test suite only
- **CI/CD**: Automated on every push

### Test Maintenance

- Update test URLs if repository changes
- Adjust timeouts for slower environments
- Keep test dependencies updated
- Monitor test performance and optimize

## 🔮 Future Enhancements

Potential improvements for the test harness:

- **Visual regression testing**: Screenshot comparison
- **Performance benchmarking**: Frame rate and memory tracking
- **Cross-browser testing**: Firefox, Safari, Edge
- **Mobile device testing**: Real device simulation
- **Accessibility testing**: WCAG compliance validation
- **Load testing**: Multiple concurrent users

## 📞 Support

If you encounter issues with the test harness:

1. Check this README for troubleshooting steps
2. Review test output for specific error messages
3. Verify all dependencies are installed correctly
4. Ensure GitHub Pages is properly configured

The test harness is designed to be robust and provide clear feedback about any issues with the game deployment process. 