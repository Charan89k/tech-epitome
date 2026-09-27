"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import {
  updateSettingsAction,
  type SettingsFormState,
} from "@/app/(shell)/settings/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Language } from "@/generated/prisma/enums";

const LANGUAGE_LABELS: Record<Language, string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  JAVA: "Java",
  CPP: "C++",
  GO: "Go",
};

export type SettingsFormValues = {
  name: string;
  targetRole: string;
  preferredLanguage: Language;
  reducedMotion: boolean;
  emailDigest: boolean;
};

const INITIAL: SettingsFormState = { status: "idle" };

export function SettingsForm({ values }: { values: SettingsFormValues }) {
  const [state, formAction] = useActionState(updateSettingsAction, INITIAL);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "saved" && (
        <Alert className="border-success/30 bg-success/8">
          <Check className="text-success size-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "error" && state.message && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={values.name}
              maxLength={80}
              required
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" role="alert" className="text-destructive text-xs">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetRole">Target role</Label>
            <Input
              id="targetRole"
              name="targetRole"
              defaultValue={values.targetRole}
              maxLength={80}
              placeholder="Backend engineer, mid-level"
            />
            <p className="text-muted-foreground text-xs">
              Used to order company roadmaps. Optional.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Default language</Label>
            <Select name="preferredLanguage" defaultValue={values.preferredLanguage}>
              <SelectTrigger id="preferredLanguage" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Preselected in the code editor.
            </p>
          </div>

          <ToggleRow
            name="reducedMotion"
            label="Reduce motion"
            description="Visualizations step instantly instead of animating. Your operating system setting is always respected on top of this."
            defaultChecked={values.reducedMotion}
          />

          <ToggleRow
            name="emailDigest"
            label="Weekly progress email"
            description="A summary of what you covered and what is due for review."
            defaultChecked={values.emailDigest}
          />
        </CardContent>
      </Card>

      <SaveButton />
    </form>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1">
        <Label htmlFor={name}>{label}</Label>
        <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
          {description}
        </p>
      </div>
      <Switch id={name} name={name} defaultChecked={defaultChecked} />
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? "Saving…" : "Save changes"}
    </Button>
  );
}
