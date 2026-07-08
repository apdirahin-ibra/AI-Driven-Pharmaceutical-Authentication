import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
import { AxiosError } from "axios";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/auth/AuthProvider";
import { createManagedUser, deleteManagedUser, listManagedUsers, updateManagedUser, type ManagedUser, type UpdateManagedUserInput } from "@/api/users";
import { MetricCard } from "@/components/shared/MetricCard";
import type { UserRole } from "@/types/domain";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [role, setRole] = useState<UserRole>("Pharmacist");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === "Admin").length,
    pharmacists: users.filter((user) => user.role === "Pharmacist").length,
  }), [users]);

  const loadUsers = () => {
    setIsLoading(true);
    listManagedUsers()
      .then((nextUsers) => {
        setUsers(nextUsers);
        setError("");
      })
      .catch((caughtError) => setError(userErrorMessage(caughtError, "load users")))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadUsers, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    if (!fullName || !email || !password) {
      setMessage("");
      setError("Enter full name, email, password, and role.");
      return;
    }
    setIsCreating(true);
    setError("");
    setMessage("");
    try {
      const created = await createManagedUser({ fullName, email, password, role });
      setUsers((current) => [created, ...current.filter((user) => user.id !== created.id)]);
      setMessage(`${created.fullName} was created as ${created.role}.`);
      event.currentTarget.reset();
      setRole("Pharmacist");
    } catch (caughtError) {
      try {
        const refreshedUsers = await listManagedUsers();
        const created = refreshedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
        setUsers(refreshedUsers);
        if (created) {
          setError("");
          setMessage(`${created.fullName} was created as ${created.role}.`);
          event.currentTarget.reset();
          setRole("Pharmacist");
          return;
        }
      } catch {
        // Keep the original create error below.
      }
      setMessage("");
      setError(userErrorMessage(caughtError, "create user"));
    } finally {
      setIsCreating(false);
    }
  };

  const saveUser = async (id: string, input: UpdateManagedUserInput) => {
    setIsSavingEdit(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateManagedUser(id, input);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditingUser(null);
      setMessage(`${updated.fullName} was updated.`);
    } catch (caughtError) {
      setError(userErrorMessage(caughtError, "update user"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const removeUser = async (targetUser: ManagedUser) => {
    if (targetUser.id === currentUser?.id) {
      setMessage("");
      setError("You cannot delete your own active admin account.");
      return;
    }

    const confirmed = window.confirm(`Delete ${targetUser.fullName}? This removes the Supabase Auth account.`);
    if (!confirmed) return;

    setDeletingId(targetUser.id);
    setError("");
    setMessage("");
    try {
      await deleteManagedUser(targetUser.id);
      setUsers((current) => current.filter((item) => item.id !== targetUser.id));
      setMessage(`${targetUser.fullName} was deleted.`);
    } catch (caughtError) {
      setError(userErrorMessage(caughtError, "delete user"));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        description="Create Admin and Pharmacist accounts with role-based access to PharmaGuard AI."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Total Users" value={counts.total} detail="Supabase Auth users" Icon={UsersRound} />
        <MetricCard label="Admins" value={counts.admins} detail="Can manage users" Icon={ShieldCheck} tone="blue" />
        <MetricCard label="Pharmacists" value={counts.pharmacists} detail="Can authenticate medicine" Icon={UserPlus} tone="real" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
          <CardContent>
            {message && <Alert className="mb-5"><AlertDescription>{message}</AlertDescription></Alert>}
            {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Ahmed Hassan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" name="password" type="password" placeholder="Minimum 6 characters" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                <UserPlus className="h-5 w-5" />
                {isCreating ? "Creating user..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Users</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Sign In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-semibold">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.lastSignInAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setEditingUser(user)} aria-label={`Edit ${user.fullName}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeUser(user)}
                          disabled={deletingId === user.id || user.id === currentUser?.id}
                          aria-label={`Delete ${user.fullName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>}
          </CardContent>
        </Card>
      </div>
      <EditUserDialog
        user={editingUser}
        isSaving={isSavingEdit}
        onSave={saveUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />
    </div>
  );
}

function EditUserDialog({
  user,
  isSaving,
  onSave,
  onOpenChange,
}: {
  user: ManagedUser | null;
  isSaving: boolean;
  onSave: (id: string, input: UpdateManagedUserInput) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Pharmacist");

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
  }, [user]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    onSave(user.id, {
      fullName: fullName.trim(),
      email: email.trim(),
      role,
      ...(password ? { password } : {}),
    });
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(92vw,560px)]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update profile details, role access, or set a new temporary password.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="editFullName">Full Name</Label>
            <Input id="editFullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail">Email</Label>
            <Input id="editEmail" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPassword">New Password</Label>
            <Input id="editPassword" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current password" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={role === "Admin" ? "default" : "secondary"}>{role}</Badge>;
}

function formatDate(value?: string): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function userErrorMessage(error: unknown, action: string): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail?.message === "string") return detail.message;
    if (typeof detail === "string") return detail;
    if (error.code === "ECONNABORTED") return `Could not ${action}. The request timed out.`;
  }
  return `Could not ${action}. Check your admin access and Supabase connection.`;
}
