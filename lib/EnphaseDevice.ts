import Homey from 'homey';
import EnphaseAPI from './EnphaseAPI.js';

export default class EnphaseDevice extends Homey.Device {
  private static POLL_INTERVAL_CLOUD = 1000 * 60 * 5; // 5 minutes
  private static POLL_INTERVAL_LOCAL = 1000 * 5; // 5 seconds
  protected api!: EnphaseAPI;
  private pollIntervalCloud!: NodeJS.Timeout;
  private pollIntervalLocal!: NodeJS.Timeout;

  public async onInit(): Promise<void> {
    this.api = new EnphaseAPI({
      username: this.getSettings().username,
      password: this.getSettings().password,
    });

    if (this.homey.platform === 'local' || this.homey.platform === 'cloud') {
      this.pollIntervalCloud = this.homey.setInterval(() => this.pollCloud(), EnphaseDevice.POLL_INTERVAL_CLOUD);
      this.pollCloud();
    }

    if (this.homey.platform === 'local') {
      this.pollIntervalLocal = this.homey.setInterval(() => this.pollLocal(), EnphaseDevice.POLL_INTERVAL_LOCAL);
      this.pollLocal();
    }
  }

  public async onUninit(): Promise<void> {
    if (this.pollIntervalCloud) {
      this.homey.clearInterval(this.pollIntervalCloud);
    }

    if (this.pollIntervalLocal) {
      this.homey.clearInterval(this.pollIntervalLocal);
    }
  }

  private pollCloud(): void {
    this.onPollCloud()
      .then(() => {
        this.setAvailable().catch(err => this.error(`Error Setting Available: ${err.message}`));
      })
      .catch(err => {
        this.error(`Error Polling Cloud: ${err.message}`);
        this.setUnavailable(err).catch(err => this.error(`Error Setting Unavailable: ${err.message}`));
      });
  }

  protected async onPollCloud(): Promise<void> {
    // Overload Me
  }

  protected pollLocal(): void {
    this.onPollLocal().catch(err => {
      this.error(`Error Polling Local: ${err.message}`);
    });
  }

  protected async onPollLocal(): Promise<void> {
    // Overload Me
  }

  public async onSettings({
    newSettings,
    changedKeys,
  }: {
    newSettings: { [key: string]: boolean | string | number | undefined | null };
    changedKeys: string[];
  }): Promise<void> {
    if (changedKeys.includes('username') || changedKeys.includes('password')) {
      await this.api.login({
        username: newSettings.username as string,
        password: newSettings.password as string,
      });

      this.pollCloud();
    }
  }
}
