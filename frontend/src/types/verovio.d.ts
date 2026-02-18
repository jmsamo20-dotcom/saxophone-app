declare module "verovio" {
  export class toolkit {
    constructor();
    setOptions(options: Record<string, unknown>): void;
    loadData(data: string): boolean;
    getPageCount(): number;
    renderToSVG(page: number): string;
  }
}
