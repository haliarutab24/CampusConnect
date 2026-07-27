import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

function getGoogleCredentials() {
  return {
    clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  };
}

/**
 * Refreshes a Google access token using a refresh token.
 */
async function refreshAccessToken(refreshToken) {
  const { clientId, clientSecret } = getGoogleCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokens = await response.json();
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(tokens)}`);
  }

  return {
    accessToken: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
    refreshToken: tokens.refresh_token || refreshToken,
  };
}

/**
 * Gets an authenticated Google Calendar client for a given user ID.
 * Fetches stored tokens from DB, refreshes if expired, and returns the client.
 */
export async function getCalendarClient(userId) {
  await connectDB();

  const user = await User.findById(userId).select(
    "+googleAccessToken +googleRefreshToken +googleTokenExpiresAt"
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.googleRefreshToken) {
    throw new Error(
      "No Google Calendar connection. Please sign in with Google to enable calendar features."
    );
  }

  let accessToken = user.googleAccessToken;
  const isExpired = !user.googleTokenExpiresAt || Date.now() >= user.googleTokenExpiresAt * 1000;

  // Refresh token if expired
  if (isExpired) {
    console.log("🔄 Refreshing expired Google token for user:", userId);
    const refreshed = await refreshAccessToken(user.googleRefreshToken);
    accessToken = refreshed.accessToken;

    // Persist refreshed tokens
    await User.findByIdAndUpdate(userId, {
      googleAccessToken: refreshed.accessToken,
      googleRefreshToken: refreshed.refreshToken,
      googleTokenExpiresAt: refreshed.expiresAt,
    });
  }

  // Create OAuth2 client with the valid access token
  const { clientId, clientSecret } = getGoogleCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: user.googleRefreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Creates a Google Calendar event with an auto-generated Google Meet link.
 * The event is created on the recruiter's calendar and the candidate is added as an attendee.
 *
 * @param {Object} options
 * @param {string} options.recruiterId - The recruiter's user ID (used to get Calendar client)
 * @param {string} options.summary - Event title
 * @param {string} options.description - Event description
 * @param {Date|string} options.startTime - Start time (ISO string or Date)
 * @param {Date|string} options.endTime - End time (ISO string or Date)
 * @param {string} options.recruiterEmail - Recruiter's email
 * @param {string} options.candidateEmail - Candidate's email
 *
 * @returns {Object} { meetLink, eventId, htmlLink }
 */
export async function createInterviewEvent({
  recruiterId,
  summary,
  description,
  startTime,
  endTime,
  recruiterEmail,
  candidateEmail,
}) {
  const calendar = await getCalendarClient(recruiterId);

  const event = {
    summary,
    description,
    start: {
      dateTime: new Date(startTime).toISOString(),
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
    },
    attendees: [
      { email: recruiterEmail },
      { email: candidateEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all", // Sends email invites to all attendees
    resource: event,
  });

  const createdEvent = response.data;

  return {
    meetLink: createdEvent.hangoutLink || "",
    eventId: createdEvent.id || "",
    htmlLink: createdEvent.htmlLink || "",
  };
}
