import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileSearch, History, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analyze", label: "Analyze Form", icon: FileSearch },
  // { href: "/jobs", label: "Job History", icon: History },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-card/50 hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-border/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          FormAuto
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Google Forms Automation</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/10">
          <p className="text-sm font-medium text-foreground">Need Help?</p>
          <p className="text-xs text-muted-foreground mt-1">Check the documentation for spreadsheet formatting.</p>
        </div>
      </div>
    </aside>
  );
}
