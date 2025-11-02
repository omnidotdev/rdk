load("ext://dotenv", "dotenv")
dotenv()

local_resource(
  "dev",
  serve_cmd="bun dev --filter @omnidotdev/rdk",
)

local_resource(
  "dev-demo-fiducial",
  serve_cmd="bun dev --filter rdk-fiducial-demo",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  labels=["demo-fiducial"]
)

local_resource(
  "dev-demo-geolocation",
  serve_cmd="bun dev --filter rdk-geolocation-demo",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL,
  labels=["demo-geolocation"]
)

local_resource(
  "build",
  "bun run build",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "lint",
  "bun lint",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "format",
  "bun format",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "clean",
  "bun clean",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "install",
  "bun install",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "knip",
  "bun knip",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  "test",
  "bun run test",
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)
