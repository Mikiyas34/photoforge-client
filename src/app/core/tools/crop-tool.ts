import { Canvas } from '../canvas';
import { Corner } from '../corner';
import { DraggableBehaviour } from '../draggable-behavior';
import { MouseDragEvent } from '../event';
import { fabric } from 'fabric';
import * as PIXI from 'pixi.js-legacy';
export class CropTool {
  type: string = 'cropTool';
  properties?: ICropToolProperties;
  cropCanvas?: PIXI.Application;
  corners: Corner[] = [];
  border?: PIXI.Graphics;
  trCorner?: PIXI.Graphics;
  mbCorner?: PIXI.Graphics;
  mrCorner?: PIXI.Graphics;
  mlCorner?: PIXI.Graphics;
  mtCorner?: PIXI.Graphics;
  blCorner?: PIXI.Graphics;
  brCorner?: PIXI.Graphics;
  tlCorner?: PIXI.Graphics;
  cropOverlay?: PIXI.Graphics;
  drawingSurface?: PIXI.Sprite;
  texture!: PIXI.RenderTexture;
  cropRect?: { x: number; y: number; width: number; height: number };
  configure(display: HTMLElement) {
    if (this.cropCanvas) {
      return;
    }
    this.cropCanvas = new PIXI.Application({
      resizeTo: display.parentElement!,
      background: 'transparent',
      backgroundAlpha: 0,
      antialias: true,
      resolution: 1,
    });
    this.cropRect = {
      x: 10,
      y: 10,
      width: this.cropCanvas.screen.width - 20,
      height: this.cropCanvas.screen.height - 20,
    };
    this.cropCanvas.stage.eventMode = 'static';
    this.createCropBorder(this.cropRect);
    (this.cropCanvas.view as any).classList.add('crop-canvas');
    display.parentElement?.appendChild(this.cropCanvas.view as any);

    this.texture = PIXI.RenderTexture.create({
      width: this.cropCanvas?.view.width,
      height: this.cropCanvas?.view.height,
    });
    this.drawingSurface = new PIXI.Sprite(this.texture);
    this.cropCanvas.stage.addChild(this.drawingSurface);
    this.drawingSurface.eventMode = 'static';
    this.createTopLeftCorner({ ...this.cropRect });
    this.createTopRightCorner({
      ...this.cropRect,
      x: this.cropRect.x + this.cropRect.width,
    });
    this.createBottomLeftCorner({
      x: this.cropRect.x,
      y: this.cropRect.y + this.cropRect.height - 30,
    });
    this.createBottomRightCorner({
      x: this.cropRect.x + this.cropRect.width - 26,
      y: this.cropRect.y + this.cropRect.height - 26,
    });
    this.createMiddleTopCorner({
      x: this.cropRect.x + this.cropRect.width / 2 - 30 / 2,
      y: this.cropRect.y,
    });
    this.createMiddleBottomCorner({
      x: this.cropRect.x + this.cropRect.width / 2 - 30 / 2,
      y: this.cropRect.y + this.cropRect.height,
    });
    this.createMiddleLeftCorner({
      x: this.cropRect.x,
      y: this.cropRect.height / 2,
    });
    this.createMiddleRightCorner({
      x: this.cropRect.x + this.cropRect.width,
      y: this.cropRect.height / 2,
    });

    this.createCropOverlay();
  }

  private createCropOverlay() {
    // this.cropOverlay = new PIXI.Graphics();
    // // this.cropOverlay.beginFill('#00000086');
    // this.cropOverlay.beginFill('blue');
    // this.cropOverlay.drawRect(
    //   0,
    //   0,
    //   this.cropCanvas!.screen.width,
    //   this.cropCanvas!.screen.height
    // );
    // this.cropOverlay.endFill();
    // this.cropCanvas?.stage.addChild(this.cropOverlay);
  }

  private createCropBorder(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    if (this.border) {
      this.cropCanvas?.stage.removeChild(this.border);
      this.border.destroy();
    }
    this.border = new PIXI.Graphics();
    this.border.zIndex = 2;
    this.border.lineStyle(3, '#fff');
    this.border.drawRoundedRect(rect.x, rect.y, rect.width, rect.height, 4);
    this.cropCanvas?.stage.addChild(this.border);
  }

