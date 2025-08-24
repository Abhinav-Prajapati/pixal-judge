"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    document.title = "Image Analysis App";
  }, []);

  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
        <Toaster position="bottom-right" reverseOrder={false} />
        <main className="bg-base-200 min-h-screen">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}