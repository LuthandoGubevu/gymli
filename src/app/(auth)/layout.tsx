
import { Logo } from "@/components/logo";
import { InstallPrompt } from "@/components/install-prompt";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex justify-center">
                    <Logo />
                </div>
                {children}
            </div>
            <InstallPrompt />
        </main>
    );
}
