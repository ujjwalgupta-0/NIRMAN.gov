import "./globals.css";
import Shell from "@/components/Shell";

export const metadata = {
  title: "NIRMAN",
  description: "Predict infrastructure project risk early, explain it clearly and intervene intelligently."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><Shell>{children}</Shell></body>
    </html>
  );
}
