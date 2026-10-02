import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import App from "./App";

it("selects a video, analyzes it, shows the result and resets", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
            prediction: "real",
            confidence: 0.87,
            probabilities: { real: 0.87, fake: 0.13 }
        }), { status: 200, headers: { "Content-Type": "application/json" } })
    ));
    const user = userEvent.setup();
    const video = new File(["fake video content"], "clip.mp4", { type: "video/mp4" });

    render(<App />);

    await user.upload(screen.getByLabelText("Video file"), video);
    expect(screen.getByText("clip.mp4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Analyze Video" }));

    expect(await screen.findByText("Analysis Result")).toBeInTheDocument();
    expect(screen.getByText("Real", { selector: ".verdict-badge span" })).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
    expect(screen.getByText("MP4")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Analyze another video/ }));

    expect(screen.getByText("Upload a video")).toBeInTheDocument();
    expect(screen.queryByText("Analysis Result")).not.toBeInTheDocument();
});
