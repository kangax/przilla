import { type Metadata } from "next";
import Login from "./Login";

export const metadata: Metadata = {
  title: "Login", // Uses template from layout: "Login | PRzilla"
  description:
    "Log in to your PRzilla account to track WOD scores and view your progress.",
};

export default function LoginPage() {
  return <Login />;
}
