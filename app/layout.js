import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "CampusConnect — Your Career Gateway",
  description:
    "CampusConnect is an intra-university job marketplace connecting TalentSeekers (Students) with TalentFinders (Recruiters). Find your dream campus job today.",
  keywords: ["campus jobs", "student jobs", "university recruitment", "career", "internship"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased bg-white text-gray-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
