import React, { useEffect, useState, useCallback , useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import Loader from "../components/Loader";
import moment from "moment";

const ProfileDetails = () => {
  const { backendUrl, userToken } = useContext(AppContext);
  const [userInfo, setUserInfo] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfileData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/user/user-applications`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      // console.log('data', data.applications);
      
      if (data.success) {
        setUserInfo(data.user);
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Memoized fetch function (won’t re-create unless backendUrl/userToken changes)
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/user/user-data`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      console.log("data", data.userData);

      if (data.success && data.userData) {
        setUserInfo(data.userData);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, userToken]); // only re-create if these change

  // ✅ useEffect runs only once or when token/url changes
  useEffect(() => {
    fetchUserProfile();
  }, [userInfo]);

  useEffect(() => {
    fetchUserProfileData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <>
      {/* <Navbar /> */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {/* --- USER PROFILE --- */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
  <div className="flex items-center gap-6">
    <img
      src={userInfo?.image}
      alt={userInfo?.name || "User profile"}
      className="mt-5 w-40 h-48 rounded-full object-cover border border-gray-100"
    />
    <div>
      <h2 className="text-2xl font-semibold">{userInfo?.name || "User"}</h2>
      <p className="text-gray-600">{userInfo?.email || "No email"}</p>
      <p className="mt-1 text-sm text-gray-500">
        {userInfo?.bio || "No bio provided"}
      </p>

      {userInfo?.resume && (
        <a
          href={userInfo.resume}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-blue-500 hover:underline text-sm"
        >
          View Resume
        </a>
      )}
      {userInfo?.skills && (
  <div className="mt-4">
    <h3 className="text-sm font-semibold mb-1">Skills:</h3>
    <div className="flex flex-wrap gap-2">
      {Array.isArray(userInfo.skills)
        ? userInfo.skills.map((skill, i) => (
            <span
              key={i}
              className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))
        : userInfo.skills
            ?.split(",")
            .map((skill, i) => (
              <span
                key={i}
                className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs"
              >
                {skill.trim()}
              </span>
            ))}
    </div>
  </div>
)}
    </div>
  </div>

 

</div>


        {/* --- APPLICATIONS LIST --- */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Applications</h2>

          {applications.length === 0 ? (
            <p className="text-gray-500">No applications found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Company
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Job Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...applications].reverse().map((app) => (
                    <tr key={app._id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={app.companyId?.image}
                            alt={app.companyId?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          {app.companyId?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {app.jobId?.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.jobId?.location}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {app.jobId?.category}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          app.status === "Shortlisted"
                            ? "text-green-600"
                            : app.status === "Rejected"
                            ? "text-red-500"
                            : "text-blue-500"
                        }`}
                      >
                        {app.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {moment(app.date).format("ll")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {/* <Footer /> */}
    </>
  );
};

export default ProfileDetails;
