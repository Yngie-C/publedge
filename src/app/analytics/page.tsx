import { permanentRedirect } from "next/navigation";

export default function AnalyticsRedirect() {
  permanentRedirect("/creator/analytics");
}
