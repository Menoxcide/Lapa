declare module 'js-yaml' {
  const yaml: any;
  export default yaml;
}

declare module 'playwright' {
  const playwright: any;
  export default playwright;
}

declare module 'pixelmatch' {
  function pixelmatch(img1: Buffer | Uint8Array, img2: Buffer | Uint8Array, output: Buffer | Uint8Array, width: number, height: number, options?: any): number;
  export default pixelmatch;
}

declare module 'pngjs' {
  class PNG {
    constructor(options?: any);
    pack(): Buffer;
    parse(data: Buffer, callback: (err: Error | null, png: PNG) => void): void;
  }
  export = PNG;
}

declare module 'gif.js' {
  class GIF {
    constructor(width: number, height: number, options?: any);
    addFrame(image: ImageData, options?: any): void;
    on(event: string, callback: () => void): void;
    render(): void;
    finishRendering(): void;
    download(filename: string): void;
  }
  export = GIF;
}

declare module 'html2canvas' {
  function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>;
  export default html2canvas;
}