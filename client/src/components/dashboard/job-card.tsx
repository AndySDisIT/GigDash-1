import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Clock, Calendar, DollarSign, ChevronRight } from "lucide-react";
import type { Gig } from "@shared/schema";
import { format } from "date-fns";

interface JobCardProps {
  gig: Gig;
  selected: boolean;
  onSelectionChange: (selected: boolean) => void;
}

export function JobCard({ gig, selected, onSelectionChange }: JobCardProps) {
  const totalPay = parseFloat(gig.payBase) + parseFloat(gig.tipExpected || "0") + parseFloat(gig.payBonus || "0");
  const hourlyRate = totalPay / (gig.estimatedDuration / 60);
  
  const priorityColors = {
    high: "border-l-4 border-green-500",
    medium: "border-l-4 border-amber-500",
    low: "border-l-4 border-red-500"
  };

  const priorityBadgeColors = {
    high: "bg-green-100 text-green-800",
    medium: "bg-amber-100 text-amber-800", 
    low: "bg-red-100 text-red-800"
  };

  const hourlyRateColors = {
    high: "text-green-600",
    medium: "text-amber-600",
    low: "text-red-600"
  };

  return (
    <Card className={`${priorityColors[gig.priority]} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelectionChange}
              className="mr-3"
            />
            <div>
              <h3 className="font-semibold text-slate-800">{gig.title}</h3>
              <p className="text-sm text-slate-600">{gig.sourceId} • {gig.description}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`mb-1 text-xs font-medium ${priorityBadgeColors[gig.priority]}`}>
              {gig.priority.toUpperCase()}
            </Badge>
            <div className="text-lg font-semibold text-slate-800">
              ${totalPay.toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center text-slate-600">
            <MapPin className="text-slate-400 mr-2 w-4 h-4" />
            <span>{gig.travelDistance ? `${gig.travelDistance} mi away` : gig.location}</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Clock className="text-slate-400 mr-2 w-4 h-4" />
            <span>{Math.round(gig.estimatedDuration / 60 * 10) / 10} hrs</span>
          </div>
          <div className="flex items-center text-slate-600">
            <Calendar className="text-slate-400 mr-2 w-4 h-4" />
            <span>Due: {format(new Date(gig.dueDate), "MMM d")}</span>
          </div>
          <div className={`flex items-center ${hourlyRateColors[gig.priority]}`}>
            <DollarSign className={`mr-2 w-4 h-4 ${hourlyRateColors[gig.priority].replace('text-', 'text-')}`} />
            <span>${hourlyRate.toFixed(2)}/hr</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            <span className="font-medium">Score:</span> {gig.score || "N/A"}/100 • 
            <span className="font-medium"> ETA:</span> {gig.travelTime ? `${gig.travelTime} min drive` : "N/A"}
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Details <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
