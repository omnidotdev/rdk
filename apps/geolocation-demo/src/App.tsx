import {
  GeoLine,
  GeolocationAnchor,
  GeolocationSession,
  GeoPolygon,
  XR,
} from "@omnidotdev/rdk";
import { Canvas } from "@react-three/fiber";
import { Compass, GPSPin, Landmark } from "components";
import { useState } from "react";

interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Anchors, lines, and zones placed relative to a base location. The base is the
 * user's live GPS position, so everything renders around wherever they stand.
 */
const DemoScene = ({ base }: { base: LatLon }) => {
  const { lat, lon } = base;

  // spread anchors around the base location
  const coords = {
    center: { lat, lon },
    north: { lat: lat + 0.0005, lon },
    south: { lat: lat - 0.0005, lon },
    east: { lat, lon: lon + 0.0007 },
    west: { lat, lon: lon - 0.0007 },
    northeast: { lat: lat + 0.0003, lon: lon + 0.0004 },
  };

  // sample path coordinates (GeoJSON-style: [lon, lat, elevation?])
  const pathCoordinates: Array<[number, number, number?]> = [
    [lon - 0.0003, lat - 0.0002, 2],
    [lon - 0.0001, lat - 0.0001, 2],
    [lon + 0.0001, lat, 2],
    [lon + 0.0003, lat + 0.0001, 2],
    [lon + 0.0005, lat + 0.0003, 2],
  ];

  // sample dashed path coordinates (parallel to solid line, offset north)
  const dashedPathCoordinates: Array<[number, number, number?]> = [
    [lon - 0.0003, lat - 0.0001, 2],
    [lon - 0.0001, lat, 2],
    [lon + 0.0001, lat + 0.0001, 2],
    [lon + 0.0003, lat + 0.0002, 2],
    [lon + 0.0005, lat + 0.0004, 2],
  ];

  // sample polygon coordinates (area/zone)
  const zoneCoordinates: Array<[number, number, number?]> = [
    [lon - 0.0006, lat + 0.0003, 1],
    [lon - 0.0003, lat + 0.0003, 1],
    [lon - 0.0003, lat + 0.0006, 1],
    [lon - 0.0006, lat + 0.0006, 1],
  ];

  return (
    <>
      <GeolocationAnchor
        latitude={coords.center.lat}
        longitude={coords.center.lon}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🟠 Orange box attached!")}
      >
        <mesh scale={3}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </GeolocationAnchor>

      <GeolocationAnchor
        latitude={coords.north.lat}
        longitude={coords.north.lon}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🎯 Main GPS Pin attached!")}
      >
        <GPSPin isAnimated color="#ff4444" scale={15} />
      </GeolocationAnchor>

      <GeolocationAnchor
        latitude={coords.south.lat}
        longitude={coords.south.lon}
        altitude={10}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🔴 Large red cube attached!")}
      >
        <mesh scale={1}>
          <boxGeometry args={[20, 20, 20]} />
          <meshStandardMaterial
            color="red"
            emissive="red"
            emissiveIntensity={0.3}
          />
        </mesh>
      </GeolocationAnchor>

      <GeolocationAnchor
        isBillboard={false}
        latitude={coords.east.lat}
        longitude={coords.east.lon}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🗼 Tower attached!")}
      >
        <Landmark isAnimated type="tower" color="#4a90e2" scale={10} />
      </GeolocationAnchor>

      <GeolocationAnchor
        latitude={coords.west.lat}
        longitude={coords.west.lon}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🧭 Compass attached!")}
      >
        <Compass isAnimated scale={1.2} />
      </GeolocationAnchor>

      <GeolocationAnchor
        isBillboard={false}
        latitude={coords.northeast.lat}
        longitude={coords.northeast.lon}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🏢 Building attached!")}
      >
        <Landmark type="building" color="#27ae60" scale={8} />
      </GeolocationAnchor>

      <GeolocationAnchor
        latitude={coords.center.lat}
        longitude={coords.center.lon + 0.0003}
        // biome-ignore lint/suspicious/noConsole: demo app
        onAttach={() => console.log("🏛️ Monument attached!")}
      >
        <Landmark isAnimated type="monument" color="#8e44ad" scale={0.8} />
      </GeolocationAnchor>

      <GeoLine coordinates={pathCoordinates} color="#ff4444" />

      <GeoLine coordinates={dashedPathCoordinates} color="#ffaa00" isDashed />

      <GeoPolygon coordinates={zoneCoordinates} color="#4488ff" opacity={0.5} />
    </>
  );
};

const App = () => {
  // base location for all anchors; captured from the first live GPS fix so the
  // scene renders around the user wherever they are
  const [base, setBase] = useState<LatLon | null>(null);

  return (
    <Canvas>
      {/* lighting */}
      <ambientLight intensity={1.0} />
      <hemisphereLight intensity={0.8} />
      <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
      <directionalLight position={[-10, 10, -10]} intensity={1} />

      <XR>
        <GeolocationSession
          options={{
            // enable fake GPS for testing on desktop: uncomment and adjust
            // (example: Missoula, MT)
            // fakeLat: 46.8721,
            // fakeLon: -114.009,
            onGpsUpdate: (pos) => {
              // lock the base to the first GPS fix
              setBase((prev) =>
                prev
                  ? prev
                  : { lat: pos.coords.latitude, lon: pos.coords.longitude },
              );
            },
          }}
        >
          {base && <DemoScene base={base} />}
        </GeolocationSession>
      </XR>
    </Canvas>
  );
};

export default App;
