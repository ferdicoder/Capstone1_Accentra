import { AuthLayout } from "@/components/auth-layout";
import { OtpForm } from "@/components/otp-form";

export default function OTPFormPage() {
  return (
    <AuthLayout>
      <OtpForm />
    </AuthLayout>
  );
}