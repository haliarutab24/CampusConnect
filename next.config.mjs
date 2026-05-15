/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Suppress punycode deprecation warning from mongoose
  serverExternalPackages: ["mongoose", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
