// Type declarations for jsxgraph
declare module 'jsxgraph' {
  export = JXG;

  namespace JXG {
    interface BoardOptions {
      boundingbox?: [number, number, number, number];
      axis?: boolean;
      grid?: boolean;
      showNavigation?: boolean;
      showCopyright?: boolean;
      keepAspectRatio?: boolean;
      pan?: { enabled?: boolean };
      zoom?: { enabled?: boolean };
    }

    interface PointOptions {
      name?: string;
      size?: number;
      color?: string;
      fixed?: boolean;
      withLabel?: boolean;
    }

    interface LineOptions {
      strokeColor?: string;
      strokeWidth?: number;
      straightFirst?: boolean;
      straightLast?: boolean;
    }

    interface SegmentOptions {
      strokeColor?: string;
      strokeWidth?: number;
    }

    interface CircleOptions {
      strokeColor?: string;
      strokeWidth?: number;
      fillColor?: string;
      fillOpacity?: number;
    }

    interface AngleOptions {
      radius?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWidth?: number;
      name?: string;
    }

    interface TextOptions {
      fontSize?: number;
      color?: string;
    }

    interface Point {
      name: string;
      coords: { scrCoords: number[] };
      X(): number;
      Y(): number;
      moveTo(coords: number[], time?: number): void;
    }

    interface Line {
      point1: Point;
      point2: Point;
    }

    interface Circle {
      center: Point;
      radius(): number;
    }

    interface Board {
      id: string;
      renderer: { svgRoot: SVGElement };
      create(type: 'point', coords: number[], options?: PointOptions): Point;
      create(type: 'line', points: (Point | number[])[], options?: LineOptions): Line;
      create(type: 'segment', points: (Point | number[])[], options?: SegmentOptions): Line;
      create(type: 'ray', points: (Point | number[])[], options?: LineOptions): Line;
      create(type: 'circle', params: (Point | number)[], options?: CircleOptions): Circle;
      create(type: 'angle', points: (Point | string)[], options?: AngleOptions): any;
      create(type: 'text', coords: number[], content: string, options?: TextOptions): any;
      create(type: 'intersection', elements: any[], options?: any): Point;
      create(type: 'polygon', points: Point[], options?: any): any;
      create(type: 'arc', params: any[], options?: any): any;
      create(type: 'curve', params: any[], options?: any): any;
      create(type: 'functiongraph', params: any[], options?: any): any;
      create(type: string, params: any, options?: any): any;
      setBoundingBox(box: [number, number, number, number], keepAspectRatio?: boolean): void;
      update(): void;
    }

    interface JSXGraphStatic {
      initBoard(container: string | HTMLElement, options?: BoardOptions): Board;
      freeBoard(board: Board): void;
      getReference(board: Board, id: string): any;
    }

    const JSXGraph: JSXGraphStatic;
  }

  const JXG: JXG.JSXGraphStatic;
}
