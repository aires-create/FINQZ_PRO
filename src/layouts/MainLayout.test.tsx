import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Layout } from "./MainLayout";
import useAppStore from "../store";

const logoutMock = vi.fn();

vi.mock("../auth", () => ({
  useAuth: () => ({
    logout: logoutMock,
  }),
}));

describe("MainLayout logout", () => {
  beforeEach(() => {
    logoutMock.mockResolvedValue(undefined);
    useAppStore.setState({
      sidebarOpen: true,
      user: {
        id: "user-1",
        nome: "Aires Fernandes",
        perfil: "admin",
        permissions: ["*"],
      } as never,
      userPermissions: { "*": ["*"] },
      theme: "dark",
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("uses the official logout flow when clicking Sair", async () => {
    render(
      <MemoryRouter initialEntries={["/app/dashboard"]}>
        <Layout />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Aires Fernandes/i }));
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
  });
});
