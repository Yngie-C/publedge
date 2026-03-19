import { permanentRedirect } from "next/navigation";

export default function SettingsRedirect() {
  permanentRedirect("/my/settings");
}
