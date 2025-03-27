"use client"
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner"
import { UserContext } from "@/lib/context";
import { useUserData } from '@/lib/hooks';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const userData = useUserData();
  let userContextValue;
  if (userData.user) {
    userContextValue = { user: userData.user };
  } else {
    userContextValue = { user: null };
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserContext.Provider value={userContextValue}>
          <main>
            {/* <Navbar /> */}
            {children}
          </main>
          <Toaster />
        </UserContext.Provider>
      </body>
    </html >
  );
}
