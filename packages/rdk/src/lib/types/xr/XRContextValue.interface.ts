import { XRBackend } from "./XRBackend.interface";
import { XRMode } from "./XRMode.type";

export interface XRContextValue {
	mode: XRMode;
	ready: boolean;
	backend: XRBackend | null;
}
