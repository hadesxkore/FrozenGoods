import { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create a user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      role: "admin", // Default role for now
      createdAt: new Date().toISOString()
    });
    return userCredential;
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Immediately update the currentUser state for faster UI response
      if (userCredential?.user) {
        const userProfile = await getUserProfile(userCredential.user.uid);
        setCurrentUser({...userCredential.user, ...userProfile});
      }
      
      return userCredential;
    } catch (error) {
      console.error("Login error in context:", error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const getUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userProfile = await getUserProfile(user.uid);
          setCurrentUser({ ...user, ...userProfile });
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
        setAuthReady(true);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    getUserProfile,
    authReady
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 