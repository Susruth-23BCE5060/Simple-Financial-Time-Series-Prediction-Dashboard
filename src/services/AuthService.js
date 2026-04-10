import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error logging in: ", error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out: ", error.message);
  }
};