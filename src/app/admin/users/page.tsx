import { getAdminUsers } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";

const ROLE_TONE = {
  admin: "danger",
  seller: "primary",
  customer: "neutral",
} as const;

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.fullName || "—"}</td>
                <td className="px-4 py-3 text-muted">{u.email || "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone={ROLE_TONE[u.role as keyof typeof ROLE_TONE] ?? "neutral"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
