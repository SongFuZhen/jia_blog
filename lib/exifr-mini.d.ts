declare module "exifr/dist/mini.esm.js" {
  export function parse(
    file: File | Blob | string,
    options?: Record<string, unknown>,
  ): Promise<Record<string, unknown> | undefined>;
  const exifr: { parse: typeof parse };
  export default exifr;
}
