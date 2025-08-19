"use client"; // <-- Marks the entire root as a client component

import { Inter } from "next/font/google";
import Link from 'next/link';
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"] });

// --- THEME CONTROLLER ---
function ThemeController() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const localTheme = localStorage.getItem('theme') || 'light';
    setTheme(localTheme);
    document.documentElement.setAttribute('data-theme', localTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle">
      <input type="checkbox" onChange={toggleTheme} checked={theme === 'dark'} />
      {/* sun icon */}
      <svg className="swap-on fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-1.41-1.41L12,7.05,19.77,14.83l-1.41,1.41L12,9.88ZM12,18a6,6,0,1,1,6-6A6,6,0,0,1,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8Z" /></svg>
      {/* moon icon */}
      <svg className="swap-off fill-current w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13.14a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,21.64,13.14Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.83Z" /></svg>
    </label>
  );
}

// --- NAVBAR using DaisyUI ---
function NavBar() {
  const uploadModalId = "upload_modal";

  return (
    <nav className="navbar bg-base-100 shadow-md sticky top-0 z-30">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost normal-case text-xl font-bold text-primary"> {/* <-- FIX HERE */}
          ImageApp
        </Link>
      </div>
      <div className="navbar-end gap-2">
        <ul className="menu menu-horizontal px-1 gap-1">
          <ThemeController />
          <li><Link className="btn" href="/">Gallery</Link></li>
          <li><Link className="btn" href="/batches">Batches</Link></li>
          <button
            className="btn btn-primary"
            onClick={() => (document.getElementById(uploadModalId) as HTMLDialogElement)?.showModal()}
          >
            Upload
          </button>
        </ul>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Client-side way to set the page title
  useEffect(() => {
    document.title = "Image Analysis App";
  }, []);

  return (
    <html lang="en" data-theme="light">
      <body className={inter.className}>
        <Toaster position="bottom-right" reverseOrder={false} />
        <NavBar />
        <main className="bg-base-200 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}