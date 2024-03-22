import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  ViewEncapsulation,
  Renderer2,
} from '@angular/core';
import { DataService } from 'src/app/core/services/data.service';
import { Menus } from 'src/app/enums/menu.enum';
import { LayerService } from 'src/app/core/services/layer.service';
import { Filter } from 'src/app/enums/filter';
import { Project } from 'src/app/types/project';
import { StateService } from 'src/app/core/services/state.service';
import { ClipboardService } from 'src/app/core/services/clipboard.service';
import { ApiService } from 'src/app/core/services/api.service';
import { ImageCanvas } from 'src/app/core/image-canvas';
import { PixelLayer } from 'src/app/core/layers/pixel-layer';
import { rgbaFormatter } from 'src/app/core/rgba-formater';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Layer } from 'src/app/core/layers/layer';
import { AdjustmentLayer } from 'src/app/types/layer';
import * as PIXI from 'pixi.js-legacy';
import { TypeLayer } from 'src/app/core/layers/type-layer';
import { filter } from 'rxjs';
import { Command } from 'src/app/core';
@Component({
  selector: 'app-menus',
  templateUrl: './menus.component.html',
  styleUrls: ['./menus.component.scss'],
})
export class MenusComponent implements OnInit, OnDestroy {
  @ViewChild('menuOptions') menuOptions!: ElementRef;
  @ViewChild('open') open!: ElementRef;
  @ViewChild('menus') menus!: ElementRef;
  selectedMenu: Menus = Menus.None;
  recentProjects: Project[] = [];
  constructor(
    private data: DataService,
    private layerService: LayerService,
    private stateService: StateService,
    private clipboard: ClipboardService,
    private api: ApiService,
    private notification: NotificationService,
    private renderer: Renderer2
  ) {}
  ngOnInit(): void {
    //TODO:
    //sort the projects based on their modifyed date
    //reverse the array
    //then get the first few project and display
  }
  async saveProject() {
    // project.pfd
    //send a save project req
    //the server takes the info
    //create a [projectname].pfd file
    //convert the data to binary the append it to the file
    //sends the file back to the client to download it
    //then whenever the user uploades a pfd file the it gets send to the server and the server converts the binary into json and send it back...
  }
  get Menus() {
    return Menus;
  }
  get Filter() {
    return Filter;
  }
  get AdjustmentLayer() {
    return AdjustmentLayer;
  }
  onMenuClick(menu: Menus) {
    this.selectedMenu = menu;
  }
  onNewMenuClick() {
    this.closeMenu();
    this.data.newMenuClick.next(true);
  }
  closeMenu() {
    this.selectedMenu = Menus.None;
  }
  openProject(project: Project) {
    this.data.projects.next([...this.data.projects.getValue(), project]);
    this.data.selectedProject.next(project);
  }
  onOpenFileOptionChange(e: any) {
    for (let file of e.target.files) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;
        this.notification.createNotification({
          title: 'Opening image ' + file.name,
        });
        imgObj.onload = () => {
          this.notification.hideNotification();
          const project: Project = {
            Id: `${Math.random()}`,
            Title: file.name,
            UserId: 'dasd',
            Width: imgObj.width,
            Height: imgObj.height,
          };
          const displayElem = this.data.displayElem.getValue();
          displayElem!.style.width = imgObj.width + 'px';
          displayElem!.style.height = imgObj.height + 'px';
          const pixelLayer = new PixelLayer(
            this.data,
            this.renderer,
            // displayElem,
            `${Math.random()}`,
            file.name,
            project.Id,
            imgObj
          );
          pixelLayer.lock();
          this.data.projects.next([...this.data.projects.getValue(), project]);
          this.data.selectedProject.next(project);
          this.data.layers.next([...this.data.layers.getValue(), pixelLayer]);
        };
      };
      this.api.createProjectByUpload(file).subscribe({
        next: (res) => {
          console.log(res);
        },
        error: (err) => {
          console.log(err);
        },
      });
      reader.readAsDataURL(file);
    }
    this.closeMenu();
  }
  clearProject() {
    const selectedProject = this.data.selectedProject.getValue();

    const undoAction = () => {
      const layers = this.data.layers.getValue();
      this.data.layers.next(layers);
    };
    const redoAction = () => {
      this.clearProject();
    };
    this.stateService.setState(undoAction, redoAction);
    const updatedLayers: Layer[] = [];
    this.data.layers.getValue().forEach((l) => {
      if (l.projectId != selectedProject?.Id) {
        updatedLayers.push(l);
      } else {
        // l.canvas?.remove();
      }
    });
    this.data.layers.next(updatedLayers);
  }
  pasteObj() {
    this.clipboard.pasteLayer();
  }
  copySelectedObj() {
    this.clipboard.copyLayer(this.data.selectedLayers.value[0]);
  }
  deleteLayer() {
    const updatedLayers: Layer[] = [];
    const selectedLayers = this.data.selectedLayers.getValue();
    this.data.layers.getValue().forEach((l) => {
      if (!selectedLayers.includes(l)) {
        updatedLayers.push(l);
      }
    });
    this.data.layers.next(updatedLayers);
  }
  duplicateLayer() {
    const selectedLayers = this.data.selectedLayers.getValue();
    const selectedProject = this.data.selectedProject.getValue();
    const displayElem = this.data.displayElem.getValue();
    selectedLayers.forEach((sl: Layer) => {
      if (sl instanceof PixelLayer) {
        const duplicateLayer = new PixelLayer(
          this.data,
          this.renderer,
          // displayElem,
          `${Math.random()}`,
          sl.name + 'Copy',
          selectedProject!.Title,
          null
        );
        this.data.layers.next([...this.data.layers.getValue(), duplicateLayer]);
      }
    });
  }
  createNewLayer() {
    const displayElem = this.data.displayElem.getValue();
    const selectedProject = this.data.selectedProject.getValue();
    const layer = new PixelLayer(
      this.data,
      this.renderer,
      // displayElem,
      `${Math.random()}`,
      'Layer 1',
      selectedProject?.Id || 'aaa',
      PIXI.Texture.EMPTY
    );
    this.data.layers.next([...this.data.layers.getValue(), layer]);
    this.data.selectedLayers.next([
      ...this.data.selectedLayers.getValue(),
      layer,
    ]);

    const undoCommand = new Command();
    undoCommand.execute = () => {
      layer.canvas?.remove();
      this.data.layers
        .getValue()
        .splice(this.data.layers.getValue().indexOf(layer));
      // this.data.layers.next(newLayers);
    };
    this.data.history.getValue().undoStack.push(undoCommand);
  }
  addFilter(filter: Filter) {
    // this.layer.addFilter(filter);
  }
  flipCanvas() {
    this.data.layers.subscribe((layers) => {
      layers.forEach((lr) => {
        // lr.canvas!.style.scale = '-1 1';
      });
    });
  }
  closeSelectedProject() {
    const currentProjectsValue = this.data.projects.getValue();
    const updatedProjectsValue: Project[] = [];
    currentProjectsValue.forEach((p) => {
      if (p.Id != this.data.selectedProject.value?.Id) {
        updatedProjectsValue.push(p);
      }
    });
    this.data.projects.next(updatedProjectsValue);
    if (this.data.projects.value.length > 0) {
      this.data.selectedProject.next(this.data.projects.value[0]);
    } else {
      this.data.selectedProject.next(null);
    }
    this.closeMenu();
  }
  placeEmbedded(e: any) {
    for (let file of e.target.files) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;
        const selectedProject = this.data.selectedProject.getValue();
        imgObj.onload = () => {
          const displayElem = this.data.displayElem.getValue();
          const pixelLayer = new PixelLayer(
            this.data,
            this.renderer,
            // displayElem,
            'ede',
            file.name,
            selectedProject?.Id || 'aaa',
            imgObj
          );
          this.data.layers.next([...this.data.layers.getValue(), pixelLayer]);
        };
      };
      reader.readAsDataURL(file);
    }
    this.closeMenu();
  }
  fill() {
    throw new Error('Method not implemented.');
  }
  cut() {
    this.clipboard.cutLayer(this.data.selectedLayers.value[0]);
  }
  redo() {}
  stepBackward() {}
  undo() {
    this.stateService.undo();
  }
  swatchesPanel() {
    throw new Error('Method not implemented.');
  }
  propertiesPanel() {
    throw new Error('Method not implemented.');
  }
  layersPanel() {
    throw new Error('Method not implemented.');
  }
  colorPanel() {
    throw new Error('Method not implemented.');
  }
  characterPanel() {
    throw new Error('Method not implemented.');
  }
  brushesPanel() {
    throw new Error('Method not implemented.');
  }
  adjustmentsPanel() {
    throw new Error('Method not implemented.');
  }
  revealAll() {
    throw new Error('Method not implemented.');
  }
  rotateCanvas() {
    this.data.layers.subscribe((layers) => {
      layers.forEach((lr) => {
        // lr.canvas!.style.transform = 'rotate(180deg)';
      });
    });
  }
  crop() {
    this.data.selectedTool.next('cropTool');
  }
  flipVertical() {}
  flipHorizontal() {
    throw new Error('Method not implemented.');
  }
  rotateView() {
    throw new Error('Method not implemented.');
  }
  show() {
    throw new Error('Method not implemented.');
  }
  printSize() {
    throw new Error('Method not implemented.');
  }
  actualPixels() {
    throw new Error('Method not implemented.');
  }
  fitOnScreen() {
    throw new Error('Method not implemented.');
  }
  zoomOut() {
    this.data.zoom.next(this.data.zoom.getValue() - 2);
  }
  zoomIn() {
    this.data.zoom.next(this.data.zoom.getValue() + 2);
  }
  saveSlectionChannel() {
    throw new Error('Method not implemented.');
  }
  loadSelectionChannel() {
    throw new Error('Method not implemented.');
  }
  modify() {
    throw new Error('Method not implemented.');
  }
  saveSelection() {
    throw new Error('Method not implemented.');
  }
  loadSelection() {
    throw new Error('Method not implemented.');
  }
  deselectLayers() {
    throw new Error('Method not implemented.');
  }
  inverse() {
    const selectedLayers = this.data.selectedLayers.getValue();
    const allLayers = this.data.layers.getValue();
    const unselectedLayers: Layer[] = [];
    allLayers.forEach((lr) => {
      if (!selectedLayers.includes(lr)) {
        unselectedLayers.push(lr);
      }
    });
    this.data.selectedLayers.next(unselectedLayers);
  }
  reselect() {
    throw new Error('Method not implemented.');
  }
  deselect() {
    this.data.selectedLayers.next([]);
  }
  selectAll() {
    this.data.selectedLayers.next(this.data.layers.getValue());
  }
  // transformSelection() {
  //   throw new Error('Method not implemented.');
  // }
  // fontPreview() {
  //   throw new Error('Method not implemented.');
  // }
  // typeOrientation() {
  //   throw new Error('Method not implemented.');
  // }
  // typeOnAPath() {
  //   throw new Error('Method not implemented.');
  // }
  // matchFont() {
  //   throw new Error('Method not implemented.');
  // }
  // simplifyText() {
  //   throw new Error('Method not implemented.');
  // }
  // convertToShape() {
  //   throw new Error('Method not implemented.');
  // }
  // createWorkPath() {
  //   throw new Error('Method not implemented.');
  // }
  // verticalTypeMaskTool() {
  //   throw new Error('Method not implemented.');
  // }
  // horizontalTypeMaskTool() {
  //   throw new Error('Method not implemented.');
  // }

  newTypeLayer() {
    this.layerService.createTypeLayer('Lorem Ipsum');
  }
  layerViaCut() {
    throw new Error('Method not implemented.');
  }
  layerViaCopy() {
    throw new Error('Method not implemented.');
  }
  createClippingMask() {
    throw new Error('Method not implemented.');
  }
  lockLayers() {
    throw new Error('Method not implemented.');
  }
  distribute() {
    throw new Error('Method not implemented.');
  }
  align() {
    throw new Error('Method not implemented.');
  }
  arrange() {
    throw new Error('Method not implemented.');
  }
  flattenImage() {
    throw new Error('Method not implemented.');
  }
  mergeLayers() {
    throw new Error('Method not implemented.');
  }
  unGroupLayers() {
    throw new Error('Method not implemented.');
  }
  groupLayers() {
    throw new Error('Method not implemented.');
  }
  groupLayer() {
    throw new Error('Method not implemented.');
  }
  transform() {
    throw new Error('Method not implemented.');
  }
  stroke() {
    throw new Error('Method not implemented.');
  }
  autoTone() {}
  autoContrast() {}
  autoColor() {}
  applyImage() {}
  addAdjustmentLayer(aj: any) {}
  ngOnDestroy(): void {}
}
