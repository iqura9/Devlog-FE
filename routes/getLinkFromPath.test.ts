import { describe, it, expect } from "vitest";
import { resolvePath, getLinkFromPath } from "./getLinkFromPath";

const TestPaths = {
  index: "/",
  posts: {
    index: "posts",
    view: ":id",
    comments: {
      index: "comments",
      view: ":commentId",
    },
  },
} as const;

const TestLinks = getLinkFromPath(TestPaths);

describe("resolvePath", () => {
  it("resolves a single param", () => {
    expect(resolvePath(TestLinks.posts.view, { id: 42 })).toBe("/posts/42");
  });

  it("resolves a string param", () => {
    expect(resolvePath(TestLinks.posts.view, { id: "my-slug" })).toBe(
      "/posts/my-slug",
    );
  });

  it("resolves nested params", () => {
    expect(
      resolvePath(TestLinks.posts.comments.view, {
        commentId: 7,
      }),
    ).toBe("/posts/comments/7");
  });

  it("returns paramless links unchanged", () => {
    expect(resolvePath(TestLinks.posts.index)).toBe("/posts");
  });

  it("returns root unchanged", () => {
    expect(resolvePath(TestLinks.index)).toBe("/");
  });
});
