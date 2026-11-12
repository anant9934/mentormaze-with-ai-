import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mentormaze.aitathastu.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/*",
          "/dashboard/messages/*",
          "/sessions/*/live",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
