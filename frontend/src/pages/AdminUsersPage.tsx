import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, Pencil, Search, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
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
import { formatDate, formatDateTime } from "@/lib/utils";
import type { UserRole } from "@/types/domain";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [role, setRole] = useState<UserRole>("Pharmacist");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | UserRole>("All");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const createInFlight = useRef(false);

  const counts = useMemo(() => ({
    total: users.length,
    admins: users.filter((user) => user.role === "Admin").length,
    pharmacists: users.filter((user) => user.role === "Pharmacist").length,
  }), [users]);

  const filteredUsers = useMemo(() => users.filter((managedUser) => {
    const matchesQuery = `${managedUser.fullName} ${managedUser.email}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (roleFilter === "All" || managedUser.role === roleFilter);
  }), [query, roleFilter, users]);

  const loadUsers = useCallback(() => {
    setIsLoading(true);
    listManagedUsers()
      .then((nextUsers) => {
        setUsers(nextUsers);
        setError("");
      })
      .catch((caughtError) => setError(userErrorMessage(caughtError, "load users")))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => loadUsers(), [loadUsers]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createInFlight.current) return;
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    if (!fullName || !email || !password || password.length < 8) {
      setMessage("");
      setError("Enter a full name, valid email, role, and a temporary password with at least 8 characters.");
      return;
    }
    createInFlight.current = true;
    setIsCreating(true);
    setError("");
    setMessage("");
    setRefreshWarning("");
    try {
      const created = await createManagedUser({ fullName, email, password, role });
      setUsers((current) => [created, ...current.filter((user) => user.id !== created.id)]);
      setMessage("User created successfully.");
      formElement.reset();
      setRole("Pharmacist");
      try {
        const refreshedUsers = await listManagedUsers();
        setUsers(refreshedUsers);
      } catch {
        setRefreshWarning("User created successfully. The user list refresh failed; use Retry to revalidate the list.");
      }
    } catch (caughtError) {
      setMessage("");
      setError(userErrorMessage(caughtError, "create user"));
    } finally {
      createInFlight.current = false;
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
    if (targetUser.role === "Admin" && counts.admins <= 1) {
      setMessage("");
      setError("The final active administrator cannot be deleted.");
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

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle>Create User</CardTitle></CardHeader>
          <CardContent>
            {message && <Alert className="mb-5"><AlertDescription>{message}</AlertDescription></Alert>}
            {refreshWarning && <Alert className="mb-5"><AlertDescription><span>{refreshWarning}</span><Button type="button" variant="ghost" size="sm" className="ml-2" onClick={loadUsers}>Retry</Button></AlertDescription></Alert>}
            {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Ahmed Hassan" autoComplete="name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="user@example.com" autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Minimum 8 characters" autoComplete="new-password" className="pr-11" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-9 w-9" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide temporary password" : "Show temporary password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">Use at least 8 characters. Share the temporary password through a secure channel.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="create-role"><SelectValue /></SelectTrigger>
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
          <CardHeader className="gap-4"><CardTitle>Users</CardTitle><div className="grid gap-2 sm:grid-cols-[1fr_180px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" className="pl-9" /></div><Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as "All" | UserRole)}><SelectTrigger aria-label="Filter users by role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All roles</SelectItem><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Pharmacist">Pharmacist</SelectItem></SelectContent></Select></div></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table className="min-w-[700px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[18%]">Name</TableHead>
                  <TableHead className="w-[25%]">Email</TableHead>
                  <TableHead className="w-[13%]">Role</TableHead>
                  <TableHead className="w-[14%]">Created</TableHead>
                  <TableHead className="w-[19%]">Last Sign In</TableHead>
                  <TableHead className="w-[11%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="truncate whitespace-nowrap font-semibold" title={user.fullName}>{user.fullName}</TableCell>
                    <TableCell className="truncate" title={user.email}>{user.email}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(user.lastSignInAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setEditingUser(user)} aria-label={`Edit user ${user.fullName}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeUser(user)}
                          disabled={deletingId === user.id || user.id === currentUser?.id || (user.role === "Admin" && counts.admins <= 1)}
                          aria-label={`Delete user ${user.fullName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{users.length ? "No users match the current search and role filter." : "No users found."}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
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
            <Label htmlFor="edit-role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
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

function userErrorMessage(error: unknown, action: string): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail?.message === "string") return detail.message;
    if (typeof detail === "string") return detail;
    if (error.code === "ECONNABORTED") return `Could not ${action}. The request timed out.`;
  }
  return `Could not ${action}. Check your admin access and Supabase connection.`;
}
