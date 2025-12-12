import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: "blue" | "green" | "amber" | "purple" | "red";
}

export function StatsCard({ title, value, icon: Icon, iconColor }: StatsCardProps) {
  const iconColors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600", 
    amber: "bg-amber-100 text-amber-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600"
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${iconColors[iconColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-xl font-semibold text-slate-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
