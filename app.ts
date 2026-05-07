import { Log } from '@drenso/homey-log';
import Homey from 'homey';
import sourceMapSupport from 'source-map-support';

sourceMapSupport.install();

// noinspection JSUnusedGlobalSymbols
export default class EnphaseApp extends Homey.App {
  public readonly homeyLog = new Log({ homey: this.homey });

  public async onInit(): Promise<void> {
    this.log('Finished initializing App');
  }
}
