import { Canvas } from '../../canvas';
import { ContextMenu, Menu } from '../../context-menu';
import { MouseDragEvent } from '../../event';
import { Layer } from '../../layers/layer';
import { PixelLayer } from '../../layers/pixel-layer';
import { DataService } from '../../services/data.service';
import * as PIXI from 'pixi.js-legacy';
import { AdjustmentFilter } from '@pixi/filter-adjustment';
import { SelectionContextMenu } from './selection-context-menu';
import { Selection } from '../../selection';
import { Mask } from '../..';
import { Renderer2 } from '@angular/core';
class ReactangularSelect {
  properites?: IRectangularProperties;
  contextMenu?: ContextMenu;
  readonly type: string = 'rectangularSelectTool';
  selectionCanvas?: PIXI.Application;
  selectionRect?: PIXI.Graphics;
  selection?: Selection;
  selectionRectPos!: { x: number; y: number; width: number; height: number };
  texture!: PIXI.RenderTexture;
  drawingSurface!: PIXI.Sprite;
  configure(
    display: HTMLElement,
    data: DataService,
    renderer: Renderer2
  ): void {
    this.selectionRectPos = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.selectionCanvas = new PIXI.Application({
      resizeTo: display.parentElement?.parentElement!,
      antialias: true,
      resolution: 1,
      background: 'transparent',
      backgroundAlpha: 0,
    });
    this.texture = PIXI.RenderTexture.create({
      width: this.selectionCanvas.screen.width,
      height: this.selectionCanvas.screen.height,
    });
    this.drawingSurface = new PIXI.Sprite(this.texture);
    this.selectionCanvas.stage.addChild(this.drawingSurface);

    this.drawingSurface.eventMode = 'static';
    this.selectionCanvas.stage.eventMode = 'static';
    let mousedown = false;
    this.selectionRect = new PIXI.Graphics();

    this.drawingSurface.on('mousedown', (e) => {
      if (!this.selectionRect) {
        this.selectionRect = new PIXI.Graphics();
      }
      this.selection?.clear();
      data.contextMenu.next({});
      const currentSelection = data.currentSelection.getValue();
      if (currentSelection) {
        currentSelection.view?.remove();
        data.currentSelection.next(null);
      }
      // this.clearCanvas();
      mousedown = true;
      this.selectionRectPos.x = e.global.x;
      this.selectionRectPos.y = e.global.y;
    });
    this.selectionCanvas.stage.on('mousemove', (e) => {
      if (!mousedown) {
        return;
      }
      if (!this.selectionRect) {
        this.selectionRect = new PIXI.Graphics();
      }
      this.selectionRect.clear();
      this.selectionRect?.lineStyle({ color: '#717171', width: 2 });
      this.selectionRect?.drawRect(
        this.selectionRectPos.x,
        this.selectionRectPos.y,
        e.global.x - this.selectionRectPos.x,
        e.global.y - this.selectionRectPos.y
      );

      this.selectionCanvas?.renderer.render(this.selectionRect!, {
        renderTexture: this.texture,
        clear: true,
      });
    });
    this.drawingSurface.on('mouseup', (e) => {
      mousedown = false;
      this.selectionRectPos = {
        x: this.selectionRectPos.x,
        y: this.selectionRectPos.y,
        width: e.global.x - this.selectionRectPos.x,
        height: e.global.y - this.selectionRectPos.y,
      };
    });
    (this.selectionCanvas.view as any).classList.add('selection-canvas');
    display.parentElement?.appendChild(this.selectionCanvas.view as any);
    this.registerListeners(data, display);
  }

  layerViaCopy() {}

  private registerListeners(data: DataService, display: HTMLElement) {
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Enter':
          this.clearCanvas();

          const points: number[] = [
            this.selectionRectPos.x,
            this.selectionRectPos.y,
            this.selectionRectPos.x + this.selectionRectPos.width,
            this.selectionRectPos.y,
            //second corner
            //third corner
            // ...splitLineIntoSegments(
            this.selectionRectPos.x + this.selectionRectPos.width,
            this.selectionRectPos.y + this.selectionRectPos.height,
            //fourth corner
            this.selectionRectPos.x,
            this.selectionRectPos.y + this.selectionRectPos.height,

            // ),
            //last and fifth corner
            this.selectionRectPos.x,
            this.selectionRectPos.y,
          ];
          const selection = new Selection({
            container: display.parentElement?.parentElement || undefined,
          });
          selection.addFromPoints(points);
          data.currentSelection.next(selection);
          data.selectedToolGroup.next('move');
          break;
      }
    });
  }
  private clearCanvas() {
    const emptyTexture = PIXI.Sprite.from(PIXI.Texture.EMPTY);
    this.selectionCanvas?.renderer.render(emptyTexture, {
      renderTexture: this.texture,
      clear: true,
    });
  }

  setUpContextMenu(display: HTMLElement, x: number, y: number) {
    this.contextMenu = new SelectionContextMenu(display.parentElement!, x, y);
  }
  disconfigure(display: HTMLElement): void {
    this.selectionCanvas?.destroy(true);
    delete this.selectionCanvas;
    // this.data.contextMenu.next({});
  }
}

export function splitLineIntoSegments(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  len: number
) {
  // Calculate the length of the line using the Pythagorean theorem
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lineLength = Math.sqrt(dx * dx + dy * dy);

  // Calculate the number of segments needed
  const numSegments = Math.ceil(lineLength / len);

  // Calculate the angle of the line
  const angle = Math.atan2(dy, dx);

  // Create an array to hold the segments
  const segments = [];

  // Calculate the position of each segment
  for (let i = 0; i < numSegments; i++) {
    const t = i / (numSegments - 1);
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    segments.push(x, y);
  }

  return segments;
}

function sp(ps: number[]) {
  const ar = [];
  for (let i = 0; i < ps.length; i += 4) {
    const x1 = ps[i];
    const y1 = ps[i + 1];
    const x2 = ps[i + 3];
    const y2 = ps[i + 4];
    const sp = splitLineIntoSegments(x1, y1, x2, y2, 3);
    ar.push(...sp);
  }
  return ar;
}

interface IRectangularProperties {
  feather?: number;
  antiAlias?: boolean;
  style?: string;
  width?: number;
  height?: number;
}

export const rectangularSelect = new ReactangularSelect();
