import { useVisionBackend, useVisionFrame } from "@omnidotdev/rdk/vision";
import { Badge } from "@omnidotdev/thornberry/badge";
import { LoaderCircle } from "lucide-react";

import { MODES } from "@/lib/modes";

import type { VisionProgress } from "@omnidotdev/rdk/vision";
import type { Mode } from "@/lib/modes";

type StatusBadgeProps = {
  mode: Mode;
  progress: VisionProgress | null;
  failed: boolean;
};

/** "a hand", "an object" */
const withArticle = (word: string) =>
  `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;

/** What the vision session is doing right now, in a few words */
const StatusBadge = ({ mode, progress, failed }: StatusBadgeProps) => {
  const { isSuccess } = useVisionBackend();
  const frame = useVisionFrame({ throttle: 250 });
  const { noun, count } = MODES[mode];

  if (failed) return <Badge variant="danger">Stopped</Badge>;

  if (progress || !isSuccess || !frame) {
    return (
      <Badge variant="soft">
        <LoaderCircle className="animate-spin" />
        {progress ? `Loading ${progress.label}` : "Starting"}
      </Badge>
    );
  }

  const found = count(frame);
  if (found === 0)
    return <Badge variant="soft">Looking for {withArticle(noun[0])}</Badge>;

  return (
    <Badge variant="success">
      <span className="size-1.5 rounded-full bg-current" />
      {found} {found === 1 ? noun[0] : noun[1]}
    </Badge>
  );
};

export default StatusBadge;
