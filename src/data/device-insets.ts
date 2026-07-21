import rawInsets from "./device-insets.json";

type ViewBox = { w: number; h: number };
type ScreenInsets = { x: number; y: number; w: number; h: number; radius?: number };

export type DeviceSceneInsets = {
  viewBox: ViewBox;
  ipad: {
    screen: ScreenInsets;
  };
};

function loadSceneInsets(): DeviceSceneInsets {
  const scene = (rawInsets as { scene?: DeviceSceneInsets }).scene;
  if (!scene?.viewBox || !scene.ipad?.screen) {
    throw new Error(
      "device-insets.json is missing scene.ipad.screen. Regenerate with: node scripts/process-ipad-scene.mjs",
    );
  }
  return scene;
}

/** Screen-hole metadata for the iPad scene PNG frame. */
export const DEVICE_SCENE_INSETS = loadSceneInsets();
