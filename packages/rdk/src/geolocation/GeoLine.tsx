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
import { getColorKey, useMaterialStore } from "./useMaterialStore";

import type { EventHandlers } from "@react-three/fiber";
import type { LocAR } from "locar";
import type { ColorRepresentation } from "three";

export interface GeoLineProps extends Partial<EventHandlers> {
  /** Array of coordinates forming the line. GeoJSON-style: [lon, lat, elevation?] */
  coordinates: Array<[number, number, number?]>;
  /**
   * Line color.
   * @default "#ff0000"
   */
  color?: ColorRepresentation;
  /**
   * Whether line is dashed. When enabled, falls back to Line2 rendering.
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
  /**
   * Opacity
   * @default 1
   */
  opacity?: number;
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
  opacity = 1,
  ...events
}: GeoLineProps) => {
  const geo = useGeolocationBackend();
  const geoRef = useRef(geo);
  geoRef.current = geo;

  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [line, setLine] = useState<Line2 | Mesh | null>(null);

  const acquireMaterial = useMaterialStore((store) => store.acquireMaterial);
  const releaseMaterial = useMaterialStore((store) => store.releaseMaterial);

  useEffect(() => {
    if (!geo.isSuccess || coordinates.length < 2) return;

    // track what this effect acquired in its own closure so cleanup can release
    // it directly (state updaters never run after unmount)
    let lineObj: Line2 | Mesh | null = null;
    let materialKey: string | null = null;

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

      // non-dashed line width lives in the geometry, not the material
      const key = `${getColorKey(color)}:${opacity.toFixed(2)}:${isDashed ? `${lineWidth}:1:${dashSize}:${gapSize}` : ":0"}`;
      materialKey = key;

      if (isDashed) {
        const geometry = new LineGeometry().setFromPoints(pts);

        const material = acquireMaterial(
          key,
          () =>
            new LineMaterial({
              color,
              dashSize,
              gapSize,
              dashed: true,
              worldUnits: true,
              linewidth: lineWidth,
              transparent: opacity < 1,
              opacity,
            }),
        );
        const dashedLine = new Line2(geometry, material as LineMaterial);
        dashedLine.computeLineDistances();
        lineObj = dashedLine;
      } else {
        const geometry = buildTriStripGeometry(pts, lineWidth);
        const material = acquireMaterial(
          key,
          () =>
            new MeshBasicMaterial({
              color,
              transparent: opacity < 1,
              opacity,
              side: DoubleSide,
            }),
        );
        lineObj = new Mesh(geometry, material);
      }

      setLine(lineObj);
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

      lineObj?.geometry.dispose();
      if (materialKey) releaseMaterial(materialKey);

      setLine(null);
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
    opacity,
    geo.isSuccess,
  ]);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: <group> is an R3F WebGL scene object, not a DOM element; these are three.js raycast events with no a11y semantics
    <group {...events}>{line && <primitive object={line} />}</group>,
    anchor,
  );
};

export default GeoLine;
