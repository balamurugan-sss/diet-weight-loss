import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { ProfileGate } from "./ProfileGate";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-4 lg:px-8 lg:pb-10">
          <ProfileGate>{children}</ProfileGate>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
