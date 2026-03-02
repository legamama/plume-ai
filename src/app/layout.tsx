import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { DashboardProvider } from "@/lib/dashboard-context";
import { DialogProvider } from "@/lib/dialog-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plume Ai - AI Product Photography",
  description: "Generate stunning product photos with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <DashboardProvider>
            <DialogProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow flex flex-col">
                  {children}
                </main>
                <Footer />
              </div>
            </DialogProvider>
          </DashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
