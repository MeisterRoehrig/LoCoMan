"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { FirebaseError } from "firebase/app"

import {useState } from 'react';
import { auth, firestore } from "@/lib/firebase-config"
import { toast } from "sonner"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';

function generateUsernameFromEmail(email: string) {
  if (!email || typeof email !== 'string') return null;

  const base = email.split('@')[0];
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')       // remove special chars
    .slice(0, 20);                   // limit to 20 chars (optional)
}

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.warning("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)

      const userID = auth.currentUser?.uid;
      if (!userID) {
        throw new Error("User ID is undefined");
      }
      const userMail = auth.currentUser?.email ?? 'e@mail.com'
      const userName = generateUsernameFromEmail(userMail);
      const batch = writeBatch(firestore);

      const exampleProjects = [
        {
          title: 'Project Alpha',
          description: 'First project description',
          texts: [
            { content: 'Hello world from Alpha 1' },
            { content: 'Another piece of Alpha text' }
          ]
        },
        {
          title: 'Project Beta',
          description: 'Second project details',
          texts: [
            { content: 'Beta text A' },
            { content: 'Beta text B with more depth' }
          ]
        }
      ];

      const userRef = doc(firestore, 'users', userID);
      batch.set(userRef, {
        displayName: userName,
        email: userMail,
        createdAt: serverTimestamp(),
      });

      exampleProjects.forEach((project, pIndex) => {
        const projectId = `project-${pIndex + 1}`;
        const projectRef = doc(firestore, 'users', userID, 'projects', projectId);

        batch.set(projectRef, {
          title: project.title,
          description: project.description,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Add texts to each project
        project.texts.forEach((text, tIndex) => {
          const textId = `text-${tIndex + 1}`;
          const textRef = doc(firestore, 'users', userID, 'projects', projectId, 'texts', textId);

          batch.set(textRef, {
            content: text.content,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });
      });



      await batch.commit();
      toast.success("Account created successfully!", {
        description: `User ID is: ${userID}`,
      })
      // Optional: redirect to login or dashboard
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError
      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          toast.error("This email is already registered.")
          break
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.")
          break
        case "auth/weak-password":
          toast.error("Password should be at least 6 characters.")
          break
        default:
          toast.error("Sign up failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              Enter your email and password to sign up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 text-center text-sm">
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
