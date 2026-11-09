import { create } from "zustand";

import type { Material } from "three";
import type { LineMaterial } from "three/examples/jsm/Addons.js";

export type MaterialMap = { [materialKey: string]: Material | LineMaterial };

export interface MaterialStore {
  materialStore: MaterialMap;
  addMaterial: (key: string, value: Material | LineMaterial) => void;
}

export const useMaterialStore = create<MaterialStore>((set) => ({
  materialStore: {} as MaterialMap,
  addMaterial: (key: string, material: Material | LineMaterial) =>
    set((state) => {
      return { materialStore: { ...state.materialStore, [key]: material } };
    }),
}));
