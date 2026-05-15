export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        About CampusConnect
      </h1>
      <div className="prose prose-lg max-w-none text-gray-600">
        <p className="text-lg leading-relaxed mb-6">
          CampusConnect is an intra-university job marketplace designed to bridge the gap between talented students (TalentSeekers) and forward-thinking companies (TalentFinders).
        </p>
        <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-4">Our Mission</h2>
        <p>
          We believe every student deserves access to meaningful career opportunities. Our platform leverages AI-powered job matching and resume analysis to help students find roles that perfectly align with their skills and aspirations.
        </p>
        <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-4">Key Features</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>AI Job Matching</strong> — Our algorithm analyzes your skills against job requirements to surface the most relevant opportunities.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Resume Analyzer</strong> — Get your resume scored against ATS systems with actionable improvement suggestions.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Real-time Notifications</strong> — Stay updated on application status changes instantly.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Recruiter Dashboard</strong> — Companies can post jobs, manage applications, and shortlist candidates efficiently.</span>
          </li>
        </ul>
        <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-4">Built With</h2>
        <p>
          CampusConnect is built with Next.js 14+ (App Router), Tailwind CSS, MongoDB, NextAuth.js, and Google Gemini AI — delivering a fast, modern, and secure experience.
        </p>
      </div>
    </div>
  );
}
