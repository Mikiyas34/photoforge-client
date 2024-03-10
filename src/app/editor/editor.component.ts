import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DataService } from '../core/services/data.service';
import {
  brushTool,
  cloneStampTool,
  cropTool,
  eraserTool,
  lassoTool,
  rectangularSelect,
  shapeTool,
  textTool,
} from '../core/tools/';
import { Project } from '../types/project';
import { StateService } from '../core/services/state.service';
import { ClipboardService } from '../core/services/clipboard.service';
import { ApiService } from '../core/services/api.service';
import { NotificationService } from '../core/services/notification.service';
import { Layer } from '../core/layers/layer';
import { PixelLayer } from '../core/layers/pixel-layer';
import { Selection } from '../core/selection';
import * as PIXI from 'pixi.js-legacy';
import { fabric } from 'fabric';
import { Command } from '../core';
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
  // encapsulation: ViewEncapsulation.ShadowDom,
})
export class EditorComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedLayers: Layer[] = [];
  selectedProject?: Project | null;
  layers: Layer[] = [];
  projects: Project[] = [];
  zoom: number = 1;
  newDocumentActive?: boolean;
  contextMenu: any;
  @ViewChild('cursor') cursor?: ElementRef;
  @ViewChild('rectSelectContextMenu') rectSelectContextMenu?: ElementRef;
  shortcutsRenderFunc = (): void => {};
  shortcutsEnabled?: boolean = true;
  tools: any[] = [
    brushTool,
    shapeTool,
    cropTool,
    rectangularSelect,
    lassoTool,
    cloneStampTool,
    textTool,
    eraserTool,
  ];
  @ViewChild('display') display?: ElementRef;
  @ViewChild('container') container?: ElementRef;
  selectionContextMenu!: { isActive: boolean; x: number; y: number };
  currentSelection?: Selection | null;
  constructor(
    private data: DataService,
    private renderer: Renderer2,
    private clipboard: ClipboardService,
    private notification: NotificationService
  ) {}
  ngOnInit() {
    //create new layer
    //undeo(): layer.remve()
    this.data.showNav.next(false);

    this.data.contextMenu.subscribe((cm) => {
      this.contextMenu = cm;
    });
    this.data.shortcutsEnabled.subscribe((se) => {
      this.shortcutsEnabled = se;
    });
    this.data.projects.subscribe((projects) => {
      this.projects = projects;
    });
    this.data.layers.subscribe((layers) => {
      this.layers = layers.filter(
        (layer) => layer.projectId == this.selectedProject?.Id
      );
    });
    this.data.currentSelection.subscribe((cs) => {
      this.currentSelection = cs;
    });
    this.data.selectionContextMenu.subscribe((cm) => {
      this.selectionContextMenu = cm;
      if (cm.isActive) {
        document.addEventListener('mousedown', (e) => {
          if (!this.rectSelectContextMenu?.nativeElement.contains(e.target)) {
            this.data.selectionContextMenu.next({
              isActive: false,
              x: 0,
              y: 0,
            });

            document.removeEventListener('mousedown', (e) => {});
          }
        });
      }
    });
    this.data.selectedProject.subscribe((project) => {
      this.selectedProject = project;
      this.data.zoom.next(project?.Zoom || 50);
      this.filterLayers(project);
    });
    this.data.newMenuClick.subscribe((clicked) => {
      this.newDocumentActive = clicked;
    });
    this.data.selectedLayers.subscribe((sl) => {
      this.selectedLayers = sl;
      this.data.layers.getValue().forEach((layer) => {
        layer.resizer.disable();
      });
      sl.forEach((sl_layer) => {
        sl_layer.resizer.enable();
      });
    });
    this.data.shortcutsEnabled.subscribe((en) => {
      this.addShortcuts();
    });
    this.data.zoom.subscribe((zoom) => {
      this.zoom = zoom;
      this.display!.nativeElement.style.scale = (zoom / 100).toString();
      const displayScale = parseFloat(
        this.display?.nativeElement.style.scale || '1'
      );
      this.display!.nativeElement.parentElement.style.width =
        this.display?.nativeElement.clientWidth * displayScale + 'px';
      this.display!.nativeElement.parentElement.style.height =
        this.display?.nativeElement.clientHeight * displayScale + 'px';
      if (this.selectedProject) {
        this.selectedProject.Zoom = zoom;
      }
      this.data.selectedLayers.getValue().forEach((lr) => {
        lr.resizer.update();
      });
    });
  }
  private filterLayers(project: Project | null) {
    this.data.layers.getValue().forEach((layer) => {
      if (layer.projectId != project?.Id) {
        layer.hide();
      } else {
        layer.show();
      }
    });
  }

  setZoom(e: any) {
    this.data.zoom.next(e);
  }
  ngAfterViewInit() {
    const p: Project = {
      Id: 'bbb',
      UserId: 'fg',
      Title: 'testproj',
      Width: 500,
      Height: 700,
    };
    const img = new Image();
    img.src = 'assets/fixtures/deer.jpg';

    const layer = new PixelLayer(
      this.data,
      this.renderer,
      this.display!.nativeElement,
      'eew',
      'Deer png',
      'bbb',
      img
    );

    (this.container?.nativeElement as HTMLElement).addEventListener(
      'mousedown',
      (e) => {
        // console.log('md');
        const selectedLayer = this.data.selectedLayers.getValue()[0];
        if (selectedLayer) {
          // console.log('selectedLayer: ', selectedLayer.name);
        }
        this.data.layers.getValue().forEach((layer) => {
          if (
            layer.elem.contains(e.target as HTMLElement) ||
            layer.resizer.elem.contains(e.target as HTMLElement)
          ) {
            // console.log('bb containes', layer.name);
            // selectedLayer.resizer.disable();
            this.data.selectedLayers.next([layer]);
            layer.resizer.enable();
          } else {
            // console.log(layer.elem, ' does not contain ', e.target);
            // console.log(selectedLayer);
            if (selectedLayer) {
              // console.log(selectedLayer);
              selectedLayer.resizer.disable();
              // this.data.selectedLayers.next([]);
            }
          }
        });
      }
    );
    // layer.getPixels();
    this.data.projects.next([p]);
    this.data.layers.next([layer]);
    this.data.displayElem.next(this.display?.nativeElement as HTMLElement);
    this.data.selectedProject.next(p);
    this.data.selectedLayers.next([layer]);
    // this.createLayerFromASelectionViaCopy();
    this.addShortcuts();
    const displayScale = parseFloat(
      this.display?.nativeElement.style.scale || '1'
    );

    this.display!.nativeElement.parentElement.style.width =
      this.display?.nativeElement.clientWidth * displayScale + 'px';
    this.display!.nativeElement.parentElement.style.height =
      this.display?.nativeElement.clientHeight * displayScale + 'px';
    this.data.selectedTool.next('moveTool');

    // this.drawSVG();

    this.data.selectedTool.subscribe((selectedTool) => {
      this.tools.forEach((tool) => {
        if (tool.type == selectedTool) {
          console.log('selectedTool', selectedTool);
          this.disconfigureTools();
          switch (tool.type) {
            case 'moveTool':
              this.disconfigureTools();
              break;
            case 'brushTool':
              tool.configure(
                this.display?.nativeElement,
                this.data,
                this.notification,
                this.renderer
              );
              break;
            case 'textTool':
              tool.configure(
                this.display?.nativeElement,
                this.data,
                this.renderer
              );
              break;
            case 'shapeTool':
              tool.configure(
                this.display?.nativeElement,
                this.selectedLayers[0]
              );
              break;
            case 'cropTool':
              tool.configure(this.display?.nativeElement);
              break;
            case 'lassoTool':
              tool.configure(this.display?.nativeElement, this.data);
              break;
            case 'rectangularSelectTool':
              tool.configure(this.display?.nativeElement, this.data);
              break;
            case 'cloneStampTool':
              tool.configure(this.display?.nativeElement, this.layers[0]);
              break;
            case 'eraserTool':
              tool.configure(this.display?.nativeElement, this.data);
              break;
            default:
              tool.configure();
          }
          // tool.configure();
        }
      });
    });
    // const project: Project = {
    //   Id: 'ae',
    //   UserId: 'dss',
    //   Title: 'dsrfre',
    //   Width: 720,
    //   Height: 1080,
    // };
    // this.data.projects.next([project]);

    // this.data.selectedProject.next(project);
    // this.display!.nativeElement.style.scale = '0.5';
    // const layer = new PixelLayer(
    //   this.display?.nativeElement,
    //   'dasd',
    //   'dasd',
    //   'ae',
    //   null
    // );
    // this.data.layers.next([layer]);
  }

  private drawSVG() {
    const path = document.createElement('path');
    const svg = document.createElement('svg');
    const defs = document.createElement('defs');
    let d = 'M 0 0';
    this.display?.nativeElement.addEventListener('mousemove', (e: any) => {
      console.log('moveing');
      console.clear();
      const rect = this.display?.nativeElement.getBoundingClientRect();
      console.log(e.clientX - rect.left, e.clientY - rect.top);
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;
      d = d.concat(` L ${x} ${y} `);
      console.log(d);
      path.remove();
      defs.remove();
      svg.remove();
      path.setAttribute('d', d);
      defs.appendChild(path);
      svg.appendChild(defs);
      console.log(svg);
      this.display?.nativeElement.appendChild(svg);
    });
  }

  loadLayers() {}

  addShortcuts() {
    this.renderer.listen('document', 'keydown', (e) => {
      if (!this.shortcutsEnabled) {
        return;
      }
      switch (e.code) {
        case 'KeyM':
          this.data.selectedTool.next('moveTool');
          this.disconfigureTools();

          break;
        case 'KeyA':
          if (e.ctrlKey) {
          }
          break;
        case 'KeyL':
          this.data.selectedTool.next('lassoTool');
          break;
        case 'KeyD':
          if (e.ctrlKey) {
            e.preventDefault();
          }
          break;
        case 'KeyR':
          if (e.ctrlKey) {
            return;
          }
          e.preventDefault();
          this.data.selectedTool.next('rectangularSelectTool');
          break;
        case 'KeyS':
          this.data.selectedTool.next('shapeTool');
          break;
        case 'KeyB':
          this.data.selectedTool.next('brushTool');
          break;
        case 'KeyC':
          if (e.ctrlKey) {
            // this.clipboard.copyLayer(this.selectedLayers![0]);
          } else {
            this.data.selectedTool.next('cropTool');
          }
          break;
        case 'KeyX':
          if (e.ctrlKey) {
            // this.clipboard.cutLayer(this.selectedLayers![0]);
          }
          break;
        case 'KeyT':
          this.data.selectedTool.next('textTool');
          break;
        case 'KeyP':
          this.data.selectedTool.next('penTool');
          break;
        case 'KeyV':
          if (e.ctrlKey) {
            this.clipboard.pasteLayer();
          }
          break;
        case 'KeyE':
          this.data.selectedTool.next('eraserTool');
          break;
        case 'KeyH':
          this.data.selectedTool.next('handTool');
          break;
        case 'KeyG':
          if (e.ctrlKey) {
          } else {
            this.data.selectedTool.next('gradientTool');
          }
          break;
        case 'Delete':
          const undoLayerDeletion = new Command();
          undoLayerDeletion.execute = () => {
            const selectedLayers = this.data.selectedLayers.getValue();
            console.log('restoring deleted files', selectedLayers);
            this.data.layers.next([
              ...this.data.layers.getValue(),
              ...selectedLayers,
            ]);
            selectedLayers.forEach((lr) => {
              // this.display?.nativeElement.appendChild(lr.canvas);
            });
          };
          const redoLayerDeletion = new Command();
          redoLayerDeletion.execute = () => {
            console.log('redo layer deletion');

            const newLayersArray: Layer[] = [];
            this.data.layers.getValue().forEach((layer) => {
              if (this.selectedLayers.includes(layer)) {
                // layer.canvas?.remove();
              } else {
                newLayersArray.push(layer);
              }
            });
            this.data.layers.next(newLayersArray);
          };

          this.data.history.getValue().undoStack.push(undoLayerDeletion);
          this.data.history.getValue().redoStack.push(redoLayerDeletion);

          const newLayersArray: Layer[] = [];
          this.data.layers.getValue().forEach((layer) => {
            if (this.selectedLayers.includes(layer)) {
              // layer.canvas?.remove();
            } else {
              newLayersArray.push(layer);
            }
          });
          this.data.layers.next(newLayersArray);
          break;
        case 'Equal':
          if (e.ctrlKey) {
            e.preventDefault();
            this.data.zoom.next(this.data.zoom.getValue() + 2);
          }
          break;
        case 'Minus':
          if (e.ctrlKey) {
            e.preventDefault();
            this.data.zoom.next(this.data.zoom.getValue() - 2);
          }
          break;
        case 'KeyF':
          if (e.ctrlKey) {
            e.preventDefault();
          }
          break;
        case 'KeyJ':
          if (e.ctrlKey) {
            e.preventDefault();
            // this.layerService.duplicateLayer(this.selectedLayers![0]);
          }
          break;
        case 'KeyZ':
          if (e.ctrlKey) {
            const cm = this.data.history.getValue().undoStack.pop();
            if (cm) {
              cm.execute();
              this.data.history.getValue().redoStack.push(cm);
            }
            e.preventDefault();
            // this.stateService.undo();
          } else {
            this.data.selectedTool.next('zoomTool');
          }
          break;
        case 'KeyY':
          if (e.ctrlKey) {
            const cm = this.data.history.getValue().redoStack.pop();
            if (cm) {
              cm.execute();
              this.data.history.getValue().undoStack.push(cm);
            }
            e.preventDefault();
            // this.stateService.redo();
          }
          break;
      }
    });
  }
  stopShortCuts() {
    this.shortcutsRenderFunc();
  }

  onRectSelectRightClick(e: any) {
    e.preventDefault();
  }
  disconfigureTools() {
    this.tools.forEach((tool) => {
      tool.disconfigure(this.display?.nativeElement);
    });
  }

  onNewDocumentCloseClick() {
    this.data.newMenuClick.next(false);
  }
  onNewDocumentCreateClick() {
    this.data.newMenuClick.next(false);
  }
  fadeSelection() {
    throw new Error('Method not implemented.');
  }
  makeWorkPath() {
    throw new Error('Method not implemented.');
  }
  inverseSelection() {
    throw new Error('Method not implemented.');
  }
  clearSelection() {
    this.data.currentSelection.next(null);
  }
  maskCurrentSelection() {
    throw new Error('Method not implemented.');
  }
  saveCurrentSelection() {
    throw new Error('Method not implemented.');
  }
  strokeSelection() {
    throw new Error('Method not implemented.');
  }
  fillSelection() {
    throw new Error('Method not implemented.');
  }
  createLayerFromASelectionViaCut() {
    throw new Error('Method not implemented.');
  }
  createLayerFromASelectionViaCopy() {
    const selectedLayer = this.selectedLayers[0];
    if (selectedLayer instanceof PixelLayer) {
      const sprite = selectedLayer.getSprite() as PIXI.Sprite;
      // const buffer = selectedLayer.app?.renderer.extract.pixels(sprite);
      // const data = new Uint8Array(buffer!.length * 2);

      const r = new PIXI.Renderer({
        context: (selectedLayer.canvas as HTMLCanvasElement).getContext(
          'webgl2'
        ),
        view: selectedLayer.canvas as HTMLCanvasElement,
      });

      r.render(sprite, {
        clear: true,
      });

      r.clear();
      console.log(r);
      // data.set(data, 3);
      // this.insertArrayBuffer(
      //   selectedLayer.app!,
      //   data,
      //   sprite.width,
      //   sprite.height
      // );
    }
  }
  insertArrayBuffer(
    app: PIXI.Application,
    buffer: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number
  ) {
    const whiteTexture = PIXI.Sprite.from(
      PIXI.Texture.fromBuffer(buffer, width, height, {
        wrapMode: PIXI.WRAP_MODES.REPEAT,
      })
    );

    whiteTexture.width = app.screen.width;
    whiteTexture.height = app.screen.height;
    const texture = PIXI.RenderTexture.create({
      width: app.screen.width,
      height: app.screen.height,
    });
    const drawingSurface = new PIXI.Sprite(texture);

    whiteTexture.width = app.screen.width;
    whiteTexture.height = app.screen.height;
    drawingSurface.width = app.screen.width;
    drawingSurface.height = app.screen.height;
    app.stage.addChild(drawingSurface);
    app.renderer.render(whiteTexture, {
      renderTexture: texture,
      clear: true,
    });
  }
  ngOnDestroy() {
    // this.data.layers.unsubscribe();
    // this.data.selectedLayers.unsubscribe();
    this.data.newMenuClick.unsubscribe();
    this.shortcutsRenderFunc();
    this.data.zoom.unsubscribe();
    this.data.projects.unsubscribe();
    this.data.selectedProject.unsubscribe();
  }
}

function insertImageData(bufferData: Uint8ClampedArray, gl: any) {
  var canvas = document.getElementById('webgl-canvas');

  // Create a new texture
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Insert the image data
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    bufferData
  );
}
