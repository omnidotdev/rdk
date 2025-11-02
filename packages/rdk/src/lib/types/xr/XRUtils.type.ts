import type { XRMode, XRSessionOptions } from "./index";

/**
 * Utility type to infer XR mode from session options.
 * This helps TypeScript understand the relationship between mode and options.
 */
export type InferXRMode<T> = T extends XRSessionOptions<infer M> ? M : never;

/**
 * Utility type to create a typed XR configuration.
 * This ensures mode and sessionOptions are compatible.
 */
export type XRConfig<TMode extends XRMode> = {
	/** XR mode to use. */
	mode: TMode;
	/** XR session options for the specified mode. */
	sessionOptions?: XRSessionOptions<TMode>;
};

/**
 * Create a typed XR configuration with full type safety.
 *
 * @example
 * ```typescript
 * const config = createXRConfig({
 *   mode: "fiducial",
 *   sessionOptions: {
 *     sourceType: "webcam",
 *     patternRatio: 0.8
 *   }
 * });
 * ```
 */
export const createXRConfig = <TMode extends XRMode>(
	config: XRConfig<TMode>,
): XRConfig<TMode> => config;

/**
 * Type guard to check if session options match a specific XR mode.
 * Useful for runtime type checking and narrowing.
 */
export const isXRMode = <TMode extends XRMode>(
	mode: XRMode,
	targetMode: TMode,
): mode is TMode => mode === targetMode;

/**
 * Utility type for XR component props that need mode-specific session options.
 */
export type XRComponentProps<TMode extends XRMode = XRMode> = {
	/** XR mode to use. */
	mode?: TMode;
	/** XR session options for the specified mode. */
	sessionOptions?: XRSessionOptions<TMode>;
};

/**
 * Default session options for each XR mode.
 * Provides sensible defaults while maintaining type safety.
 */
export const DEFAULT_XR_SESSION_OPTIONS = {
	fiducial: {
		sourceType: "webcam" as const,
		detectionMode: "mono",
		patternRatio: 0.5,
		matrixCodeType: "3x3",
	},
	geolocation: {},
} as const satisfies Record<XRMode, XRSessionOptions<XRMode>>;

/**
 * Get default session options for a specific XR mode.
 */
export const getDefaultSessionOptions = <TMode extends XRMode>(
	mode: TMode,
): XRSessionOptions<TMode> =>
	DEFAULT_XR_SESSION_OPTIONS[mode] as XRSessionOptions<TMode>;
