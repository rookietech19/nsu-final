// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnvsDXW2BHRb6XJDgvXPntb1l7bren6II",
  authDomain: "acadtrack-31f66.firebaseapp.com",
  projectId: "acadtrack-31f66",
  storageBucket: "acadtrack-31f66.firebasestorage.app",
  messagingSenderId: "88468135896",
  appId: "1:88468135896:web:014af5f76d74c9748e1cad"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { app, db };
