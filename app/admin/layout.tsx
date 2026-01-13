import { Toaster } from 'sonner'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="dark min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {children}
            <Toaster theme="dark" position="bottom-right" />
        </div>
    )
}
