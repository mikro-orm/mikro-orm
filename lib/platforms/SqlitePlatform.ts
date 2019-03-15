import { Platform } from './Platform';

export class SqlitePlatform extends Platform {

  supportsSavePoints(): boolean {
    return true;
  }

}
