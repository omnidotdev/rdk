import { Color } from "three";
import { create } from "zustand";

import type { ColorRepresentation, Material } from "three";
import type { LineMaterial } from "three/addons/lines/LineMaterial.js";

export type GeoMaterial = Material | LineMaterial;

export interface MaterialStore {
  materialStore: Map<string, RefCountedMaterial>;
  acquireMaterial: (
    key: string,
    materialProvider: () => GeoMaterial,
  ) => GeoMaterial;
  releaseMaterial: (key: string) => boolean;
}

interface RefCountedMaterial {
  refCount: number;
  material: GeoMaterial;
}

/**
 * Normalize a color to a stable cache key segment, so equivalent colors share
 * a material regardless of how they were specified.
 */
export const getColorKey = (color: ColorRepresentation): string =>
  new Color(color).getHexString();

export const useMaterialStore = create<MaterialStore>((set, get) => ({
  materialStore: new Map<string, RefCountedMaterial>(),
  acquireMaterial: (
    key: string,
    materialProvider: () => GeoMaterial,
  ): GeoMaterial => {
    const cached = get().materialStore.get(key);

    if (cached) {
      cached.refCount++;

      return cached.material;
    }

    const material = materialProvider();

    set((state) => {
      const store = new Map(state.materialStore);
      store.set(key, { material, refCount: 1 });

      return { materialStore: store };
    });

    return material;
  },
  releaseMaterial: (key: string): boolean => {
    const cached = get().materialStore.get(key);

    if (!cached) return false;

    cached.refCount--;

    if (cached.refCount > 0) return true;

    cached.material.dispose();

    set((state) => {
      const store = new Map(state.materialStore);
      store.delete(key);

      return { materialStore: store };
    });

    return false;
  },
}));
