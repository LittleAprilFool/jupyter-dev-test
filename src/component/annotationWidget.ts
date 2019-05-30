import * as fabric from '../external/fabric';

export class AnnotationWidget implements IAnnotationWidget {
    private canvas: any;
    private paintTool: HTMLButtonElement;
    private clearTool: HTMLButtonElement;
    constructor(private cell: any, private updateFunc: (recall: any)=> void) {
        if(!this.checkValid()) return null;
        // init canvas container
        const [canvasEl, canvasContainer] = this.initCanvasContainer();

        // init fabric canvas
        this.canvas = new fabric.Canvas(canvasEl, {
            width: canvasContainer.offsetWidth,
            height: canvasContainer.offsetHeight,
        });
        if(this.cell.metadata.annotation) {
            this.canvas.loadFromJSON(this.cell.metadata.annotation, this.canvas.renderAll.bind(this.canvas));
        }
        this.canvas.freeDrawingBrush.width = 4;
        this.canvas.on('mouse:up', this.handleMouseUp.bind(this));

        // init paint tool
        this.initToolContainer();
    }

    public reloadCanvas(data): void {
        this.canvas.loadFromJSON(data.annotation, this.canvas.renderAll.bind(this.canvas));
    }

    private initCanvasContainer(): [HTMLElement, HTMLElement] {
        const subArea = this.getLastSubArea();
        const canvasContainer = document.createElement('div');
        const canvasEl = document.createElement('canvas');
        canvasContainer.setAttribute('id', 'annotation-container');
        canvasEl.setAttribute('id', 'annotation-canvas');
        canvasContainer.appendChild(canvasEl);
        subArea.appendChild(canvasContainer);
        canvasContainer.setAttribute('style', 'position:absolute; width: 100%; height:100%; top:0');
        subArea.setAttribute('style', 'position: relative; padding:unset');

        return [canvasEl, canvasContainer];
    }

    private initToolContainer(): void {
        const subArea = this.getLastSubArea();
        this.paintTool = document.createElement('button');
        this.paintTool.setAttribute('class', 'btn btn-default');

        this.paintTool.innerHTML = '<i class="fa fa-pencil"></i>';
        this.clearTool = document.createElement('button');
        this.clearTool.setAttribute('class', 'btn btn-default');

        this.clearTool.innerHTML = '<i class="fa fa-eraser"></i>';


        const toolContainer = document.createElement('div');
        toolContainer.setAttribute('class', 'toolbar btn-group');

        toolContainer.append(this.paintTool);
        toolContainer.append(this.clearTool);

        subArea.appendChild(toolContainer);
        toolContainer.setAttribute('style', 'position:absolute; top:10px; right:0');

        this.paintTool.addEventListener('click', this.handlePaint.bind(this));
        this.clearTool.addEventListener('click', this.handleClear.bind(this));
    }

    private checkValid(): boolean {
        const subArea = this.getLastSubArea();
        if (subArea === null || subArea.firstChild.nodeName === 'PRE') return false;
        else return true;
    }

    private getLastSubArea(): Element {
        const cellEl: HTMLDivElement = this.cell.output_area.element[0];
        const outputEl = cellEl.getElementsByClassName('output_area');
        if(outputEl.length===0) {
            return null;
        }
        else {
           const targetOutput = outputEl[outputEl.length-1];
            const subArea = targetOutput.getElementsByClassName('output_subarea')[0];
            return subArea;
        }
    }

    private handleMouseUp(options): void {
        if(this.canvas.isDrawingMode) {
            this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
            this.changePaintColor(false);
            this.saveDrawing();
        }
        if (options.target) {
            this.saveDrawing();
        }
    }

    private changePaintColor(flag): void {
        if(flag) {
            this.paintTool.setAttribute("style", "background-color:#d4edda; color:#155724; border-color: #c3e6cb");
        }
        else {
            this.paintTool.setAttribute("style", "background-color:#fff; border-color: #ccc");
        }

        this.paintTool.blur();
    }

    private handlePaint(event): void {
        this.canvas.isDrawingMode = !this.canvas.isDrawingMode;
        this.changePaintColor(true);
    }

    private handleClear(event): void {
        this.canvas.clear();
        this.saveDrawing();
        this.clearTool.blur();
    }

    private saveDrawing(): void {
        const canvas_json = this.canvas.toJSON();
        const newMeta = this.cell.metadata;
        newMeta.annotation = canvas_json;
        this.cell.metadata = newMeta;
        this.updateFunc(this.cell);
    }
}