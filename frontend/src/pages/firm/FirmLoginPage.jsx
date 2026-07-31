import { GalleryVerticalEnd } from "lucide-react"
import { FirmLoginForm } from "@/components/firm/firm-login-form"
import {FirmAuthLayout} from "@/layout/firm-auth-layout"

export default function FirmLoginPage() {
  return (
    <FirmAuthLayout>
      <FirmLoginForm />
    </FirmAuthLayout>
  );
}