import { XRCanvas, MarkerAnchor } from "@omnidotdev/rdk";

import { Supertorus } from "components";

/**
 * Marker-based AR demo application.
 */
const App = () => (
	<XRCanvas
		gl={{
			antialias: false,
			powerPreference: "default",
		}}
		onCreated={({ gl }) => {
			gl.setSize(window.innerWidth, window.innerHeight);
		}}
	>
		{/* lighting */}
		<hemisphereLight intensity={0.6} />
		<directionalLight position={[5, 5, 5]} intensity={1} />

		<MarkerAnchor
			params={{ smooth: true }}
			type="pattern"
			patternUrl="data/rdk.patt"
		>
			<Supertorus
				R={4}
				n={10}
				t={1.5}
				position={[0, 0, 0]}
				scale={0.25}
				rotation={[Math.PI / 2, 0, 0]}
			/>
		</MarkerAnchor>
	</XRCanvas>
);

export default App;
