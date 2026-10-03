"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { setFolhaRole } from "@/features/folha/actions";
import { FOLHA_ROLES, roleHome, type FolhaRole } from "@/features/folha/types";

export function RoleSwitcher({ role }: { role: FolhaRole }) {
  const t = useTranslations("folha.roles");
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Label className="sr-only" htmlFor="folha-role">
        {t("label")}
      </Label>
      <NativeSelect
        id="folha-role"
        name="role"
        value={role}
        onChange={async (event) => {
          const next = event.target.value as FolhaRole;
          await setFolhaRole(next);
          router.push(roleHome(next));
        }}
      >
        {FOLHA_ROLES.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
