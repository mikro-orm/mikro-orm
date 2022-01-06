export interface IFile {
  getBaseName: () => string;
  generate: () => string;
}
