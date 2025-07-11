import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface MinimapConfig {
  scale: number;
  side: boolean;
}
console.log('hello');

const CONFIG_PATH = path.join(app.getPath('userData'), 'minimapConfig.json');

export function loadMinimapConfig(): MinimapConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // if missing or invalid, return defaults
    return { scale: 50, side: true };
  }
}

export function saveMinimapConfig(cfg: MinimapConfig): void {
    console.log("saved: ",cfg)
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8');
}
