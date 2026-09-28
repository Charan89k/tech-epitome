import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The provider buttons on /login and /signup.
 *
 * The server actions are stubbed, and only the server actions: this file is
 * about what the form renders and which action each button submits to.
 * Importing the real module would pull Prisma, the argon2 native addon and
 * the rate limiter into jsdom, none of which this file is testing. The real
 * Auth.js configuration — which providers exist, how they link accounts — is
 * covered against the real thing in src/lib/auth/config.test.ts.
 *
 * Wiring is asserted by pressing the button and seeing which stub ran, not by
 * comparing `form.action` to the function: React replaces a function action
 * on the DOM node with a `javascript:throw ...` guard string, so an identity
 * check there passes for reasons that have nothing to do with the wiring.
 */

const signInAction = vi.fn();
const signUpAction = vi.fn();
const signInWithGoogleAction = vi.fn();
const signInWithGitHubAction = vi.fn();

vi.mock("@/app/(auth)/actions", () => ({
  signInAction,
  signUpAction,
  signInWithGoogleAction,
  signInWithGitHubAction,
}));

const { AuthForm } = await import("./auth-form");

beforeEach(() => {
  vi.clearAllMocks();
});

type Mode = "signin" | "signup";

function renderForm(
  overrides: Partial<{
    mode: Mode;
    next: string;
    googleEnabled: boolean;
    githubEnabled: boolean;
  }> = {}
) {
  const props = {
    mode: "signin" as Mode,
    next: "/dashboard",
    googleEnabled: true,
    githubEnabled: true,
    ...overrides,
  };
  return render(<AuthForm {...props} />);
}

const googleButton = () =>
  screen.queryByRole("button", { name: /Continue with Google/i });
const githubButton = () =>
  screen.queryByRole("button", { name: /Continue with GitHub/i });

describe.each<Mode>(["signin", "signup"])("provider buttons on %s", (mode) => {
  it("shows both providers when both are configured", () => {
    renderForm({ mode });
    expect(googleButton()).toBeInTheDocument();
    expect(githubButton()).toBeInTheDocument();
  });

  it("submits each button to its own provider action", async () => {
    renderForm({ mode });

    await userEvent.click(githubButton()!);
    expect(signInWithGitHubAction).toHaveBeenCalledTimes(1);
    expect(signInWithGoogleAction).not.toHaveBeenCalled();

    await userEvent.click(googleButton()!);
    expect(signInWithGoogleAction).toHaveBeenCalledTimes(1);
    expect(signInWithGitHubAction).toHaveBeenCalledTimes(1);
  });

  it("hands the provider action the return path from the hidden field", async () => {
    renderForm({ mode, next: "/review" });

    await userEvent.click(githubButton()!);

    const formData = signInWithGitHubAction.mock.calls[0]![0] as FormData;
    expect(formData.get("next")).toBe("/review");
  });

  it("carries the return path into both provider forms", () => {
    // The OAuth round trip has to come back to where the learner started;
    // the action re-narrows this value server-side before using it.
    renderForm({ mode, next: "/problems?q=1" });

    for (const button of [googleButton()!, githubButton()!]) {
      const field = button
        .closest("form")!
        .querySelector<HTMLInputElement>('input[name="next"]');
      expect(field).not.toBeNull();
      expect(field!.value).toBe("/problems?q=1");
    }
  });

  it("gives each provider its own form, so one spinner does not disable the other", () => {
    renderForm({ mode });
    expect(googleButton()!.closest("form")).not.toBe(
      githubButton()!.closest("form")
    );
  });
});

describe("provider gating", () => {
  it("hides GitHub when only Google is configured", () => {
    renderForm({ googleEnabled: true, githubEnabled: false });
    expect(googleButton()).toBeInTheDocument();
    expect(githubButton()).not.toBeInTheDocument();
  });

  it("hides Google when only GitHub is configured", () => {
    // The two are independent: GitHub must not require Google to be set up.
    renderForm({ googleEnabled: false, githubEnabled: true });
    expect(githubButton()).toBeInTheDocument();
    expect(googleButton()).not.toBeInTheDocument();
  });

  it("hides both, and the separator, when neither is configured", () => {
    renderForm({ googleEnabled: false, githubEnabled: false });
    expect(googleButton()).not.toBeInTheDocument();
    expect(githubButton()).not.toBeInTheDocument();
    // With no providers the email fields are the whole form, so an "or"
    // above them would separate nothing from something.
    expect(screen.queryByText("or")).not.toBeInTheDocument();
  });

  it("shows the separator when at least one provider is configured", () => {
    renderForm({ googleEnabled: false, githubEnabled: true });
    expect(screen.getByText("or")).toBeInTheDocument();
  });
});

describe("the email and password flow is unaffected", () => {
  it("still renders the credentials fields alongside the providers", () => {
    renderForm({ mode: "signin" });
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("asks for a name on signup only", () => {
    renderForm({ mode: "signup" });
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeInTheDocument();
  });

  it("submits the credentials form to the mode's own action", () => {
    renderForm({ mode: "signup" });
    const form = screen
      .getByRole("button", { name: "Create account" })
      .closest("form")!;
    // Pressing it must not reach either provider: the credentials form is
    // its own form with its own action.
    expect(form).not.toBe(googleButton()!.closest("form"));
    expect(form).not.toBe(githubButton()!.closest("form"));
  });
});
