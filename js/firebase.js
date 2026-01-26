import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvY-18ClqAL6o5eOO149pwTfmjx3O7Y3E",
  authDomain: "khulna-store-80b45.firebaseapp.com",
  projectId: "khulna-store-80b45",
  storageBucket: "khulna-store-80b45.firebasestorage.app",
  messagingSenderId: "182798338118",
  appId: "1:182798338118:web:caf912fb52645f3073a247"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
