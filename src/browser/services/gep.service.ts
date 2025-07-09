import { app as electronApp } from 'electron';
import { overwolf } from '@overwolf/ow-electron'; // TODO: will be @overwolf/ow-electron
import EventEmitter from 'events';
import { OverlayService } from '../services/overlay.service';

const app = electronApp as overwolf.OverwolfApp;

/**
 * Service used to register for Game Events,
 * receive games events, and then send them to a window for visual feedback
 */
export class GameEventsService extends EventEmitter {
  private gepApi: overwolf.packages.OverwolfGameEventPackage;
  private activeGame = 0;
  private gepGamesId: number[] = [];

  // 🔵 Add reference to OverlayService
  constructor(private readonly overlayService: OverlayService) {
    super();
    this.registerOverwolfPackageManager();
  }

  /**
   * For gep supported games goto:
   * https://overwolf.github.io/api/electron/game-events/
   */
  public registerGames(gepGamesId: number[]) {
    this.emit('log', `register to game events for `, gepGamesId);
    this.gepGamesId = gepGamesId;
  }

  public async setRequiredFeaturesForAllSupportedGames() {
    await Promise.all(this.gepGamesId.map(async (gameId) => {
      this.emit('log', `set-required-feature for: ${gameId}`);
      await this.gepApi.setRequiredFeatures(gameId, ['jungle_camps']);
    }));
  }

  public async getInfoForActiveGame(): Promise<any> {
    if (this.activeGame == 0) {
      return 'getInfo error - no active game';
    }
    return await this.gepApi.getInfo(this.activeGame);
  }

  private registerOverwolfPackageManager() {
    app.overwolf.packages.on('ready', (e, packageName, version) => {
      if (packageName !== 'gep') {
        return;
      }

      this.emit('log', `gep package is ready: ${version}`);
      this.onGameEventsPackageReady();
      this.emit('ready');
    });
  }

  private async onGameEventsPackageReady() {
    this.gepApi = app.overwolf.packages.gep;
    this.gepApi.removeAllListeners();

    this.gepApi.on('game-detected', (e, gameId, name, gameInfo) => {
      if (!this.gepGamesId.includes(gameId)) {
        this.emit('log', 'gep: skip game-detected', gameId, name, gameInfo.pid);
        return;
      }

      this.emit('log', 'gep: register game-detected', gameId, name, gameInfo);
      e.enable();
      this.activeGame = gameId;
    });

    //@ts-ignore
    this.gepApi.on('game-exit', (e, gameId, processName, pid) => {
      console.log('gep game exit', gameId, processName, pid);
    });

    this.gepApi.on('elevated-privileges-required', (e, gameId, ...args) => {
      this.emit('log', 'elevated-privileges-required', gameId, ...args);
    });

    this.gepApi.on('new-info-update', (e, gameId, ...args) => {
      this.emit('log', 'info-update', gameId, ...args);

      if (args && args.length > 0) {
        const eventData = args[0];
        if (eventData.feature === 'jungle_camps' && eventData.value) {
          this.overlayService.sendToOverlay('osrWindow', 'jungle_camp_spawn', eventData);
        }
      }
    });

    this.gepApi.on('new-game-event', (e, gameId, ...args) => {
      this.emit('log', 'new-event', gameId, ...args);
      console.log('game');
    });

    this.gepApi.on('error', (e, gameId, error, ...args) => {
      this.emit('log', 'gep-error', gameId, error, ...args);
      this.activeGame = 0;
    });
  }
}
