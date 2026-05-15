import Navbar from "@/components/layout/Navbar";

export default function AuthLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4">
        {children}
      </main>
    </>
  );
}
