import { AccountScreen } from "@/components/account-screen";
import { verifySession } from "@/lib/auth-dal";
import {
  getServerAccess,
  getServerProfile,
} from "@/lib/authenticated-api";

export default async function AccountPage() {
  const session = await verifySession();
  const [profile, access] = await Promise.all([
    getServerProfile(),
    getServerAccess(),
  ]);
  return (
    <AccountScreen
      access={access}
      profile={profile}
      session={session}
    />
  );
}
