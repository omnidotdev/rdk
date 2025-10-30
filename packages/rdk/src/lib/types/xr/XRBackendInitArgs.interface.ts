import type * as THREE from "three";

export interface XRBackendInitArgs {
	scene: THREE.Scene;
	camera: THREE.Camera;
	renderer: THREE.WebGLRenderer;
}
