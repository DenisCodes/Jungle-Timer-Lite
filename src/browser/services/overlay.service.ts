import { app as electronApp, BrowserWindow } from 'electron';
import { overwolf } from '@overwolf/ow-electron';
import {
  IOverwolfOverlayApi,
  OverlayWindowOptions,
  OverlayBrowserWindow,
  GamesFilter,
} from '@overwolf/ow-electron-packages-types';
import EventEmitter from 'events';

const app = electronApp as overwolf.OverwolfApp;

export class OverlayService extends EventEmitter {
  private isOverlayReady = false;

  private windows: { [key: string]: BrowserWindow } = {};

  public get overlayApi(): IOverwolfOverlayApi {
    if (!this.isOverlayReady) {
      return null;
    }
    return (app.overwolf.packages as any).overlay as IOverwolfOverlayApi;
  }

  constructor() {
    super();
    this.startOverlayWhenPackageReady();
  }

  public async createNewOsrWindow(
    options: OverlayWindowOptions
  ): Promise<OverlayBrowserWindow> {
    const overlay = await this.overlayApi.createWindow(options);
    return overlay;
  }

  public async registerToGames(gameIds: number[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.log('registering to game ids:', gameIds);

    const filter: GamesFilter = {
      gamesIds: gameIds,
    };

    await this.overlayApi.registerGames(filter);

    this.log('overlay is registered');
  }

  public registerWindow(name: string, window: OverlayBrowserWindow) {
    if (!window?.window) {
      console.warn(`registerWindow failed: no BrowserWindow in OverlayBrowserWindow`);
      return;
    }
    this.windows[name] = window.window;
  }

  public sendToOverlay(windowName: string, channel: string, data: any) {
    const win = this.windows[windowName];
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, data);
    } else {
      console.warn(`sendToOverlay failed: no window registered with name ${windowName}`);
    }
  }

  //----------------------------------------------------------------------------

  private startOverlayWhenPackageReady() {
    app.overwolf.packages.on('ready', (e, packageName, version) => {
      if (packageName !== 'overlay') {
        return;
      }

      this.isOverlayReady = true;
      this.startOverlay(version);
    });
  }

  private startOverlay(version: string) {
    if (!this.overlayApi) {
      throw new Error('Attempting to access overlay before available');
    }

    this.log(`overlay package is ready: ${version}`);

    this.registerOverlayEvents();

    this.emit('ready');
  }

  private registerOverlayEvents() {
    this.overlayApi.removeAllListeners();

    this.log('registering to overlay package events');

    this.overlayApi.on('game-launched', (event, gameInfo) => {
      this.log('game launched', gameInfo);

      if (gameInfo.processInfo.isElevated) {
        return;
      }

      this.emit('injection-decision-handling', event, gameInfo);
    });

    this.overlayApi.on('game-injection-error', (gameInfo, error) => {
      this.log('game-injection-error', error, gameInfo);
    });

    this.overlayApi.on('game-injected', (gameInfo) => {
      this.log('new game injected!', gameInfo);
    });

    this.overlayApi.on('game-focus-changed', (window, game, focus) => {
      this.log('game window focus changes', game.name, focus);
    });

    this.overlayApi.on('game-window-changed', (window, game, reason) => {
      this.log('game window info changed', reason, window);
      console.log('overlay service');
      this.emit('game-window-changed', window, game, reason);
    });

    this.overlayApi.on('game-input-interception-changed', (info) => {
      this.log('overlay input interception changed', info);
    });

    this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
      this.log('overlay input exclusive mode changed', info);
    });
  }

  private log(message: string, ...args: any[]) {
    try {
      this.emit('log', message, ...args);
    } catch {}
  }
}
