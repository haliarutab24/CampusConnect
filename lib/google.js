import { google } from "googleapis";

function getGoogleCredentials() {
  return {
    clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
  };
}

// Helper to refresh an expired Google access token
export async function refreshGoogleToken(refreshToken) {
  if (!refreshToken) throw new Error("No refresh token provided");
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
    console.error("❌ Google token refresh failed:", tokens);
    throw new Error("Failed to refresh Google token");
  }

  return {
    accessToken: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
    refreshToken: tokens.refresh_token || refreshToken, // Google may rotate refresh tokens
  };
}

// Create a Google Calendar event with Hangouts Meet
export async function createGoogleMeetEvent({ accessToken, summary, description, startTime }) {
  const { clientId, clientSecret } = getGoogleCredentials();
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret
  );

  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Interview default duration: 45 minutes
  const endDateTime = new Date(new Date(startTime).getTime() + 45 * 60 * 1000);

  const event = {
    summary: summary,
    description: description,
    start: {
      dateTime: new Date(startTime).toISOString(),
    },
    end: {
      dateTime: endDateTime.toISOString(),
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1, // Required to generate Hangouts Meet link
  });

  return response.data;
}
