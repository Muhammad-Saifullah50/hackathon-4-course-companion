import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  AccountSkeleton,
  AccountCardSkeleton,
  BrandedLoader,
  DashboardSkeleton,
  ProgressBreakdownSkeleton,
  ProgressStatsSkeleton,
  Spinner,
} from "./loading-ui";

afterEach(cleanup);

describe("loading UI", () => {
  it("exposes accessible labels for page skeletons", () => {
    render(<DashboardSkeleton />);
    expect(screen.getByLabelText("Loading dashboard")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("renders account-shaped loading content", () => {
    render(
      <>
        <AccountSkeleton />
        <AccountCardSkeleton />
      </>,
    );
    expect(screen.getByLabelText("Loading account")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading account details")).toBeInTheDocument();
  });

  it("renders independent progress loading regions", () => {
    render(
      <>
        <ProgressStatsSkeleton />
        <ProgressBreakdownSkeleton />
      </>,
    );
    expect(
      screen.getByLabelText("Loading progress statistics"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Loading chapter progress"),
    ).toBeInTheDocument();
  });

  it("announces transition and inline loaders", () => {
    render(
      <>
        <BrandedLoader label="Signing out" />
        <Spinner label="Saving score" />
      </>,
    );
    expect(screen.getByText("Signing out")).toBeInTheDocument();
    expect(screen.getByText("Saving score")).toBeInTheDocument();
  });
});
