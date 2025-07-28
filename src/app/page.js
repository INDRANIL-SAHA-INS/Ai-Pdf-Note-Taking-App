"use client";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { use } from "react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const { user } = useUser();// Clerk for user management
  const adduser = useMutation(api.user.addUser);
  useEffect(() => {
    if (user) {
      handleAddUser();
    }
  }, [user]);
  const handleAddUser = async () => {
    try {
      const username = user?.username || 
                      user?.firstName || 
                      user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 
                      `user_${user?.id?.slice(-8)}`;
                      
      await adduser({
        username: username,
        email: user?.primaryEmailAddress?.emailAddress || "",
        imageUrl: user?.imageUrl,
      });
      console.log("User added successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };
  return (
    <div>
      <h1 className="text-3xl font-bold underline">Welcome to AI Note Taking App</h1>
      <Button variant="destructive">Get Started</Button>
      <UserButton />
    </div>
  );
}
