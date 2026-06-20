import Sidebar from "./Sidebar";
import Header from "./Header";
import type { ReactNode } from "react";

export default function AppLayout({
  children,
  workflows
}: {
  children: ReactNode;
  workflows?: any;
}) {
  return (
    <div>
      <Header />
      <Sidebar workflows={workflows} />

      <div className="ml-[240px] mt-[60px] p-5 bg-gray-100 min-h-screen">
        {children}
      </div>
    </div>
  );
}