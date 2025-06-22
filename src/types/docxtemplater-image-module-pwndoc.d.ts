declare module "docxtemplater-image-module-pwndoc" {
    export interface Opts {
        getImage: (tagValue: string, tagName: string) => Promise<string>;
        getSize: (img: string, tagValue: string, tagName: string) => [number, number];
    }

    export default class ImageModule {
        constructor(opts: Opts);
    }
}