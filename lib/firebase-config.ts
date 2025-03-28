import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";

const firebaseConfig = {
  apiKey: "AIzaSyD4qFSZPUYMoo4J62Czfc1lCPwwpiy5wwk",
  authDomain: "locoman-f465a.firebaseapp.com",
  projectId: "locoman-f465a",
  storageBucket: "locoman-f465a.firebasestorage.app",
  messagingSenderId: "385087703943",
  appId: "1:385087703943:web:3fbbdfc003de2ca519a122",
  measurementId: "G-1CNNFHB9SP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize the Vertex AI service
const vertexAI = getVertexAI(app);
// Create a `GenerativeModel` instance with a model that supports your use case
const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" });


const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, model};