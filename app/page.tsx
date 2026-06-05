import { redirect } from "next/navigation";
import { Links } from "@/routes/paths";

export default function Home() {
  return redirect(Links.tasks.index);
}
