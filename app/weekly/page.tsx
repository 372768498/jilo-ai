import { redirect } from "next/navigation";

// Redirect legacy /weekly to /en/weekly
export default function WeeklyRedirect() {
  redirect("/en/weekly");
}
