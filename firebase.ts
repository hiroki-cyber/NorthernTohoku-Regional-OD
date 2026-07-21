import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scope for Drive (file-level access is safest and least privilege)
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Log Out
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Help helper to retrieve cached token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Find existing backup file in Drive
async function findBackupFile(token: string): Promise<string | null> {
  try {
    const query = encodeURIComponent("name = 'papamama_spots_reviews_backup.json' and trashed = false");
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Drive search failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id; // Return the first matching file ID
    }
    return null;
  } catch (err) {
    console.error('Searching backup file error:', err);
    return null;
  }
}

// Save reviews data to Google Drive
export const saveReviewsToDrive = async (reviewsData: any): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Drive integration not signed in.');
  }

  const existingFileId = await findBackupFile(token);

  if (existingFileId) {
    // Update existing file content
    try {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewsData)
      });

      if (!res.ok) {
        throw new Error(`Failed to update backup: ${res.statusText}`);
      }

      return true;
    } catch (err) {
      console.error('Error updating backup file:', err);
      throw err;
    }
  } else {
    // Create new file
    try {
      const metadata = {
        name: 'papamama_spots_reviews_backup.json',
        mimeType: 'application/json'
      };
      
      const boundary = 'papamama_backup_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(reviewsData) +
        closeDelimiter;

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
      });

      if (!res.ok) {
        throw new Error(`Failed to create backup: ${res.statusText}`);
      }

      return true;
    } catch (err) {
      console.error('Error creating backup file:', err);
      throw err;
    }
  }
};

// Load reviews data from Google Drive
export const loadReviewsFromDrive = async (): Promise<any | null> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Drive integration not signed in.');
  }

  const fileId = await findBackupFile(token);
  if (!fileId) {
    return null; // No backup file found
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file content: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error loading backup file content:', err);
    throw err;
  }
};
