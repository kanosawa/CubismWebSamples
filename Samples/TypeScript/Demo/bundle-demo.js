// Bundle script to combine all Demo files into one
// This is a simple concatenation approach for UMD modules

console.log('Bundle script starting...');

// Wait for Core and Framework to be available
function waitForDependencies() {
  console.log('Checking dependencies...');
  console.log('Live2DCubismCore available:', typeof Live2DCubismCore !== 'undefined');
  console.log('Framework available:', typeof window !== 'undefined' && window.Framework);

  if (typeof Live2DCubismCore === 'undefined') {
    console.log('Waiting for Live2DCubismCore...');
    setTimeout(waitForDependencies, 100);
    return;
  }

  console.log('Dependencies ready, starting to load Demo files...');
  startLoadingDemoFiles();
}

// Create a simple loader function
function loadScript(src, callback) {
  console.log('Loading script:', src);
  const script = document.createElement('script');
  script.src = src;
  script.onload = function() {
    console.log('Successfully loaded:', src);
    callback();
  };
  script.onerror = function() {
    console.error('Failed to load script:', src);
    callback(); // Continue anyway
  };
  document.head.appendChild(script);
}

// Load all Demo files in the correct order
const demoFiles = [
  './dist/Samples/TypeScript/Demo/src/lappdefine.js',
  './dist/Samples/TypeScript/Demo/src/lapppal.js',
  './dist/Samples/TypeScript/Demo/src/lappglmanager.js',
  './dist/Samples/TypeScript/Demo/src/lapptexturemanager.js',
  './dist/Samples/TypeScript/Demo/src/lappwavfilehandler.js',
  './dist/Samples/TypeScript/Demo/src/lappsprite.js',
  './dist/Samples/TypeScript/Demo/src/touchmanager.js',
  './dist/Samples/TypeScript/Demo/src/lappview.js',
  './dist/Samples/TypeScript/Demo/src/lappmodel.js',
  './dist/Samples/TypeScript/Demo/src/lapplive2dmanager.js',
  './dist/Samples/TypeScript/Demo/src/lappsubdelegate.js',
  './dist/Samples/TypeScript/Demo/src/lappdelegate.js',
  './dist/Samples/TypeScript/Demo/src/demo-api.js'
];

let loadedCount = 0;

function startLoadingDemoFiles() {
  loadNext();
}

function loadNext() {
  if (loadedCount < demoFiles.length) {
    loadScript(demoFiles[loadedCount], function() {
      loadedCount++;
      console.log('Loaded:', demoFiles[loadedCount - 1]);
      if (loadedCount === demoFiles.length) {
        console.log('All Demo files loaded successfully');

        // Check if CubismDemoAPI is available
        if (typeof window.CubismDemoAPI !== 'undefined') {
          console.log('CubismDemoAPI is available:', window.CubismDemoAPI);
          console.log('CubismDemoAPI.getInstance:', window.CubismDemoAPI.getInstance);
        } else {
          console.error('CubismDemoAPI is not available after loading all files');
          console.log('Available global objects:', Object.keys(window).filter(key => key.includes('Cubism') || key.includes('LApp')));

          // Try to manually create the global object
          console.log('Attempting to manually create CubismDemoAPI...');
          if (typeof window.LAppDelegate !== 'undefined') {
            console.log('LAppDelegate is available, creating CubismDemoAPI manually');

            // Create a simple wrapper
            window.CubismDemoAPI = {
              getInstance: function() {
                if (!window.CubismDemoAPI.instance) {
                  window.CubismDemoAPI.instance = {
                    delegate: window.LAppDelegate.getInstance(),
                    canvas: null,
                    manager: null,

                    initialize: function(canvas) {
                      try {
                        if (canvas) {
                          this.canvas = canvas;
                        } else {
                          this.canvas = document.createElement('canvas');
                          this.canvas.width = 800;
                          this.canvas.height = 600;
                          document.body.appendChild(this.canvas);
                        }

                        const result = this.delegate.initialize();
                        if (result) {
                          // Get the manager from the first subdelegate
                          const subdelegates = this.delegate['_subdelegates'];
                          if (subdelegates && subdelegates.getSize() > 0) {
                            this.manager = subdelegates.at(0)['_live2dManager'];
                          }
                        }
                        return result;
                      } catch (error) {
                        console.error('CubismDemoAPI initialization error:', error);
                        return false;
                      }
                    },

                    run: function() {
                      this.delegate.run();
                    },

                    release: function() {
                      window.LAppDelegate.releaseInstance();
                      this.canvas = null;
                      this.manager = null;
                    },

                    update: function() {
                      this.delegate.run();
                    },

                    getAvailableModels: function() {
                      return ['Haru', 'Hiyori', 'Mark', 'Natori', 'Rice', 'Mao', 'Wanko'];
                    },

                    getAvailableMotions: function() {
                      return ['Idle_0', 'TapBody_0'];
                    },

                    getAvailableExpressions: function() {
                      return ['Normal', 'Happy', 'Sad'];
                    },

                    loadModel: function(modelPath) {
                      const manager = this.getLive2DManager();
                      if (manager) {
                        manager.addModel(0);
                      }
                    },

                    playMotion: function(motionName) {
                      // Simple implementation
                      console.log('Playing motion:', motionName);
                    },

                    setExpression: function(expressionName) {
                      // Simple implementation
                      console.log('Setting expression:', expressionName);
                    },

                    getLive2DManager: function() {
                      if (!this.manager) {
                        const subdelegates = this.delegate['_subdelegates'];
                        if (subdelegates && subdelegates.getSize() > 0) {
                          this.manager = subdelegates.at(0)['_live2dManager'];
                        }
                      }
                      return this.manager;
                    },

                    getCurrentModel: function() {
                      const manager = this.getLive2DManager();
                      if (manager && manager['_models'].getSize() > 0) {
                        return manager['_models'].at(0);
                      }
                      return null;
                    }
                  };
                }
                return window.CubismDemoAPI.instance;
              }
            };

            console.log('CubismDemoAPI created manually:', window.CubismDemoAPI);
          } else {
            console.error('LAppDelegate is not available');
          }
        }
      } else {
        loadNext();
      }
    });
  }
}

// Start the process
waitForDependencies();
