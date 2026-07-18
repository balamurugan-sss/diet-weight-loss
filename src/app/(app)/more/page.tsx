import Link from "next/link";
import {
  LineChart,
  ShoppingCart,
  Search,
  Sparkles,
  FileText,
  Bell,
  Crown,
  Shield,
  Settings,
} from "lucide-react";

const ITEMS = [
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
  { href: "/food-search", label: "Food Search", icon: Search },
  { href: "/recipes/generator", label: "Recipe Generator", icon: Sparkles },
  { href: "/insights", label: "AI Insights", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/premium", label: "Premium", icon: Crown },
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function MorePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">More</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Everything else FitFusion AI has to offer.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="glass-card flex flex-col items-center gap-2 p-5 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-white">
              <item.icon size={20} />
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
