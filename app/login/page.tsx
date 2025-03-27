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

import { useState } from "react"
import { auth } from "@/lib/firebase-config"
import { signInWithEmailAndPassword } from "firebase/auth"
import { FirebaseError } from "firebase/app"
import { toast } from "sonner"


export default function Page() {
  // State for email & password inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // For showing error messages & loading state
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    try {
      // Use the compat method for signing in with email and password
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Logged in successfully!")
      console.log("Successfully signed in!")
      // You can redirect, e.g. router.push('/dashboard'), once authenticated
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError
      switch (firebaseError.code) {
        case "auth/user-not-found":
          toast.error("No user found with this email.")
          break
        case "auth/wrong-password":
          toast.error("Incorrect password.")
          break
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.")
          break
        default:
          toast.error("Login failed. Please try again.")
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
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your email below to login to your account
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
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </div>

                {/* Show error if any */}
                {errorMessage && (
                  <div className="text-red-600 text-sm mt-2">{errorMessage}</div>
                )}

              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
