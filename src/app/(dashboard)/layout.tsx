import { auth } from "@/auth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <DashboardLayout
            user={{
                name: session?.user?.name,
                role: session?.user?.role
            }}
        >
            {children}
        </DashboardLayout>
    );
}
