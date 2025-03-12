import { AuthCard } from "@/components/auth-card";

export default function LoginPage() {
  return (
    <div className="grow flex flex-col items-center justify-center h-screen">
      <section className="w-[32rem] space-y-4">
        <AuthCard />
      </section>
    </div>
  );
}
