import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import ParkingCapacityAlert from "./ParkingCapacityAlert.jsx";

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => authMock);

describe("ParkingCapacityAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra alerta cuando quedan 10 cupos o menos para motos", async () => {
    const apiRequest = vi.fn().mockResolvedValue({
      capacity: {
        total: 115,
        limit: 125,
        warningThreshold: 115,
        remaining: 10,
        isWarning: true,
        isFull: false,
      },
    });

    authMock.useAuth.mockReturnValue({
      isAuthenticated: true,
      apiRequest,
    });

    render(<ParkingCapacityAlert />);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /alerta de capacidad de motos/i })).toBeInTheDocument();
    expect(screen.getByText(/quedan 10 cupos/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith("/movimientos/capacidad-motos");
    });
  });
});
