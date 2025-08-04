/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppDelegate } from './lappdelegate';
import { LAppModel } from './lappmodel';
import { LAppLive2DManager } from './lapplive2dmanager';
import { LAppView } from './lappview';
import * as LAppDefine from './lappdefine';
import { LAppPal } from './lapppal';

// Demo API for external JavaScript usage
export class CubismDemoAPI {
  private static instance: CubismDemoAPI;
  private delegate: LAppDelegate;
  private manager: LAppLive2DManager;
  private canvas: HTMLCanvasElement | null = null;
  private _frameCount: number = 0; // デバッグ用フレームカウンタ

  private constructor() {
    this.delegate = LAppDelegate.getInstance();
  }

  public static getInstance(): CubismDemoAPI {
    if (!CubismDemoAPI.instance) {
      CubismDemoAPI.instance = new CubismDemoAPI();
    }
    return CubismDemoAPI.instance;
  }

  /**
   * Initialize the Live2D application with a specific canvas
   * @param canvas The canvas element to use for rendering
   * @returns true if initialization was successful
   */
  public initialize(canvas?: HTMLCanvasElement): boolean {
    try {
      // If canvas is provided, use it; otherwise create a default one
      if (canvas) {
        this.canvas = canvas;
      } else {
        // Create a default canvas if none provided
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        document.body.appendChild(this.canvas);
      }

      // Check WebGL context
      const gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
      if (!gl) {
        console.error('WebGL not supported');
        return false;
      }
      console.log('WebGL context created successfully');
      console.log('Canvas size:', this.canvas.width, 'x', this.canvas.height);

      // Initialize the delegate
      const result = this.delegate.initialize();

      if (result) {
        // Replace the auto-created canvas with our custom canvas
        this.replaceCanvas();

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
  }

  /**
   * Replace the auto-created canvas with our custom canvas
   */
  private replaceCanvas(): void {
    if (!this.canvas) return;

    try {
      console.log('Replacing canvas...');
      console.log('Custom canvas:', this.canvas);

      // Get the canvases from the delegate
      const canvases = this.delegate['_canvases'];
      console.log('Delegate canvases:', canvases);

      if (canvases && canvases.getSize() > 0) {
        // Remove the auto-created canvas from DOM
        const autoCanvas = canvases.at(0);
        console.log('Auto-created canvas:', autoCanvas);

        if (autoCanvas && autoCanvas.parentNode) {
          autoCanvas.parentNode.removeChild(autoCanvas);
          console.log('Auto-created canvas removed from DOM');
        }

        // Replace with our custom canvas
        canvases.set(0, this.canvas);
        console.log('Canvas replaced in delegate');

        // Update the subdelegate to use the new canvas
        const subdelegates = this.delegate['_subdelegates'];
        console.log('Subdelegates:', subdelegates);

        if (subdelegates && subdelegates.getSize() > 0) {
          const subdelegate = subdelegates.at(0);
          console.log('Subdelegate:', subdelegate);

          if (subdelegate && subdelegate['_view']) {
            // Update the view's canvas reference using bracket notation
            const view = subdelegate['_view'] as any;
            console.log('View before update:', view);

            if (view && view._canvas !== undefined) {
              view._canvas = this.canvas;
              console.log('Canvas updated in view');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error replacing canvas:', error);
    }
  }

  /**
   * Start the Live2D application
   */
  public run(): void {
    this.delegate.run();
  }

  /**
   * Release resources
   */
  public release(): void {
    LAppDelegate.releaseInstance();
    this.canvas = null;
    this.manager = null;
  }

  /**
   * Get the Live2D manager
   */
  public getLive2DManager(): LAppLive2DManager {
    if (!this.manager) {
      const subdelegates = this.delegate['_subdelegates'];
      if (subdelegates && subdelegates.getSize() > 0) {
        this.manager = subdelegates.at(0)['_live2dManager'];
      }
    }
    return this.manager;
  }

  /**
   * Get the current model
   */
  public getCurrentModel(): LAppModel | null {
    const manager = this.getLive2DManager();
    if (manager && manager['_models'].getSize() > 0) {
      return manager['_models'].at(0);
    }
    return null;
  }

  /**
   * Load a model
   * @param modelPath Path to the model file
   */
  public async loadModel(modelPath: string): Promise<void> {
    const manager = this.getLive2DManager();
    if (manager) {
      // Find the model index based on the model path
      const modelIndex = LAppDefine.ModelDir.indexOf(modelPath);
      if (modelIndex >= 0) {
        // Add model to the current scene
        manager.addModel(modelIndex);
        console.log(`Loading model: ${modelPath} (index: ${modelIndex})`);

        // Wait for the model to be fully loaded
        await this.waitForModelLoad();
      } else {
        console.warn(`Model not found: ${modelPath}`);
      }
    }
  }

  /**
   * Wait for the current model to be fully loaded
   */
  private async waitForModelLoad(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 100; // 10秒間待機

      const checkModel = () => {
        attempts++;
        const model = this.getCurrentModel();

        console.log(`Model load check attempt ${attempts}:`, {
          model: model ? 'exists' : 'null',
          modelSetting: model && model['_modelSetting'] ? 'exists' : 'null',
          modelMatrix: model && model['_modelMatrix'] ? 'exists' : 'null'
        });

        if (model && model['_modelSetting']) {
          console.log('Model loaded successfully');
          console.log('Model setting:', model['_modelSetting']);
          resolve();
        } else if (attempts >= maxAttempts) {
          console.warn('Model load timeout after 10 seconds');
          resolve(); // タイムアウトでも続行
        } else {
          setTimeout(checkModel, 100);
        }
      };
      checkModel();
    });
  }

  /**
   * Play a motion
   * @param motionName Name of the motion to play
   */
  public playMotion(motionName: string): void {
    const model = this.getCurrentModel();
    if (model) {
      // Parse motion name (e.g., "Idle_0" -> group="Idle", no=0)
      const parts = motionName.split('_');
      if (parts.length >= 2) {
        const group = parts[0];
        const no = parseInt(parts[1]) || 0;
        model.startMotion(group, no, LAppDefine.PriorityNormal);
      }
    }
  }

  /**
   * Set an expression
   * @param expressionName Name of the expression to set
   */
  public setExpression(expressionName: string): void {
    const model = this.getCurrentModel();
    if (model) {
      model.setExpression(expressionName);
    }
  }

  /**
   * Update the view (call this in your render loop)
   */
  public update(): void {
    // デバッグ情報を追加
    const model = this.getCurrentModel();
    if (model) {
      const modelMatrix = model['_modelMatrix'];
      const modelSetting = model['_modelSetting'];

      // 100フレームごとにログ出力
      if (!this._frameCount) this._frameCount = 0;
      this._frameCount++;

      if (this._frameCount % 100 === 0) {
        console.log(`Update frame ${this._frameCount}:`, {
          model: model ? 'exists' : 'null',
          modelMatrix: modelMatrix ? 'exists' : 'null',
          modelSetting: modelSetting ? 'exists' : 'null',
          canvas: this.canvas ? 'exists' : 'null',
          canvasWidth: this.canvas?.width,
          canvasHeight: this.canvas?.height,
          canvasContext: this.canvas?.getContext('webgl') ? 'exists' : 'null'
        });

        // モデルの詳細情報も確認
        if (modelMatrix) {
          console.log('Model matrix:', {
            x: modelMatrix.getTranslateX(),
            y: modelMatrix.getTranslateY(),
            scale: modelMatrix.getScaleX()
          });
        }

        // モデルの詳細状態を確認
        if (model) {
          const modelSetting = model['_modelSetting'];
          const modelMatrix = model['_modelMatrix'];
          const renderer = model.getRenderer() as any;
          const textures = renderer ? renderer._textures : null;
          const motions = (model as any)['_motions'];

          console.log('Model details:', {
            modelSetting: modelSetting ? 'exists' : 'null',
            modelMatrix: modelMatrix ? 'exists' : 'null',
            textures: textures ? `count: ${textures.getSize()}` : 'null',
            motions: motions ? `count: ${motions.getSize()}` : 'null'
          });

          // テクスチャの詳細情報を確認
          if (textures) {
            console.log('Textures loaded:', textures.getSize());
            for (let i = 0; i < textures.getSize(); i++) {
              const textureId = textures.getValue(i);
              console.log(`Texture ${i}: ID = ${textureId}`);
            }
          } else {
            console.log('No textures loaded');

            // モデルの内部状態を確認
            console.log('Model internal state:', {
              _textureCount: (model as any)._textureCount,
              _state: (model as any)._state,
              renderer: renderer ? 'exists' : 'null'
            });
          }

          // モデル設定からテクスチャパスを確認
          if (modelSetting) {
            const textureCount = modelSetting.getTextureCount();
            console.log('Model setting texture count:', textureCount);
            for (let i = 0; i < textureCount; i++) {
              const texturePath = modelSetting.getTextureFileName(i);
              console.log(`Texture path ${i}:`, texturePath);
            }
          }
        }
      }
    }

    // 直接レンダリング処理を実行
    LAppPal.updateTime();

    for (let i = 0; i < this.delegate['_subdelegates'].getSize(); i++) {
      this.delegate['_subdelegates'].at(i).update();
    }
  }

  /**
   * Get available models
   */
  public getAvailableModels(): string[] {
    return LAppDefine.ModelDir;
  }

  /**
   * Get available motions for current model
   */
  public getAvailableMotions(): string[] {
    const model = this.getCurrentModel();
    if (model && model['_modelSetting']) {
      const motions: string[] = [];
      const setting = model['_modelSetting'];

      // Get motion groups
      const groupCount = setting.getMotionGroupCount();
      for (let i = 0; i < groupCount; i++) {
        const groupName = setting.getMotionGroupName(i);
        if (groupName) {
          const motionCount = setting.getMotionCount(groupName);
          for (let j = 0; j < motionCount; j++) {
            motions.push(`${groupName}_${j}`);
          }
        }
      }
      return motions;
    }
    return [];
  }

  /**
   * Get available expressions for current model
   */
  public getAvailableExpressions(): string[] {
    const model = this.getCurrentModel();
    if (model && model['_modelSetting']) {
      const expressions: string[] = [];
      const setting = model['_modelSetting'];

      // Get expressions
      const expressionCount = setting.getExpressionCount();
      for (let i = 0; i < expressionCount; i++) {
        const expressionName = setting.getExpressionName(i);
        if (expressionName) {
          expressions.push(expressionName);
        }
      }
      return expressions;
    }
    return [];
  }
}

// Export individual classes for advanced usage
export { LAppDelegate } from './lappdelegate';
export { LAppModel } from './lappmodel';
export { LAppLive2DManager } from './lapplive2dmanager';
export { LAppView } from './lappview';
export * as LAppDefine from './lappdefine';
