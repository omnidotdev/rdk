import { XR, GeolocationSession, GeolocationAnchor } from "@omnidotdev/rdk";
import { Canvas } from "@react-three/fiber";

import { GPSPin, Landmark, Compass } from "components";

// set these to your preferred location
const BASE_LATITUDE = 48.68951980519457,
  BASE_LONGITUDE = -113.6363247804274;

// spread anchors around the base location
const COORDS = {
  center: { lat: BASE_LATITUDE, lon: BASE_LONGITUDE },
  north: { lat: BASE_LATITUDE + 0.0005, lon: BASE_LONGITUDE },
  south: { lat: BASE_LATITUDE - 0.0005, lon: BASE_LONGITUDE },
  east: { lat: BASE_LATITUDE, lon: BASE_LONGITUDE + 0.0007 },
  west: { lat: BASE_LATITUDE, lon: BASE_LONGITUDE - 0.0007 },
  northeast: { lat: BASE_LATITUDE + 0.0003, lon: BASE_LONGITUDE + 0.0004 },
};

const App = () => (
  <Canvas
    gl={{
      antialias: false,
      powerPreference: "default",
    }}
  >
    {/* lighting */}
    <ambientLight intensity={1.0} />
    <hemisphereLight intensity={0.8} />
    <directionalLight position={[10, 10, 10]} intensity={2} castShadow />
    <directionalLight position={[-10, 10, -10]} intensity={1} />

    <XR cameraSource="video">
      <GeolocationSession
        options={
          {
            // enable fake GPS for testing: uncomment and adjust to preferred location
            // fakeLat: BASE_LATITUDE,
            // fakeLon: BASE_LONGITUDE,
          }
        }
      >
        <GeolocationAnchor
          latitude={COORDS.center.lat}
          longitude={COORDS.center.lon}
          onAttached={() => console.log("🟠 Orange box attached!")}
        >
          <mesh scale={3}>
            <boxGeometry args={[0.4, 0.4, 0.4]} />
            <meshStandardMaterial color="orange" />
          </mesh>
        </GeolocationAnchor>

        <GeolocationAnchor
          latitude={COORDS.north.lat}
          longitude={COORDS.north.lon}
          onAttached={() => console.log("🎯 Main GPS Pin attached!")}
          onGpsUpdate={(pos) => console.log("📍 GPS update:", pos)}
        >
          <GPSPin isAnimated color="#ff4444" scale={15} />
        </GeolocationAnchor>

        <GeolocationAnchor
          latitude={COORDS.south.lat}
          longitude={COORDS.south.lon}
          altitude={10}
          onAttached={() => console.log("🔴 Large red cube attached!")}
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
          latitude={COORDS.east.lat}
          longitude={COORDS.east.lon}
          onAttached={() => console.log("🗼 Tower attached!")}
        >
          <Landmark isAnimated type="tower" color="#4a90e2" scale={10} />
        </GeolocationAnchor>

        <GeolocationAnchor
          latitude={COORDS.west.lat}
          longitude={COORDS.west.lon}
          onAttached={() => console.log("🧭 Compass attached!")}
        >
          <Compass isAnimated scale={1.2} />
        </GeolocationAnchor>

        <GeolocationAnchor
          isBillboard={false}
          latitude={COORDS.northeast.lat}
          longitude={COORDS.northeast.lon}
          onAttached={() => console.log("🏢 Building attached!")}
        >
          <Landmark type="building" color="#27ae60" scale={8} />
        </GeolocationAnchor>

        <GeolocationAnchor
          latitude={COORDS.center.lat}
          longitude={COORDS.center.lon + 0.0003}
          onAttached={() => console.log("🏛️ Monument attached!")}
        >
          <Landmark isAnimated type="monument" color="#8e44ad" scale={0.8} />
        </GeolocationAnchor>
      </GeolocationSession>
    </XR>
  </Canvas>
);

export default App;
