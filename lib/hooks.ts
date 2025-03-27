"use client"
import { auth} from '@/lib/firebase-config';
import { useAuthState } from 'react-firebase-hooks/auth';

// Custom hook to read  auth record and user profile doc
export function useUserData() {
  const [user] = useAuthState(auth);



  return { user };
}