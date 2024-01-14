import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  try {
    // Replace with your actual Spotify client ID and client secret
    const YOUR_SPOTIFY_CLIENT_ID = "5a881e05966b46e6a834390e80c37713";
    const YOUR_SPOTIFY_CLIENT_SECRET = "b7434e52d7914cc6ba2cefc7192a0707";

    const url =
      "https://accounts.spotify.com/api/token?" +
      new URLSearchParams({
        client_id: YOUR_SPOTIFY_CLIENT_ID,
        client_secret: YOUR_SPOTIFY_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to the old refresh token
    };
  } catch (error) {
    console.log(error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

// Replace these placeholders with your actual values
const YOUR_SPOTIFY_CLIENT_ID = "5a881e05966b46e6a834390e80c37713";
const YOUR_SPOTIFY_CLIENT_SECRET = "b7434e52d7914cc6ba2cefc7192a0707";
const YOUR_NEXTAUTH_URL = "https://www.healthforevers.com/";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: YOUR_SPOTIFY_CLIENT_ID,
      clientSecret: YOUR_SPOTIFY_CLIENT_SECRET,
      authorization:
        "https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-private,user-read-email,streaming,user-read-private,user-library-read,user-library-modify,user-read-playback-state,user-modify-playback-state,user-read-recently-played,user-follow-read",
    }),
    // ...add more providers here
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          accessTokenExpires: Date.now() + account.expires_in * 1000,
          refreshToken: account.refresh_token,
          user,
        };
      }

      // Return the previous token if the access token has not expired yet
      if (Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to update it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = token.user;
      session.accessToken = token.accessToken;
      session.error = token.error;

      return session;
    },
  },
  // Replace with your actual NextAuth URL
  baseUrl: YOUR_NEXTAUTH_URL,
});
