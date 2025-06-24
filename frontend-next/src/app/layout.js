// Copyright (c) 2025 Ali Eslamdoust
// MIT License

import "./FontAwesome/css/all.css";

import "./styles/main.css";
import "./globals.css";

export const metadata = {
  title: "Luxe Grand Pa",
  description: "Created by Ali Eslamdoust",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
