import Sidebar from "@/components/sidebar/sidebar"
import { Toaster } from "react-hot-toast"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar />
      <div className="w-full min-w-0 flex-1">{children}</div>
      <Toaster position="top-center" />
    </div>
  )
}
