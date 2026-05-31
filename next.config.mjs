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
  experimental: {
    // Allow larger request bodies for file uploads (resume analyzer)
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
