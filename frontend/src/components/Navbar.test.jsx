import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Navbar from "./Navbar.jsx";

const authMock = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock("../context/AuthContext.jsx", () => authMock);

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("820px") ? window.innerWidth <= 820 : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("inicia desplegado en computador y conserva accesos principales", () => {
    authMock.useAuth.mockReturnValue({
      user: { username: "admin" },
      role: "ADMIN",
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /contraer men\u00fa/i })).toHaveAttribute("aria-expanded", "true");
    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--open");
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/estudiantes",
      "/movimientos",
      "/admin",
    ]);
  });

  it("inicia compacto en celular", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });

    authMock.useAuth.mockReturnValue({
      user: { username: "admin" },
      role: "ADMIN",
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: /desplegar men\u00fa/i })).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--collapsed");
  });

  it("muestra el menu administrativo en el orden esperado", () => {
    const logout = vi.fn();

    authMock.useAuth.mockReturnValue({
      user: { username: "admin" },
      role: "ADMIN",
      logout,
    });

    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--open");
    expect(screen.getByRole("button", { name: /contraer men\u00fa/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText(/rol activo: admin/i)).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/estudiantes",
      "/movimientos",
      "/admin",
    ]);
    expect(links.map((link) => link.textContent.trim())).toEqual([
      "INInicio",
      "ESEstudiantes",
      "MVMovimientos",
      "ADAdministraci\u00f3n",
    ]);

    fireEvent.click(links[2]);
    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--open");

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesi\u00f3n/i }));
    expect(logout).toHaveBeenCalled();
  });

  it("contrae el menu al navegar solo en celular", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    });

    authMock.useAuth.mockReturnValue({
      user: { username: "admin" },
      role: "ADMIN",
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /desplegar men\u00fa/i }));
    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--open");

    fireEvent.click(screen.getByRole("link", { name: /movimientos/i }));
    expect(container.querySelector(".sidebar")).toHaveClass("sidebar--collapsed");
  });

  it("oculta administracion para guarda", () => {
    authMock.useAuth.mockReturnValue({
      user: { username: "guarda" },
      role: "GUARDA",
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: /administraci\u00f3n/i })).not.toBeInTheDocument();
    expect(screen.getByText(/operaci\u00f3n de acceso y monitoreo/i)).toBeInTheDocument();
  });
});
