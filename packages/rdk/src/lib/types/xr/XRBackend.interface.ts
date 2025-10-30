import { XRBackendInitArgs } from "./XRBackendInitArgs.interface";

export interface XRBackend {
	init(args: XRBackendInitArgs): Promise<void> | void;
	update?(dt: number): void;
	dispose?(): void;
	// optional: expose raw SDK objects
	getInternal?(): unknown;
}
