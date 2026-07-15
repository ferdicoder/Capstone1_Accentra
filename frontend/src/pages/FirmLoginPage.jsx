import { GalleryVerticalEnd } from "lucide-react"
import { FirmLoginForm } from "@/components/firm-login-form"
import {FirmAuthLayout} from "@/components/firm-auth-layout"

export default function FirmLoginPage() {
  return (
    <FirmAuthLayout>
      <FirmLoginForm />
    </FirmAuthLayout>
  );
}