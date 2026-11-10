import React from "react";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

