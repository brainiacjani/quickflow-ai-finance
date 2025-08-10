import { PropsWithChildren } from "react";
import { MainNav } from "./MainNav";

export const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8 text-center text-sm text-foreground/60">
        © {new Date().getFullYear()} QuickFlow. All rights reserved.
      </footer>
    </div>
  );
};
