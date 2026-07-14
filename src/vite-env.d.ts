/// <reference types="vite/client" />

declare module "*.css?inline" {
  const content: string;
  export default content;
}

declare module "*.woff2" {
  const src: string;
  export default src;
}
