import type { Metadata } from "next";
import { StakeholderTour } from "@/components/stakeholder-tour";

export const metadata: Metadata = {
  title: "Product tour · Alpha Consultancy",
  description: "Follow the privacy-first recruitment journey across employer, admin, and employee workspaces.",
};

export default function TourPage() {
  return <StakeholderTour />;
}
