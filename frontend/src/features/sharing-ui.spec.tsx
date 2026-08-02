import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { BookmarkCard } from "./bookmarks/components/BookmarkCard";
import { BookmarksListPage } from "./bookmarks/pages/BookmarksListPage";
import { CollectionCard } from "./collections/components/CollectionCard";

vi.mock("../components/WorkspaceLayout", () => ({
  WorkspaceLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("./bookmarks/hooks/useBookmarks", () => ({
  useBookmarks: () => ({
    activeCollection: { access: "viewer", id: "shared", name: "Shared collection" },
    activeCollectionLoading: false,
    activeCollectionStatus: undefined,
    collections: [],
    collectionsStatus: undefined,
    deleting: false,
    hasMore: false,
    items: [
      {
        access: "viewer",
        collectionId: "shared",
        createdAt: "2026-08-02T00:00:00.000Z",
        id: "bookmark",
        notes: null,
        title: "Shared bookmark",
        updatedAt: "2026-08-02T00:00:00.000Z",
        url: "https://example.com",
      },
    ],
    loaded: true,
    loadMore: vi.fn(),
    loading: false,
    loadingMore: false,
    remove: vi.fn(),
    retryable: false,
    retry: vi.fn(),
    save: vi.fn(),
    saving: false,
    status: undefined,
  }),
}));

const ownerCollection = {
  access: "owner" as const,
  createdAt: "2026-08-02T00:00:00.000Z",
  id: "owner",
  name: "Owned",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

const viewerCollection = { ...ownerCollection, access: "viewer" as const, id: "viewer" };

const viewerBookmark = {
  access: "viewer" as const,
  collectionId: "viewer",
  createdAt: "2026-08-02T00:00:00.000Z",
  id: "bookmark",
  notes: null,
  title: "Shared bookmark",
  updatedAt: "2026-08-02T00:00:00.000Z",
  url: "https://example.com",
};

describe("sharing UI", () => {
  it("keeps owner management separate from a viewer leave action", () => {
    const owner = renderToStaticMarkup(
      <MemoryRouter>
        <CollectionCard collection={ownerCollection} />
      </MemoryRouter>,
    );
    const viewer = renderToStaticMarkup(
      <MemoryRouter>
        <CollectionCard collection={viewerCollection} />
      </MemoryRouter>,
    );

    expect(owner).toContain("Manage sharing");
    expect(owner).toContain("Delete");
    expect(owner).not.toContain("Leave shared collection");
    expect(viewer).toContain("Leave shared collection");
    expect(viewer).not.toContain("Manage sharing");
    expect(viewer).not.toContain("Rename");
  });

  it("suppresses bookmark mutations while a shared collection filter is active", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/bookmarks?collectionId=shared"]}>
        <BookmarksListPage />
      </MemoryRouter>,
    );

    expect(html).toContain("Shared bookmarks are read-only.");
    expect(html).toContain("Shared collection");
    expect(html).not.toContain("Add bookmark");
    expect(html).not.toContain("Edit");
    expect(html).not.toContain("Delete");
  });

  it("renders no bookmark mutation controls for viewer data", () => {
    const html = renderToStaticMarkup(<BookmarkCard bookmark={viewerBookmark} />);

    expect(html).not.toContain("Edit");
    expect(html).not.toContain("Delete");
  });
});
