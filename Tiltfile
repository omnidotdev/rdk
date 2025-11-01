load("ext://dotenv", "dotenv")
dotenv()

local_resource(
  "dev",
  "bun dev",
  serve_cmd="bun dev",
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
