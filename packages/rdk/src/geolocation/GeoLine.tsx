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
import { useMaterialStore } from "./useMaterialStore";

import type { ThreeEvent } from "@react-three/fiber";
import type { LocAR } from "locar";
import type { ColorRepresentation, Material } from "three";

interface KeyedLine {
  key: string;
  line: Line2 | Mesh;
}

export interface GeoLineProps {
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
   * Click event handler. When omitted, the line is not registered for pointer raycasting.
   */
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  /**
   * Pointer out event handler. When omitted, the line is not registered for pointer raycasting.
   */
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  /**
   * Pointer over event handler. When omitted, the line is not registered for pointer raycasting.
   */
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
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
  onClick,
  onPointerOut,
  onPointerOver,
  opacity = 1,
}: GeoLineProps) => {
  const geo = useGeolocationBackend();
  const geoRef = useRef(geo);
  geoRef.current = geo;

  //const addMaterial = useMaterialStore((state) => state.addMaterial);

  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [line, setLine] = useState<KeyedLine | null>(null);

  const acquireMaterial = useMaterialStore((store) => store.acquireMaterial);
  const releaseMaterial = useMaterialStore((store) => store.releaseMaterial);
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

      const wayType = `${color.toString()}:${opacity.toFixed(2)}:${lineWidth}:${isDashed ? `1:${dashSize}:${gapSize}` : "0"}`;
      //const materialStore = useMaterialStore.getState().materialStore;
      let material: Material | LineMaterial | null = null;

      if (isDashed) {
        const geometry = new LineGeometry().setFromPoints(pts);

        material = acquireMaterial(
          wayType,
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
        const lineObj = new Line2(geometry, material as LineMaterial);
        lineObj.computeLineDistances();
        setLine({ key: wayType, line: lineObj });
      } else {
        const geometry = buildTriStripGeometry(pts, lineWidth);
        material = acquireMaterial(
          wayType,
          () =>
            new MeshBasicMaterial({
              color,
              transparent: opacity < 1,
              opacity,
              side: DoubleSide,
            }),
        );
        setLine({ key: wayType, line: new Mesh(geometry, material) });
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
          prev.line.geometry.dispose();
          releaseMaterial(prev.key);
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
    opacity,
    geo.isSuccess,
  ]);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: <group> is an R3F WebGL scene object, not a DOM element; these are three.js raycast events with no a11y semantics
    <group
      onClick={onClick}
      onPointerOut={onPointerOut}
      onPointerOver={onPointerOver}
    >
      {line?.line && <primitive object={line.line} />}
    </group>,
    anchor,
  );
};

export default GeoLine;
