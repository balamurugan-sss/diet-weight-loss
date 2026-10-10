import { ProfileWizard } from "@/components/onboarding/ProfileWizard";
import { requireOnboarded } from "@/server/auth/dal";
import { profileToDraft } from "@/server/services/profileDraft";

export const metadata = { title: "Edit profile" };

const STEPS = ["about", "body", "activity", "health", "food", "kitchen", "meals", "style"] as const;

export default async function EditProfilePage({ searchParams }: PageProps<"/profile/edit">) {
  const { user, profile } = await requireOnboarded();
  const step = String((await searchParams).step ?? "about");
  const startAt = (STEPS as readonly string[]).includes(step) ? (step as (typeof STEPS)[number]) : "about";
  return (
    <div>
      <ProfileWizard initial={profileToDraft(user, profile)} mode="edit" startAt={startAt} />
    </div>
  );
}
