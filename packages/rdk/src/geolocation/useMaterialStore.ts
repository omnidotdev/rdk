import { create } from "zustand";

import type { Material } from "three";
import type { LineMaterial } from "three/examples/jsm/Addons.js";

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

export const useMaterialStore = create<MaterialStore>((set) => ({
  materialStore: new Map<string, RefCountedMaterial>(),
  acquireMaterial: (
    key: string,
    materialProvider: () => GeoMaterial,
  ): GeoMaterial => {
    let material: RefCountedMaterial | null;
    set((state) => {
      material = state.materialStore.get(key) ?? null;
      if (material === null) {
        const mtl = materialProvider();
        const store = new Map(state.materialStore);
        material = { material: mtl, refCount: 1 };
        store.set(key, material);
        return { materialStore: store };
      } else {
        material.refCount++;
        return { materialStore: state.materialStore };
      }
    });
    return material!.material;
  },
  releaseMaterial: (key: string): boolean => {
    let result = false;
    set((state) => {
      const material = state.materialStore.get(key);
      if (material !== undefined && material.refCount > 0) {
        if (--material.refCount === 0) {
          material.material?.dispose();
          const store = new Map(state.materialStore);
          store.delete(key);
          return { materialStore: store };
        }
        result = true;
      }
      return { materialStore: state.materialStore };
    });
    return result;
  },
}));
