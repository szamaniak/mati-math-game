// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBlgTR-2Ztd6-Nr_rQFGvWVYJkDBuyxlZU",
  authDomain: "mati-math-game.firebaseapp.com",
  projectId: "mati-math-game",
  storageBucket: "mati-math-game.firebasestorage.app",
  messagingSenderId: "622286563254",
  appId: "1:622286563254:web:cfd6eba1fe4394af470317",
  measurementId: "G-Q1N8GH0X7S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Musisz mieć 'export' przed każdą stałą, której chcesz użyć w AuthManager
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();