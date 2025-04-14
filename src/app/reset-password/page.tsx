import ResetPasswordForm from "./_components/reset-password";

// This page expects a verification token in the URL query parameters,
// which Better Auth should handle automatically when the user clicks the reset link.
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
