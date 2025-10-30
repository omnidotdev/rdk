declare module "@ar-js-org/ar.js/three.js/build/ar-threex" {
	import { type Object3D, type Matrix4 } from "three";

	export interface ArToolkitSourceParameters {
		sourceType: string;
		sourceUrl?: string;
		sourceWidth?: number;
		sourceHeight?: number;
		displayWidth?: number;
		displayHeight?: number;
	}

	export interface ArToolkitContextParameters {
		// ? should be required? researchg
		cameraParametersUrl?: string;
		detectionMode?: string;
		patternRatio?: number;
		matrixCodeType?: string;
		labelingMode?: string;
		maxDetectionRate?: number;
		canvasWidth?: number;
		canvasHeight?: number;
		imageSmoothingEnabled?: boolean;
	}

	export interface ArMarkerControlsParameters {
		type: "pattern" | "barcode" | "unknown";
		patternUrl?: string | null;
		barcodeValue?: number | null;
		changeMatrixMode?: string;
		minConfidence?: number;
		smooth?: boolean;
		smoothCount?: number;
		smoothTolerance?: number;
		smoothThreshold?: number;
	}

	export class ArToolkitSource {
		ready: boolean;
		domElement: HTMLElement;

		constructor(parameters: ArToolkitSourceParameters);
		init(
			onReady?: () => void,
			onError?: (error: Error) => void,
		): ArToolkitSource;
		onResizeElement(): void;
		copyElementSizeTo(element: HTMLElement): void;
	}

	export class ArToolkitContext {
		arController: {
			dispose(): void;
			cameraParam?: {
				dispose(): void;
			};
			canvas: HTMLCanvasElement;
			orientation: string;
			options: {
				orientation: string;
			};
		} | null;
		_arMarkersControls: ArMarkerControls[];

		constructor(parameters: ArToolkitContextParameters);
		init(onCompleted?: () => void): ArToolkitContext;
		update(srcElement: HTMLElement): boolean;
		getProjectionMatrix(): Matrix4;
	}

	export class ArMarkerControls {
		object3d: Object3D;

		constructor(
			context: ArToolkitContext,
			object3d: Object3D,
			parameters: ArMarkerControlsParameters,
		);
	}
}
