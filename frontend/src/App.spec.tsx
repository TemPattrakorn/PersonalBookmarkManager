import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the accessible foundation placeholder", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("<main");
    expect(html).toContain("<h1");
    expect(html).toContain("Personal Bookmark Manager");
  });
});