  private createMiddleBottomCorner(pos: { x: number; y: number }) {
    if (this.mbCorner) {
      this.cropCanvas?.stage.removeChild(this.mbCorner);
      this.mbCorner.destroy();
    }
    this.mbCorner = new PIXI.Graphics();
    this.mbCorner.beginFill('#fff', 1);
    this.mbCorner.drawRoundedRect(0, 0, 30, 8, 5);
    this.mbCorner.position.set(pos.x, pos.y);
    this.mbCorner.endFill();
    this.mbCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.mbCorner);
    let mousedown = false;
    this.mbCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }

      this.cropRect = {
        x: this.cropRect!.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width,
        height: e.global.y,
      };
      this.mbCorner?.position.set(
        this.cropRect!.x + this.cropRect!.width / 2 - 30 / 2,
        e.global.y + 4
      );
      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.blCorner?.position.set(this.blCorner.position.x, e.global.y - 4);
      this.brCorner?.position.set(this.brCorner.position.x, e.global.y - 4);
      this.mlCorner?.position.set(
        this.mlCorner.position.x,
        this.cropRect!.height / 2
      );
      this.mrCorner?.position.set(
        this.mrCorner.position.x,
        this.cropRect!.height / 2
      );

      this.createCropBorder({
        ...this.cropRect,
        height: e.global.y,
      });
    });
  }

  private createMiddleRightCorner(pos: { x: number; y: number }) {
    if (this.mrCorner) {
      this.cropCanvas?.stage.removeChild(this.mrCorner);
      this.mrCorner.destroy();
    }
    this.mrCorner = new PIXI.Graphics();
    this.mrCorner.beginFill('#fff', 1);
    this.mrCorner.drawRoundedRect(0, 0, 8, 30, 5);
    this.mrCorner.position.set(pos.x - 4, pos.y - 4);
    this.mrCorner.endFill();
    this.mrCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.mrCorner);
    let mousedown = false;
    this.mrCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      this.cropRect = {
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.mrCorner?.position.set(e.global.x - 4, e.global.y - 23);
      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.tlCorner?.position.set(e.global.x - 4, this.cropRect!.y - 4);

      this.createCropBorder({
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      });
    });
  }

  private createMiddleLeftCorner(pos: { x: number; y: number }) {
    if (this.mlCorner) {
      this.cropCanvas?.stage.removeChild(this.mlCorner);
      this.mlCorner.destroy();
    }
    this.mlCorner = new PIXI.Graphics();
    this.mlCorner.zIndex = 2;

    this.mlCorner.beginFill('#fff', 1);
    this.mlCorner.drawRoundedRect(0, 0, 8, 30, 5);
    this.mlCorner.position.set(pos.x - 4, pos.y - 4);
    this.mlCorner.endFill();
    this.mlCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.mlCorner);
    let mousedown = false;
    this.mlCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      this.cropRect = {
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.mlCorner?.position.set(e.global.x - 4, e.global.y - 23);
      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.tlCorner?.position.set(e.global.x - 4, this.cropRect!.y - 4);

      this.createCropBorder({
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      });
    });
  }

  private createMiddleTopCorner(pos: { x: number; y: number }) {
    if (this.mtCorner) {
      this.cropCanvas?.stage.removeChild(this.mtCorner);
      this.mtCorner.destroy();
    }
    this.mtCorner = new PIXI.Graphics();
    this.mtCorner.beginFill('#fff', 1);
    this.mtCorner.drawRoundedRect(0, 0, 30, 8, 5);
    this.mtCorner.position.set(pos.x - 4, pos.y - 4);
    this.mtCorner.endFill();
    this.mtCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.mtCorner);
    let mousedown = false;
    this.mtCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      this.cropRect = {
        x: this.cropRect!.x,
        y: e.global.y,
        width: this.cropRect!.width,
        height: this.cropRect!.height - e.global.y,
      };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.cropRect = {
        x: this.cropRect!.x,
        y: e.global.y,
        width: this.cropRect!.width,
        height: this.cropRect!.height - e.global.y,
      };
      this.mtCorner?.position.set(this.mtCorner.position.x, e.global.y);

      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.tlCorner?.position.set(this.tlCorner.position.x, e.global.y - 4);
      this.trCorner?.position.set(this.trCorner.position.x, e.global.y - 4);
      this.mlCorner?.position.set(
        this.mlCorner.position.x,
        this.cropRect!.y + this.cropRect!.height / 2
      );
      this.mrCorner?.position.set(
        this.mrCorner.position.x,
        this.cropRect!.height / 2
      );

      this.createCropBorder({
        x: this.cropRect!.x,
        y: e.global.y,
        width: this.cropRect!.width,
        height: this.cropRect!.height - e.global.y,
      });
    });
  }

  private createBottomLeftCorner(pos: { x: number; y: number }) {
    if (this.blCorner) {
      this.cropCanvas?.stage.removeChild(this.blCorner);
      this.blCorner.destroy();
    }
    this.blCorner = new PIXI.Graphics();
    this.blCorner.zIndex = 3;
    this.blCorner.beginFill('#fff', 1);
    this.blCorner.drawRoundedRect(0, 0, 8, 30, 5);
    this.blCorner.drawRoundedRect(0, 23, 30, 8, 5);
    this.blCorner.position.set(pos.x - 4, pos.y - 4);
    this.blCorner.endFill();
    this.blCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.blCorner);
    let mousedown = false;
    this.blCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      this.cropRect = {
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.blCorner?.position.set(e.global.x - 4, e.global.y - 23);
      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.tlCorner?.position.set(e.global.x - 4, this.cropRect!.y - 4);

      this.createCropBorder({
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      });
    });
  }

  private createBottomRightCorner(pos: { x: number; y: number }) {
    if (this.brCorner) {
      this.cropCanvas?.stage.removeChild(this.brCorner);
      this.brCorner.destroy();
    }
    this.brCorner = new PIXI.Graphics();
    this.brCorner.beginFill('#fff', 1);
    this.brCorner.drawRoundedRect(23, 0, 8, 30, 5);
    this.brCorner.drawRoundedRect(0, 23, 30, 8, 5);
    this.brCorner.position.set(pos.x - 4, pos.y - 4);
    this.brCorner.endFill();
    this.brCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.brCorner);
    let mousedown = false;
    this.brCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      this.cropRect = {
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.brCorner?.position.set(e.global.x - 4, e.global.y - 23);
      // this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.tlCorner?.position.set(e.global.x - 4, this.cropRect!.y - 4);

      this.createCropBorder({
        x: e.global.x,
        y: this.cropRect!.y,
        width: this.cropRect!.width - e.global.x,
        height: e.global.y,
      });
    });
  }

  private createTopLeftCorner(pos: { x: number; y: number }) {
    if (this.tlCorner) {
      this.cropCanvas?.stage.removeChild(this.tlCorner);
      this.tlCorner.destroy();
    }
    this.tlCorner = new PIXI.Graphics();
    this.tlCorner.beginFill('#fff', 1);
    this.tlCorner.drawRoundedRect(0, 0, 30, 8, 5);
    this.tlCorner.drawRoundedRect(0, 0, 8, 30, 5);
    this.tlCorner.position.set(pos.x - 4, pos.y - 4);
    this.tlCorner.endFill();
    this.tlCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.tlCorner);
    let mousedown = false;
    this.tlCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      console.log(this.cropRect);
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      console.log(this.cropRect);
      this.tlCorner?.position.set(e.global.x - 4, e.global.y - 4);
      this.createCropBorder({
        x: e.global.x,
        y: e.global.y,
        width: this.cropRect!.width - e.global.x,
        height: this.cropRect!.height - e.global.y,
      });
      this.trCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.mrCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.mtCorner?.position.set(this.mtCorner.position.x, e.global.y - 4);
      this.mlCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.mbCorner?.position.set(this.cropRect!.width - 26, e.global.y - 4);
      this.blCorner?.position.set(e.global.x - 4, this.blCorner.position.y);
      // this.cropRect = {
      //   x: e.global.x,
      //   y: e.global.y,
      //   width: this.cropRect!.width - e.global.x,
      //   height: this.cropRect!.height - e.global.y,
      // };
    });
  }

  private createTopRightCorner(pos: { x: number; y: number }) {
    if (this.trCorner) {
      this.cropCanvas?.stage.removeChild(this.trCorner);
      this.trCorner.destroy();
    }

    this.trCorner = new PIXI.Graphics();
    this.trCorner.beginFill('#fff', 1);
    this.trCorner.drawRoundedRect(0, 0, 30, 8, 5);
    this.trCorner.drawRoundedRect(23, 0, 8, 30, 5);
    this.trCorner.position.set(pos.x - 26, pos.y - 4);
    this.trCorner.endFill();
    this.trCorner.eventMode = 'static';
    this.cropCanvas?.stage.addChild(this.trCorner);
    let mousedown = false;

    this.trCorner?.addEventListener('mousedown', (e) => {
      mousedown = true;
    });
    this.cropCanvas?.stage.addEventListener('mouseup', (e) => {
      mousedown = false;
      // this.cropRect = {
      //   x: this.cropRect!.x,
      //   y: this.trCorner!.position.y,
      //   width: this.trCorner!.position.x,
      //   height: this.cropRect!.height,
      // };
    });
    this.cropCanvas?.stage.addEventListener('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      this.trCorner?.position.set(e.global.x, e.global.y - 4);
      this.tlCorner?.position.set(this.cropRect!.x - 4, e.global.y - 4);
      this.createCropBorder({
        x: this.cropRect!.x,
        y: e.global.y,
        width: e.global.x,
        height: this.cropRect!.height - e.global.y,
      });
    });
  }

  disconfigure(display: HTMLElement): void {
    this.cropCanvas?.destroy(true);
    delete this.cropCanvas;
  }
  straiten() {}
  clear() {}
  complite() {}
  cancel() {}
  rearrange() {}
  render(display: HTMLElement) {}
  placeCorners() {}
}

export const cropTool = new CropTool();

interface ICropToolProperties {
  height?: number;
  resolution?: number;
  unit?: string;
  deleteCropedPixels?: boolean;
}
