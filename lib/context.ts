"use client"
import React from "react";
import { User } from "firebase/auth"; // Adjust the import based on your setup

interface UserContextType {
  user: User | null;
}

export const UserContext = React.createContext<UserContextType>({
  user: null
});