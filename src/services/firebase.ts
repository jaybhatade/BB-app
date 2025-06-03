// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDh7y9LsANLOjlgI7a7cC1lXE3GPk2mFHA",
    authDomain: "d-bloom-budget.firebaseapp.com",
    projectId: "d-bloom-budget",
    storageBucket: "d-bloom-budget.firebasestorage.app",
    messagingSenderId: "727477284643",
    appId: "1:727477284643:web:ea9ddd76a4bbe07364e696",
    measurementId: "G-B5GG3BRCRZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut
};
