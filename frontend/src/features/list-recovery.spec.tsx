import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { listFailureStatus } from "../hooks/usePagedList";
import { BookmarksListPage } from "./bookmarks/pages/BookmarksListPage";

const { useBookmarks } = vi.hoisted(() => ({ useBookmarks: vi.fn() }));

vi.mock("../components/WorkspaceLayout", () => ({
  WorkspaceLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("./bookmarks/hooks/useBookmarks", () => ({ useBookmarks }));

const bookmark = {
  access: "owner" as const,
  collectionId: null,
  createdAt: "2026-08-02T00:00:00.000Z",
  id: "bookmark",
  notes: null,
  title: "Saved bookmark",
  updatedAt: "2026-08-02T00:00:00.000Z",
  url: "https://example.com",
};

function state(overrides: Record<string, unknown> = {}) {
  return {
    activeCollection: undefined,
    activeCollectionLoading: false,
    activeCollectionStatus: undefined,
    collections: [],
    collectionsStatus: undefined,
    deleting: false,
    hasMore: false,
    items: [],
    loaded: false,
    loadMore: vi.fn(),
    loading: false,
    loadingMore: false,
    remove: vi.fn(),
    retryable: false,
    retry: vi.fn(),
    save: vi.fn(),
    saving: false,
    status: undefined,
    ...overrides,
  };
}

describe("list failure recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Retry instead of an empty bookmark message after the initial load fails", () => {
    useBookmarks.mockReturnValue(state({ retryable: true, status: 503 }));

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BookmarksListPage />
      </MemoryRouter>,
    );

    expect(html).toContain("Retry");
    expect(html).not.toContain("Your bookmarks will appear here.");
  });

  it("keeps successfully loaded bookmarks visible when a refresh fails", () => {
    useBookmarks.mockReturnValue(
      state({ items: [bookmark], loaded: true, retryable: true, status: 500 }),
    );

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <BookmarksListPage />
      </MemoryRouter>,
    );

    expect(html).toContain("Saved bookmark");
    expect(html).toContain("Retry");
  });

  it("never renders stale bookmarks after the collection filter changes", () => {
    useBookmarks.mockReturnValue(
      state({ activeCollectionStatus: 503, items: [bookmark], status: 503 }),
    );

    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/bookmarks?collectionId=new-collection"]}>
        <BookmarksListPage />
      </MemoryRouter>,
    );

    expect(html).not.toContain("Saved bookmark");
    expect(html).toContain("Retry");
  });

  it("requires a new login only for 401 failures", () => {
    const requireLogin = vi.fn();

    expect(listFailureStatus(new ApiError(401), requireLogin)).toBe(401);
    expect(listFailureStatus(new ApiError(500), requireLogin)).toBe(500);
    expect(listFailureStatus(new ApiError(503), requireLogin)).toBe(503);
    expect(requireLogin).toHaveBeenCalledTimes(1);
  });
});
