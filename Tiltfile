# Tiltfile for RDK project

# Development server
local_resource(
  'dev',
  'bun run dev',
  serve_cmd='bun run dev',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Build
local_resource(
  'build',
  'bun run build',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Lint
local_resource(
  'lint',
  'bun run lint',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Format
local_resource(
  'format',
  'bun run format',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Clean
local_resource(
  'clean',
  'bun run clean',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Install dependencies
local_resource(
  'install',
  'bun install',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

# Knip analysis
local_resource(
  'knip',
  'bun knip',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)
