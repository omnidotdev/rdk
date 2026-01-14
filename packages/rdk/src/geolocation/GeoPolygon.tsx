import { createPortal } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import {
  BackSide,
  DoubleSide,
  FrontSide,
  Group,
  Path,
  Shape,
  ShapeGeometry,
} from "three";

import useGeolocationBackend from "./useGeolocationBackend";

import type { LocationBased as LocAR } from "locar";
import type { Side } from "three";

export interface GeoPolygonProps {
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
}: GeoPolygonProps) => {
  const geo = useGeolocationBackend();
  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [geometryData, setGeometryData] = useState<{
    geometry: ShapeGeometry;
    avgElevation: number;
  } | null>(null);

  useEffect(() => {
    if (!geo.isSuccess || coordinates.length < 3) return;

    const [lon, lat, alt = 0] = coordinates[0];

    // `onAttach` receives `locar` directly from the backend - no stale closure
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
    };

    geo.registerAnchor(anchorId, {
      anchor,
      isAttached: false,
      latitude: lat,
      longitude: lon,
      altitude: alt,
      onAttach,
    });

    return () => {
      geo.unregisterAnchor(anchorId);
    };
  }, [
    geo.isSuccess,
    geo.registerAnchor,
    geo.unregisterAnchor,
    anchorId,
    anchor,
    coordinates,
    holes,
  ]);

  return createPortal(
    <group>
      {geometryData && (
        <group position={[0, geometryData.avgElevation, 0]}>
          <mesh geometry={geometryData.geometry}>
            <meshBasicMaterial
              color={color}
              opacity={opacity}
              transparent={opacity < 1}
              wireframe={isWireframe}
              side={SIDE_MAP[side]}
            />
          </mesh>
        </group>
      )}
    </group>,
    anchor,
  );
};

export default GeoPolygon;
