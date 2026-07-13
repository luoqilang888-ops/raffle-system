import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisplayClient } from "@/components/display/DisplayClient";
import { demoDisplayState, demoDisplayToken } from "@/lib/mock-data";

vi.mock("@/components/display/LotteryMachine", () => ({
  LotteryMachine: () => <canvas data-testid="lottery-canvas" />,
}));

describe("display safety", () => {
  it("does not render admin controls or participant names on the display page", () => {
    render(
      <DisplayClient
        initialState={demoDisplayState}
        eventSlug="demo-event"
        displayToken={demoDisplayToken}
      />,
    );

    expect(screen.queryByText("开始抽奖")).not.toBeInTheDocument();
    expect(screen.queryByText("停止抽奖")).not.toBeInTheDocument();
    expect(screen.queryByText("第一组")).not.toBeInTheDocument();
    expect(screen.queryByText("张三")).not.toBeInTheDocument();
    expect(screen.getByTestId("lottery-canvas")).toBeInTheDocument();
  });
});
