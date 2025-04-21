import { type Metadata } from "next";
import SignUp from "./SignUp";

export const metadata: Metadata = {
  title: "Sign Up", // Uses template from layout: "Sign Up | PRzilla"
  description:
    "Create your free PRzilla account to start tracking WOD scores, import from SugarWOD, and visualize your fitness journey.",
};

export default function SignUpPage() {
  return <SignUp />;
}
