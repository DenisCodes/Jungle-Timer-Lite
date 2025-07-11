import path from "path";
import { OverlayService } from '../services/overlay.service';
import { OverlayBrowserWindow, OverlayWindowOptions, PassthroughType, ZOrderType } from "@overwolf/ow-electron-packages-types";
import { loadMinimapConfig } from '../../config/minimap';

export class DemoOSRWindowController {
  private overlayWindow: OverlayBrowserWindow = null;
  private minimapScale = 1.0;
  private minimapSide: boolean; 

  public get overlayBrowserWindow() : OverlayBrowserWindow {
    return this.overlayWindow;
  }

  constructor(private readonly overlayService: OverlayService) {
    this.overlayService.on('game-window-changed', () => {
      const gameWindowInfo = this.overlayService.overlayApi.getActiveGameInfo()?.gameWindowInfo;
      if (gameWindowInfo?.size) {
        this.updateOverlayWindowSize(gameWindowInfo.size.width, gameWindowInfo.size.height);
      }
    });
  }  

  public async createAndShow(showDevTools: boolean) {
    const { scale, side } = loadMinimapConfig();
    this.setMinimapScale(scale);
    this.setMinimapSide(side);
    console.log('scale: ',scale);
    console.log('side: ',side);

    const options: OverlayWindowOptions = {
      name: 'osrWindow-' + Math.floor(Math.random() * 1000),
      height: 600,
      width: 450,
      show: true,
      frame: false,
      transparent: true,
      resizable: true,
      webPreferences: {
        preload: path.join(__dirname, '../renderer/preload.js'),
        devTools: showDevTools,
        nodeIntegration: false,
        contextIsolation: true,
      },
    };

    const activeGame = this.overlayService.overlayApi.getActiveGameInfo();
    const gameWindowInfo = activeGame?.gameWindowInfo;

    const screenWidth = gameWindowInfo?.size.width || 2560;
    const screenHeight = gameWindowInfo?.size.height || 1440;

    options.x = screenWidth - options.width;
    options.y = screenHeight - options.height;


    this.overlayWindow = await this.overlayService.createNewOsrWindow(
      options,
    );

    this.overlayService.registerWindow('osrWindow', this.overlayWindow);

    this.registerToIpc();

    this.registerToWindowEvents();

    await this.overlayWindow.window.loadURL(
      path.join(__dirname, '../renderer/osr.html')
    );

    this.overlayWindow.window.show();
  }

  private registerToIpc() {
    const windowIpc = this.overlayWindow.window.webContents.ipc;

    windowIpc.on('resizeOsrClick', (e) => {
      this.handleResizeCommand();
    });

    windowIpc.on('moveOsrClick', (e) => {
      this.handleMoveCommand();
    });

    windowIpc.on('minimizeOsrClick', (e) => {
      const window = this.overlayWindow.window;
      window?.minimize();
    });

    windowIpc.on('setPassthrough', (e, value) => {
      let pass = parseInt(value);
      this.setWindowPassthrough(pass);
    });

    windowIpc.on('setZorder', (e, value) => {
      let zOrder = parseInt(value);
      this.setWindowZorder(zOrder);
    });

    windowIpc.on('devtools', () => {
      this.overlayWindow.window.webContents.openDevTools({ mode: 'detach' });
    });
  }

  private registerToWindowEvents() {
    const browserWindow = this.overlayWindow.window;
    browserWindow.on('closed', () =>{
      this.overlayWindow = null;
      console.log('osr window closed');
    })
  }

  private handleResizeCommand() {
    const window = this.overlayWindow.window;

    window?.setSize(this.randomInteger(100, 500), this.randomInteger(100, 500));
  }

  private handleMoveCommand() {
    const { overlayApi } = this.overlayService;

    const gameWindowInfo = overlayApi.getActiveGameInfo()?.gameWindowInfo;
    if (!gameWindowInfo) {
      return;
    }

    const window = this.overlayWindow.window;
    window?.setPosition(
      this.randomInteger(0, gameWindowInfo.size.width - 100),
      this.randomInteger(0, gameWindowInfo.size.height - 100)
    );
  }

  private setWindowPassthrough(pass: PassthroughType) {
    this.overlayWindow.overlayOptions.passthrough = pass;
  }

  private setWindowZorder(zOrder: ZOrderType) {
    this.overlayWindow.overlayOptions.zOrder = zOrder;
  }

  private randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private updateOverlayWindowSize(width: number, height: number) {
    if (this.overlayWindow?.window) {
      this.overlayWindow.window.setSize(width, height);

      const screenWidth = this.overlayService.overlayApi.getActiveGameInfo()?.gameWindowInfo?.size?.width || 2560;
      const screenHeight = this.overlayService.overlayApi.getActiveGameInfo()?.gameWindowInfo?.size?.height || 1440;

      const x = screenWidth - 450;
      const y = screenHeight - 600;
      
      // console.log('screenWidth: ',screenWidth);
      // console.log('screenHeight: ',screenHeight);
      // console.log('X: ',x);
      // console.log('Y: ',y);

      this.overlayWindow.window.setPosition(x, y);
    }
  }

  public setMinimapScale(scale: number) {
    this.minimapScale = scale;
    console.log('scale: ',this.minimapScale);
    //this.updateOverlayWindow();
  }

  /** Called by IPC handler */
  public setMinimapSide(side: boolean) {
    this.minimapSide = side;
    console.log('side: ',this.minimapSide);
    //this.updateOverlayWindow();
  }

  /** Central resize/position logic */
  private updateOverlayWindow() {
    if (!this.overlayWindow) return;
    const info = this.overlayService.overlayApi
      .getActiveGameInfo()?.gameWindowInfo;
    if (!info) return;

    // 1) Compute new size
    const baseW = 450;   // your “native” minimap width
    const baseH = 600;   // your “native” minimap height
    const w = Math.round(baseW * this.minimapScale);
    const h = Math.round(baseH * this.minimapScale);
    this.overlayWindow.window.setSize(w, h);

    // 2) Compute new position
    // const x = this.minimapSide === 1
    //   ? info.position.x                      // left
    //   : info.position.x + (info.size.width - w); // right
    // const y = info.position.y + (info.size.height - h);
    // this.overlayWindow.window.setPosition(x, y);
  }
}