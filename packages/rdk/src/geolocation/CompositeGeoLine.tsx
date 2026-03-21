import { createPortal } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";

import useGeolocationBackend from "./useGeolocationBackend";

import type { LocationBased as LocAR } from "locar";

export interface CompositeGeoLineProps {
  /** Array of coordinates forming the line. GeoJSON-style: [lon, lat, elevation?] */
  coordinates: Array<[number, number, number?]>;
  /**
   * Line color.
   * @default "#ff0000"
   */
  color: number;
  /**
   * Line width (in world units).
   * @default 1
   */
  lineWidth?: number;
}

/**
 * Geolocation line component for rendering lines in AR space. Useful for e.g. roads, paths, and routes.
 * Accepts an array of lon/lat coordinates in GeoJSON-style format.
 */
const CompositeGeoLine = ({
  coordinates = new Array<[number, number, number?]>(),
  color = 0xff0000,
  lineWidth = 1,
}: CompositeGeoLineProps) => {
  const geo = useGeolocationBackend();
  const [anchor] = useState(() => new Group());
  const anchorId = useMemo(() => Math.random().toString(36).slice(2, 11), []);
  const [line, setLine] = useState<Mesh | null>(null);

  useEffect(() => {
    if (!geo.isSuccess || coordinates.length < 2) return;
    //    console.log("effect: CompositeGeoLine");

    const [lon, lat, alt = -10] = coordinates[0];

    const makeWayGeom = (vertices: Vector3[], width = 1) => {
      let dx = 0,
        dy = 0,
        dz = 0,
        len = 0,
        dxperp = 0,
        dzperp = 0,
        nextVtxProvisional: number[] = [],
        thisVtxProvisional: number[] = [];
      const k = vertices.length - 1;
      const realVertices: number[] = [];
      for (let i = 0; i < k; i++) {
        dx = vertices[i + 1].x - vertices[i].x;
        dz = vertices[i + 1].z - vertices[i].z;
        dy = vertices[i + 1].y - vertices[i].y;
        len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        dxperp = -(dz * (width / 2)) / len;
        dzperp = (dx * (width / 2)) / len;
        thisVtxProvisional = [
          vertices[i].x - dxperp,
          vertices[i].y,
          vertices[i].z - dzperp,
          vertices[i].x + dxperp,
          vertices[i].y,
          vertices[i].z + dzperp,
        ];
        if (i > 0) {
          // Ensure the vertex positions are influenced not just by this segment but also the previous segment
          thisVtxProvisional.forEach((vtx, j) => {
            vtx = (vtx + nextVtxProvisional[j]) / 2;
          });
        }
        realVertices.push(...thisVtxProvisional);
        nextVtxProvisional = [
          vertices[i + 1].x - dxperp,
          vertices[i + 1].y,
          vertices[i + 1].z - dzperp,
          vertices[i + 1].x + dxperp,
          vertices[i + 1].y,
          vertices[i + 1].z + dzperp,
        ];
      }
      realVertices.push(vertices[k].x - dxperp);
      realVertices.push(vertices[k].y);
      realVertices.push(vertices[k].z - dzperp);
      realVertices.push(vertices[k].x + dxperp);
      realVertices.push(vertices[k].y);
      realVertices.push(vertices[k].z + dzperp);

      let indices: number[] = [];
      for (let i = 0; i < k; i++) {
        indices.push(i * 2, i * 2 + 1, i * 2 + 2);
        indices.push(i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }

      let geom = new BufferGeometry();
      let bufVertices = new Float32Array(realVertices);
      geom.setIndex(indices);
      geom.setAttribute("position", new BufferAttribute(bufVertices, 3));
      geom.computeBoundingBox();
      return geom;
    };

    const onAttach = (locar: LocAR) => {
      const [originLon, originLat, originElev = 0] = coordinates[0];

      const [originX, originZ] = locar.lonLatToWorldCoords(
        originLon,
        originLat,
      );

      const pts = coordinates.map(([lon, lat, elev = -10]) => {
        const [x, z] = locar.lonLatToWorldCoords(lon, lat);

        return new Vector3(x - originX, elev - originElev, z - originZ);
      });

      const geometry = makeWayGeom(pts, lineWidth);

      const material = new MeshBasicMaterial({ color, side: DoubleSide });

      // console.log('geometry:');
      // console.log(geometry);
      const mesh = new Mesh(geometry, material);

      if (line === null) setLine(mesh);
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
    line,
    lineWidth,
  ]);

  return createPortal(
    <group>{line && <primitive object={line} />}</group>,
    anchor,
  );
};

export default CompositeGeoLine;
