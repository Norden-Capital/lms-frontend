import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  DM_Sans,
  Figtree,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Inter,
  Manrope,
  Montserrat,
  Nunito,
  Open_Sans,
  Outfit,
  Plus_Jakarta_Sans,
  Poppins,
  Roboto,
  Space_Grotesk,
} from "next/font/google";
import { LiquidGlassFilter } from "@/components/ui/liquidGlass";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APPEARANCE_COOKIE, htmlAttributes, parseAppearanceCookie } from "@/lib/appearance";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The other fonts on Settings → Theme. Not preloaded: the browser only
// downloads one when someone has picked it.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], preload: false });
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], preload: false });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"], preload: false });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], preload: false });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], preload: false });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], preload: false });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });
const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-plus-jakarta-sans", subsets: ["latin"], preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], preload: false });
const FONTS = [geistSans, geistMono, inter, dmSans, ibmPlexSans, roboto, openSans, poppins, montserrat, nunito, outfit, figtree, manrope, plusJakartaSans, spaceGrotesk];

export const metadata: Metadata = {
  title: {
    default: "Norden Capital — Learning Management System",
    template: "%s · Norden Capital",
  },
  description:
    "Courses, coursework, and progress for students, instructors, and administrators.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Settings → Theme. Read from a cookie, not the API, so the first frame
  // already has the right look — no flash of the light theme. AppearanceSync
  // in the (app) layout keeps the cookie in step with the saved account.
  const look = parseAppearanceCookie((await cookies()).get(APPEARANCE_COOKIE)?.value);
  const fonts = FONTS.map((font) => font.variable).join(" ");

  return (
    <html
      lang="en"
      className={`${fonts} h-full antialiased${look.mode === "dark" ? " dark" : ""}`}
      style={{ colorScheme: look.mode }}
      {...htmlAttributes(look)}
      // The theme page changes these attributes in the browser before a save.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Wraps everything so tooltips share one delay: move between two of
            them quickly and the second opens at once instead of making you wait
            all over again. Without it each tooltip times itself in isolation. */}
        <TooltipProvider>{children}</TooltipProvider>
        {/* One definition for every glass surface in the app — SVG filter ids
            are document-global. */}
        <LiquidGlassFilter />
        {/* Follows the saved mode. The generated Toaster reads next-themes,
            which this app does not use, so the mode is passed in here. */}
        <Toaster theme={look.mode} position="bottom-center" />
      </body>
    </html>
  );
}
