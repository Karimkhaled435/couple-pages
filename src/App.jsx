import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import CouplePage from "./CouplePage";
import SuccessPage from "./SuccessPage";

export default function App() {
  const [route, setRoute] = useState({ page: "dashboard", slug: null });

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/success") {
      setRoute({ page: "success", slug: null });
    } else {
      const match = path.match(/^\/for\/(.+)$/);
      if (match) {
        setRoute({ page: "couple", slug: match[1] });
      }
    }
  }, []);

  if (route.page === "success") return <SuccessPage />;
  if (route.page === "couple") return <CouplePage slug={route.slug} />;
  return <Dashboard />;
}