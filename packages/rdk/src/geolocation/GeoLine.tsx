import { createPortal } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { Group, Vector3 } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import useGeolocationBackend from "./useGeolocationBackend";

import type { LocationBased as LocAR } from "locar";

export interface GeoLineProps {
  /** Array of coordinates forming the line. GeoJSON-style: [lon, lat, elevation?] */
  coordinates: Array<[number, number, number?]>;
  /**
   * Line color.
   * @default "#ff0000"
   */
  color?: string;
  /**
   * Whether line is dashed.
   * @default false
   */
  isDashed?: boolean;
  /**
   * Dash size (requires isDashed=true).
   * @default 3
   */
  dashSize?: number;
  /**
   * Line width (in world units).
   * @default 1
   */
  lineWidth?: number;
  /**
   * Gap size (requires isDashed=true).
   * @default 1
   */
  gapSize?: number;
}

/**
 * Geolocation line component for rendering lines in AR space. Useful for e.g. roads, paths, and routes.
 * Accepts an array of lon/lat coordinates in GeoJSON-style format.
 */
const GeoLine = ({
  coordinates,
  color = "#ff0000",
  isDashed = false,
  dashSize = 3,
  gapSize = 1,
  lineWidth = 1,
}: GeoLineProps) => {
  const geo = useGeolocationBackend();
  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [line, setLine] = useState<Line2 | null>(null);

  useEffect(() => {
    if (!geo.isSuccess || coordinates.length < 2) return;

    const [lon, lat, alt = 0] = coordinates[0];

    const onAttach = (locar: LocAR) => {
      const [originLon, originLat, originElev = 0] = coordinates[0];

      const [originX, originZ] = locar.lonLatToWorldCoords(
        originLon,
        originLat,
      );

      const pts = coordinates.map(([lon, lat, elev = 0]) => {
        const [x, z] = locar.lonLatToWorldCoords(lon, lat);

        return new Vector3(x - originX, elev - originElev, z - originZ);
      });

      const geometry = new LineGeometry().setFromPoints(pts);

      const material = new LineMaterial({
        color,
        dashSize,
        gapSize,
        dashed: isDashed,
        worldUnits: true,
        linewidth: lineWidth,
      });

      const lineObj = new Line2(geometry, material);

      if (isDashed) lineObj.computeLineDistances();

      setLine(lineObj);
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
    color,
    isDashed,
    dashSize,
    gapSize,
    lineWidth,
  ]);

  return createPortal(
    <group>{line && <primitive object={line} />}</group>,
    anchor,
  );
};

export default GeoLine;
