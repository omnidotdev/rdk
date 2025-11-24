# RDK Geolocation Demo

This demo showcases the geolocation-based AR capabilities of the Reality Development Kit (RDK), powered by LocAR.js.

## Features

- **GPS-based AR anchoring**: Place 3D objects at real-world GPS coordinates
- **Multiple anchor types**: GPS pins, landmarks (towers, buildings, monuments), and compass components
- **Billboard mode**: Objects that always face the camera

## Demo Objects

The demo places several AR objects at GPS coordinates near the Oregon coast:

1. **GPS Pin** (Red) - Animated location marker at the main coordinates
2. **Tower Landmark** (Blue) - Communication tower with blinking light
3. **Compass** (Traditional) - Animated compass with rotating needle
4. **Building Landmark** (Green) - Multi-story building with windows
5. **Monument** (Purple) - Classical monument

## Usage

### Development

```bash
bun install
bun dev
```

### Production Build

```bash
bun run build
bun preview
```

## Important Notes

- **HTTPS Required**: Geolocation API requires a secure context (HTTPS) for production use
- **Location Permission**: Browser will prompt for location access
  - Make sure location services are enabled at the device level
- **GPS Accuracy**: Works best outdoors with clear sky view
- **Mobile-First**: Optimized for mobile AR experiences


## Testing

For testing without traveling near the base coordinates, you can either:

- Use browser dev tools to mock your GPS location,
- Modify the coordinates in `src/App.tsx` to match your location, or
- Enable fake GPS in the LocAR backend configuration

## Coordinates

The demo is centered around:
- **Latitude**: 48.68951980519457°N
- **Longitude**: 113.6363247804274°W
- **Location**: Going-To-The-Sun Mountain, USA

Update these (`BASE_LATITUDE` and `BASE_LONGITUDE`) to your desired location.
