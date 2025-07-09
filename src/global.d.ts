export {};

declare global {
  interface Window {
    osr: {
      onJungleCampSpawn(callback: (data: any) => void): void;
      setMinimapScale(scale: number): Promise<void>;
      setMinimapSide(side: 0 | 1): Promise<void>;
    };
  }
}