import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TutorMarkdown } from "./tutor-markdown";

/**
 * Rendering model output safely, and while it is still arriving.
 *
 * Every string this component receives was produced by a model that was
 * fed a problem statement, a chapter body and the learner's own code — all
 * of which are untrusted. So the property that matters most is not that
 * the markdown is pretty: it is that nothing in it can ever become markup.
 */

describe("TutorMarkdown", () => {
  it("renders paragraphs", () => {
    render(<TutorMarkdown content={"First thought.\n\nSecond thought."} />);
    expect(screen.getByText("First thought.")).toBeInTheDocument();
    expect(screen.getByText("Second thought.")).toBeInTheDocument();
  });

  it("renders inline code", () => {
    const { container } = render(
      <TutorMarkdown content="Track `left` and `right`." />
    );
    const codes = container.querySelectorAll("code");
    expect([...codes].map((c) => c.textContent)).toContain("left");
  });

  it("renders bold text", () => {
    const { container } = render(<TutorMarkdown content="This is **important**." />);
    expect(container.querySelector("strong")?.textContent).toBe("important");
  });

  it("renders bullet and numbered lists", () => {
    const { container } = render(
      <TutorMarkdown content={"- one\n- two\n\n1. first\n2. second"} />
    );
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  it("renders a fenced code block with its language", () => {
    const { container } = render(
      <TutorMarkdown content={"```python\nfor i in range(n):\n    pass\n```"} />
    );
    expect(screen.getByText("python")).toBeInTheDocument();
    expect(container.querySelector("pre code")?.textContent).toContain(
      "for i in range(n):"
    );
  });

  it("renders an unterminated fence while the answer is still streaming", () => {
    // Mid-stream this is the normal case, not an error. Waiting for the
    // closing fence would make code appear only after the block finished.
    const { container } = render(
      <TutorMarkdown content={"Here:\n```python\ndef f():"} />
    );
    expect(container.querySelector("pre code")?.textContent).toContain("def f():");
  });

  it("offers copy only once a code block is complete", () => {
    const { rerender } = render(
      <TutorMarkdown content={"```python\ndef f():"} />
    );
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();

    rerender(<TutorMarkdown content={"```python\ndef f():\n    pass\n```"} />);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("never turns model output into markup", () => {
    const hostile =
      '<img src=x onerror="alert(1)"> <script>alert(2)</script> <b>bold?</b>';
    const { container } = render(<TutorMarkdown content={hostile} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("b")).toBeNull();
    // The characters are shown as text, which is exactly right.
    expect(container.textContent).toContain("<img src=x");
  });

  it("does not let HTML inside a code fence escape either", () => {
    const { container } = render(
      <TutorMarkdown content={"```html\n<script>alert(1)</script>\n```"} />
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("pre code")?.textContent).toContain(
      "<script>alert(1)</script>"
    );
  });

  it("renders an empty response without crashing", () => {
    const { container } = render(<TutorMarkdown content="" />);
    expect(container).toBeTruthy();
  });
});
