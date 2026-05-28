import Homey from 'homey';
import EnphaseAPI from './EnphaseAPI.js';

export default class EnphaseDevice extends Homey.Device {
  /** Lower cloud poll interval to prevent rate limiting. */
  private static POLL_INTERVAL_CLOUD = 1000 * 60 * 5; // 5 minutes

  /**
   * The integration collects data for all entities by default every 60 seconds.
   *
   * Envoy installations without installed CT, collect individual solar inverter data every 5 minutes.
   * This collection does not occur for each inverter at the same time in the 5-minute period.
   * Shortening the collection interval will at best show updates for individual inverters quicker,
   * but not yield more granular data.
   *
   * With installed CT, data granularity increases and shortening the collection interval can provide
   * more details. The Envoy, however, has no unlimited resources and shortening the collection
   * interval may result in dropped connections, Envoy freeze or restarts.
   */
  private static POLL_INTERVAL_LOCAL = 1000 * 60; // 60 seconds

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
