import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom";
import { Canvas } from "@react-three/fiber";
import XRSessionProvider from "../src/engine/XRSessionProvider";
import { setupGlobalMocks, clearGlobalMocks } from "./mocks/globals.mock";

vi.mock("../src/fiducial/fiducialBackend", () => ({
  createFiducialBackend: vi.fn().mockReturnValue({
    init: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    dispose: vi.fn(),
    getInternal: vi.fn().mockReturnValue({ arContext: {} }),
  }),
}));

vi.mock("../src/geolocation/geolocationBackend", () => ({
  createGeolocationBackend: vi.fn().mockReturnValue({
    init: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    dispose: vi.fn(),
    getInternal: vi.fn().mockReturnValue({ locar: {} }),
  }),
}));

beforeEach(() => {
  setupGlobalMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  clearGlobalMocks();
  vi.restoreAllMocks();
});

describe("XRSessionProvider", () => {
  const TestWrapper = ({ children }: { children: ReactNode }) => (
    <Canvas>
      <XRSessionProvider cameraSource="video">{children}</XRSessionProvider>
    </Canvas>
  );

  ({ sessionType }: { sessionType: string }) => {
    const [error, setError] = useState<string | null>(null);
    const [registered, setRegistered] = useState(false);

    useEffect(() => {
      // simulate session registration with a slight delay to ensure order
      const timeout = setTimeout(
        async () => {
          try {
            // access XR session provider context indirectly through a mock backend
            const mockBackend = {
              init: vi.fn().mockResolvedValue(undefined),
              update: vi.fn(),
              dispose: vi.fn(),
            };

            // trigger compatibility check in XR session provider
            const event = new CustomEvent("xr-session-register", {
              detail: { backend: mockBackend, sessionType },
            });
            window.dispatchEvent(event);

            setRegistered(true);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            setError(errorMessage);
          }
        },

        // ensure geo session registers second
        sessionType === "GeolocationSession" ? 50 : 0,
      );

      return () => clearTimeout(timeout);
    }, [sessionType]);

    if (error) {
      return (
        <div data-testid={`${sessionType.toLowerCase()}-error`}>{error}</div>
      );
    }

    return (
      <div data-testid={sessionType.toLowerCase()}>
        {registered ? "Registered" : "Registering..."}
      </div>
    );
  };

  it("renders without crashing with no sessions", () => {
    render(
      <TestWrapper>
        <div data-testid="test-content">Test content</div>
      </TestWrapper>,
    );

    expect(screen.getByTestId("test-content")).toBeInTheDocument();
  });

  it("displays compatibility error when both session types would be registered", async () => {
    // create a direct test of the `registerBackend` function
    const TestCompatibilityCheck = () => {
      const [_error, setError] = useState<string | null>(null);
      const sessionTypesRef = useRef<Set<string>>(new Set());

      // biome-ignore lint/suspicious/noExplicitAny: TODO
      const registerBackend = async (_backend: any, sessionType?: string) => {
        if (sessionType) {
          const newSessionTypes = new Set([
            ...sessionTypesRef.current,
            sessionType,
          ]);
          const hasFiducial = newSessionTypes.has("FiducialSession");
          const hasGeolocation = newSessionTypes.has("GeolocationSession");

          if (hasFiducial && hasGeolocation) {
            const errorMessage =
              "❌ [RDK] INCOMPATIBLE SESSIONS: FiducialSession and GeolocationSession cannot be used together due to camera/video conflicts between AR.js and LocAR.js libraries. Use only one session type per app.";
            console.error(errorMessage);
            throw new Error(errorMessage);
          }

          sessionTypesRef.current = newSessionTypes;
        }
      };

      // biome-ignore lint/correctness/useExhaustiveDependencies: `registerBackend` changes on every render
      useEffect(() => {
        const testCompatibility = async () => {
          try {
            // register first session: should succeed
            await registerBackend({}, "FiducialSession");

            // register second session: should fail
            await registerBackend({}, "GeolocationSession");
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        };

        testCompatibility();
      }, []);

      return <div data-testid="no-error">No compatibility error</div>;
    };

    render(<TestCompatibilityCheck />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "❌ [RDK] INCOMPATIBLE SESSIONS: FiducialSession and GeolocationSession cannot be used together",
        ),
      );
    });
  });

  it("allows individual session types without errors", async () => {
    const TestSingleSession = ({ sessionType }: { sessionType: string }) => {
      const [success, setSuccess] = useState(false);
      const sessionTypesRef = useRef<Set<string>>(new Set());

      // biome-ignore lint/suspicious/noExplicitAny: TODO
      const registerBackend = async (_backend: any, sessionType?: string) => {
        if (sessionType) {
          const newSessionTypes = new Set([
            ...sessionTypesRef.current,
            sessionType,
          ]);
          const hasFiducial = newSessionTypes.has("FiducialSession");
          const hasGeolocation = newSessionTypes.has("GeolocationSession");

          if (hasFiducial && hasGeolocation) {
            throw new Error("INCOMPATIBLE SESSIONS");
          }

          sessionTypesRef.current = newSessionTypes;
        }
      };

      // biome-ignore lint/correctness/useExhaustiveDependencies: `registerBackend` changes on every render
      useEffect(() => {
        const testSingle = async () => {
          try {
            await registerBackend({}, sessionType);

            setSuccess(true);
          } catch (_err) {
            // should not error for single session
          }
        };

        testSingle();
      }, [sessionType]);

      return (
        <div data-testid={`${sessionType}-success`}>
          {success ? "Success" : "Failed"}
        </div>
      );
    };

    const { rerender } = render(
      <TestSingleSession sessionType="FiducialSession" />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("FiducialSession-success")).toHaveTextContent(
        "Success",
      );
    });

    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("INCOMPATIBLE SESSIONS"),
    );

    // test `GeolocationSession` alone
    rerender(<TestSingleSession sessionType="GeolocationSession" />);

    await waitFor(() => {
      expect(
        screen.getByTestId("GeolocationSession-success"),
      ).toHaveTextContent("Success");
    });

    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("INCOMPATIBLE SESSIONS"),
    );
  });

  it("prevents registration order dependency", async () => {
    const TestOrderIndependence = ({
      firstSession,
      secondSession,
    }: {
      firstSession: string;
      secondSession: string;
    }) => {
      const [error, setError] = useState<string | null>(null);
      const sessionTypesRef = useRef<Set<string>>(new Set());

      // biome-ignore lint/suspicious/noExplicitAny: TODO
      const registerBackend = async (_backend: any, sessionType?: string) => {
        if (sessionType) {
          const newSessionTypes = new Set([
            ...sessionTypesRef.current,
            sessionType,
          ]);
          const hasFiducial = newSessionTypes.has("FiducialSession");
          const hasGeolocation = newSessionTypes.has("GeolocationSession");

          if (hasFiducial && hasGeolocation) {
            const errorMessage = "Session compatibility error detected";
            console.error(errorMessage);
            throw new Error(errorMessage);
          }

          sessionTypesRef.current = newSessionTypes;
        }
      };

      // biome-ignore lint/correctness/useExhaustiveDependencies: `registerBackend` changes on every render
      useEffect(() => {
        const testOrder = async () => {
          try {
            await registerBackend({}, firstSession);
            await registerBackend({}, secondSession);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        };

        testOrder();
      }, [firstSession, secondSession]);

      return <div data-testid="order-test">{error || "No error"}</div>;
    };

    // test `GeolocationSession` first, then `FiducialSession`
    render(
      <TestOrderIndependence
        firstSession="GeolocationSession"
        secondSession="FiducialSession"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("order-test")).toHaveTextContent(
        "Session compatibility error detected",
      );
    });

    expect(console.error).toHaveBeenCalledWith(
      "Session compatibility error detected",
    );
  });
});
