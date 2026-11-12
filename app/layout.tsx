import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { RoleSwitcher } from "@/components/shared/role-switcher";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mentormaze.aitathastu.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MentorMaze — Find the Right Mentor for Your Career",
    template: "%s | MentorMaze by AI Tathastu",
  },
  description:
    "Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.",
  keywords: [
    "MentorMaze",
    "AI Tathastu",
    "mentorship platform",
    "career mentorship",
    "mock interviews",
    "system design mock interview",
    "tech mentorship India",
    "software engineer mentor",
  ],
  authors: [{ name: "MentorMaze by AI Tathastu", url: "https://mentormaze.aitathastu.com" }],
  creator: "AI Tathastu",
  publisher: "AI Tathastu",
  alternates: {
    canonical: "https://mentormaze.aitathastu.com",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://mentormaze.aitathastu.com",
    siteName: "MentorMaze by AI Tathastu",
    title: "MentorMaze — Find the Right Mentor for Your Career",
    description:
      "Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MentorMaze by AI Tathastu — Human Mentorship & Mock Interviews",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MentorMaze — Find the Right Mentor for Your Career",
    description:
      "Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.",
    creator: "@aitathastu",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://mentormaze.aitathastu.com/#organization",
        name: "MentorMaze by AI Tathastu",
        url: "https://mentormaze.aitathastu.com",
        logo: {
          "@type": "ImageObject",
          url: "https://mentormaze.aitathastu.com/logo.png",
        },
        parentOrganization: {
          "@type": "Organization",
          name: "AI Tathastu",
          url: "https://aitathastu.com",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "hellomentormaze@gmail.com",
          contactType: "Customer Support",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://mentormaze.aitathastu.com/#website",
        url: "https://mentormaze.aitathastu.com",
        name: "MentorMaze",
        description:
          "Connect with experienced mentors, explore career opportunities, book human mentorship sessions and practice interviews with MentorMaze by AI Tathastu.",
        publisher: {
          "@id": "https://mentormaze.aitathastu.com/#organization",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-cream-50 text-ink-950 font-sans selection:bg-sage-200 selection:text-forest-900">
        <AuthProvider>
          <RoleSwitcher />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
