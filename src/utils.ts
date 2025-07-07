export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export let tmpDir: string;

export function setTmpDir(dir: string) {
  tmpDir = dir;
}