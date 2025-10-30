load('ext://dotenv', 'dotenv')
dotenv()

local_resource(
  'dev',
  'bun run dev',
  serve_cmd='bun run dev',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'build',
  'bun run build',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'lint',
  'bun run lint',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'format',
  'bun run format',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'clean',
  'bun run clean',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'install',
  'bun install',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'knip',
  'npx knip',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)

local_resource(
  'test',
  'bun run test',
  auto_init=False,
  trigger_mode=TRIGGER_MODE_MANUAL
)
