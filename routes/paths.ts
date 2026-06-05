import { getLinkFromPath, resolvePath } from "./getLinkFromPath";
export { resolvePath };

export const Paths = {
  index: "/",
  tasks: {
    index: "tasks",
    view: ":id",
  },
} as const;

export const Links = getLinkFromPath(Paths);
