import Dashboard from "./Dashboard";
import CouplePage from "./CouplePage";

export default function App() {
  const match = window.location.pathname.match(/^\/for\/([^/]+)\/?$/);
  if (match) {
    let slug = match[1];
    try { slug = decodeURIComponent(slug); } catch { /* keep raw slug */ }
    return <CouplePage slug={slug} />;
  }
  return <Dashboard />;
}
