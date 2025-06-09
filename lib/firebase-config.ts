import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getVertexAI, getGenerativeModel } from "firebase/vertexai";
import { getFunctions, httpsCallable } from "firebase/functions";

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

async function genApiKey() {
  const functions = getFunctions(app);
  const getGenAIKey = httpsCallable(functions, 'getGenAIKey');
  try {
    const result = await getGenAIKey();
    return (result.data as { genAiApiKey: string }).genAiApiKey;
  } catch (error) {
    console.error('Error calling Cloud Function:', error);
    throw error;
  }
}

export async function getServerSideGenApiKey() {
  let genAiApiKey = null;
  try {
    genAiApiKey = await genApiKey();
  } catch (error) {
    console.error("Failed to fetch API key", error);
  }
  return {
    props: {
      genAiApiKey,
    },
  };
}


export { auth, firestore, model,genApiKey};
