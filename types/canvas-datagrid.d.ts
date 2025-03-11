declare module 'canvas-datagrid' {
    interface CanvasDataGridOptions {
        parentNode: HTMLElement;
        data: any[];
        allowColumnReordering?: boolean;
        allowRowReordering?: boolean;
        editable?: boolean;
        allowColumnResizeFromCell?: boolean;
        allowRowResizeFromCell?: boolean;
        allowSorting?: boolean;
        style?: Record<string, any>;
    }

    function canvasDatagrid(options: CanvasDataGridOptions): any;
    export default canvasDatagrid;
}
