import { Outlet } from "react-router-dom";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <Outlet />
      <LandingFooter />
    </div>
  );
}
