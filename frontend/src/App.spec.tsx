import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the protected workspace loading state", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/collections"]}>
        <App />
      </MemoryRouter>,
    );

    expect(html).toContain("<main");
    expect(html).toContain("<h1");
    expect(html).toContain("Personal Bookmark Manager");
    expect(html).toContain("Loading secure workspace");
  });
});
