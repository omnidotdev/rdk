import { useEffect } from "react";

import useVisionBackend from "./useVisionBackend";

import type React from "react";
import type { VisionSessionOptions } from "./types";

export type VisionSessionProps = {
  /** Vision session configuration */
  options: VisionSessionOptions;
  /** Children to render inside the session */
  children?: React.ReactNode;
  /** Error callback */
  onError?: (error: Error) => void;
};

/**
 * Vision session component that initializes the vision backend
 * and provides detection context to child components
 */
const VisionSession: React.FC<VisionSessionProps> = ({ children, onError }) => {
  const { isSuccess } = useVisionBackend();

  useEffect(() => {
    if (!isSuccess) return;
  }, [isSuccess]);

  return <>{children}</>;
};

export default VisionSession;
