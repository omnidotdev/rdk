import { createPortal } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackSide,
  DoubleSide,
  FrontSide,
  Group,
  MeshBasicMaterial,
  Path,
  Shape,
  ShapeGeometry,
} from "three";

import useGeolocationBackend from "./useGeolocationBackend";
import { useMaterialStore } from "./useMaterialStore";

import type { EventHandlers } from "@react-three/fiber";
import type { LocAR } from "locar";
import type { Material, Side } from "three";

export interface GeoPolygonProps extends Partial<EventHandlers> {
  /** Outer ring coordinates. GeoJSON-style: [lon, lat, elevation?] */
  coordinates: Array<[number, number, number?]>;
  /**
   * Optional inner rings (holes).
   */
  holes?: Array<Array<[number, number, number?]>>;
  /**
   * Fill color.
   * @default "#ff0000"
   */
  color?: string;
  /**
   * Fill opacity (0-1).
   * @default 1
   */
  opacity?: number;
  /**
   * Whether to render as wireframe.
   * @default false
   */
  isWireframe?: boolean;
  /**
   * Side to render: front, back, or double.
   * @default "double"
   */
  side?: "front" | "back" | "double";
}

interface KeyedMaterial {
  key: string;
  material: Material;
}

const SIDE_MAP: Record<"front" | "back" | "double", Side> = {
  front: FrontSide,
  back: BackSide,
  double: DoubleSide,
};

/**
 * Geolocation polygon component for rendering filled areas in AR space.
 * Accepts an array of lon/lat coordinates in GeoJSON-style format.
 */
const GeoPolygon = ({
  coordinates,
  holes,
  color = "#ff0000",
  opacity = 1,
  isWireframe = false,
  side = "double",
  ...events
}: GeoPolygonProps) => {
  const geo = useGeolocationBackend();
  const geoRef = useRef(geo);
  geoRef.current = geo;

  //const addMaterial = useMaterialStore((store) => store.addMaterial);

  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [geometryData, setGeometryData] = useState<{
    geometry: ShapeGeometry;
    avgElevation: number;
  } | null>(null);

  const acquireMaterial = useMaterialStore((store) => store.acquireMaterial);
  const releaseMaterial = useMaterialStore((store) => store.releaseMaterial);

  const [material, setMaterial] = useState<KeyedMaterial | null>(null);

  useEffect(() => {
    if (!geo.isSuccess || coordinates.length < 3) return;

    const [lon, lat, alt = 0] = coordinates[0];

    const onAttach = (locar: LocAR) => {
      const [originLon, originLat, originElev = 0] = coordinates[0];

      const [originX, originZ] = locar.lonLatToWorldCoords(
        originLon,
        originLat,
      );

      // convert outer ring to local coordinates
      const outerPoints: Array<{ x: number; z: number; elev: number }> = [];

      for (const [lon, lat, elev = 0] of coordinates) {
        const [x, z] = locar.lonLatToWorldCoords(lon, lat);
        outerPoints.push({
          x: x - originX,
          z: z - originZ,
          elev: elev - originElev,
        });
      }

      // create shape from outer ring
      const shape = new Shape();

      shape.moveTo(outerPoints[0].x, outerPoints[0].z);

      for (let i = 1; i < outerPoints.length; i++) {
        shape.lineTo(outerPoints[i].x, outerPoints[i].z);
      }

      shape.closePath();

      // add holes if provided
      if (holes && holes.length > 0) {
        for (const hole of holes) {
          if (hole.length < 3) continue;

          const holePath = new Path();

          const [firstLon, firstLat] = hole[0];

          const [firstX, firstZ] = locar.lonLatToWorldCoords(
            firstLon,
            firstLat,
          );
          holePath.moveTo(firstX - originX, firstZ - originZ);

          for (let i = 1; i < hole.length; i++) {
            const [lon, lat] = hole[i];
            const [x, z] = locar.lonLatToWorldCoords(lon, lat);
            holePath.lineTo(x - originX, z - originZ);
          }

          holePath.closePath();

          shape.holes.push(holePath);
        }
      }

      const shapeGeometry = new ShapeGeometry(shape);

      // calculate average elevation
      const totalElev = outerPoints.reduce((sum, p) => sum + p.elev, 0);
      const avgElevation = totalElev / outerPoints.length;

      // rotate to lie flat on XZ plane
      shapeGeometry.rotateX(-Math.PI / 2);

      setGeometryData({ geometry: shapeGeometry, avgElevation });

      const wayType = `${color}:${opacity.toFixed(2)}::2:${isWireframe}:${side}`; // 0=normal line, 1=dashed line, 2=polygon
      const material = acquireMaterial(
        wayType,
        () =>
          new MeshBasicMaterial({
            color,
            transparent: opacity < 1,
            wireframe: isWireframe,
            opacity,
            side: SIDE_MAP[side],
          }),
      );
      setMaterial({ key: wayType, material });
    };

    geoRef.current.registerAnchor(anchorId, {
      anchor,
      isAttached: false,
      latitude: lat,
      longitude: lon,
      altitude: alt,
      onAttach,
    });

    return () => {
      geoRef.current.unregisterAnchor(anchorId);
      if (material !== null) {
        releaseMaterial(material.key);
      }

      setGeometryData((prev) => {
        if (prev) prev.geometry.dispose();

        return null;
      });
    };
  }, [
    anchorId,
    anchor,
    coordinates,
    holes,
    geo.isSuccess,
    color,
    opacity,
    side,
    isWireframe,
  ]);

  return createPortal(
    <group>
      {geometryData && material?.material && (
        <group position={[0, geometryData.avgElevation, 0]}>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: <mesh> is an R3F WebGL scene object, not a DOM element; these are three.js raycast events with no a11y semantics */}
          <mesh
            geometry={geometryData.geometry}
            material={material.material}
            {...events}
          />
        </group>
      )}
    </group>,
    anchor,
  );
};

export default GeoPolygon;
