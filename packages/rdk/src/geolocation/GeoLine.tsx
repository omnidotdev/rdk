import { createPortal } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import useGeolocationBackend from "./useGeolocationBackend";

import type { LocationBased as LocAR } from "locar";
import type { ColorRepresentation } from "three";

export interface GeoLineProps {
  /** Array of coordinates forming the line. GeoJSON-style: [lon, lat, elevation?] */
  coordinates: Array<[number, number, number?]>;
  /**
   * Line color.
   * @default "#ff0000"
   */
  color?: ColorRepresentation;
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

/** Build a triangle-strip mesh geometry from a polyline for smooth, artifact-free rendering. */
const buildTriStripGeometry = (vertices: Vector3[], width: number) => {
  const k = vertices.length - 1;
  const positions: number[] = [];

  let prevDxPerp = 0;
  let prevDzPerp = 0;

  for (let i = 0; i < k; i++) {
    const dx = vertices[i + 1].x - vertices[i].x;
    const dy = vertices[i + 1].y - vertices[i].y;
    const dz = vertices[i + 1].z - vertices[i].z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const halfWidth = width / 2;
    const dxPerp = -(dz * halfWidth) / len;
    const dzPerp = (dx * halfWidth) / len;

    // Average with previous segment's perpendicular for smooth joints
    const avgDxPerp = i > 0 ? (dxPerp + prevDxPerp) / 2 : dxPerp;
    const avgDzPerp = i > 0 ? (dzPerp + prevDzPerp) / 2 : dzPerp;

    positions.push(
      vertices[i].x - avgDxPerp,
      vertices[i].y,
      vertices[i].z - avgDzPerp,
      vertices[i].x + avgDxPerp,
      vertices[i].y,
      vertices[i].z + avgDzPerp,
    );

    prevDxPerp = dxPerp;
    prevDzPerp = dzPerp;
  }

  // Last vertex uses the final segment's perpendicular
  positions.push(
    vertices[k].x - prevDxPerp,
    vertices[k].y,
    vertices[k].z - prevDzPerp,
    vertices[k].x + prevDxPerp,
    vertices[k].y,
    vertices[k].z + prevDzPerp,
  );

  const indices: number[] = [];
  for (let i = 0; i < k; i++) {
    indices.push(i * 2, i * 2 + 1, i * 2 + 2);
    indices.push(i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }

  const geometry = new BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.computeBoundingBox();

  return geometry;
};

/**
 * Geolocation line component for rendering lines in AR space. Useful for e.g. roads, paths, and routes.
 * Uses triangle-strip meshes for smooth rendering. Falls back to Line2 when dashing is enabled.
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
  const geoRef = useRef(geo);
  geoRef.current = geo;

  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [line, setLine] = useState<Line2 | Mesh | null>(null);

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

      if (isDashed) {
        const geometry = new LineGeometry().setFromPoints(pts);

        const material = new LineMaterial({
          color,
          dashSize,
          gapSize,
          dashed: true,
          worldUnits: true,
          linewidth: lineWidth,
        });

        const lineObj = new Line2(geometry, material);
        lineObj.computeLineDistances();
        setLine(lineObj);
      } else {
        const geometry = buildTriStripGeometry(pts, lineWidth);
        const material = new MeshBasicMaterial({ color, side: DoubleSide });
        setLine(new Mesh(geometry, material));
      }
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

      setLine((prev) => {
        if (prev) {
          prev.geometry.dispose();

          const material = prev.material as MeshBasicMaterial | LineMaterial;
          material.dispose();
        }

        return null;
      });
    };
  }, [
    anchorId,
    anchor,
    coordinates,
    color,
    isDashed,
    dashSize,
    gapSize,
    lineWidth,
    geo.isSuccess,
  ]);

  return createPortal(
    <group>{line && <primitive object={line} />}</group>,
    anchor,
  );
};

export default GeoLine;
