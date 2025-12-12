import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BellIcon, UserCircle, Gauge, MapPin, Wallet, Upload, Briefcase, DollarSign, Clock, Route, ChevronRight, Download } from "lucide-react";
import { JobCard } from "@/components/dashboard/job-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SelectedGigs } from "@/components/dashboard/selected-gigs";
import { RouteOptimizer } from "@/components/dashboard/route-optimizer";
import { MapView } from "@/components/map/map-view";
import { EarningsSummary } from "@/components/wallet/earnings-summary";
import { TransactionList } from "@/components/wallet/transaction-list";
import { ImportOptions } from "@/components/import/import-options";
import { ManualEntry } from "@/components/import/manual-entry";
import { AutoScheduler } from "@/components/scheduling/auto-scheduler";
import { EarningsDashboard } from "@/components/analytics/earnings-dashboard";
import { CalendarExportButton } from "@/components/export/calendar-export-button";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import type { Gig, Source } from "@shared/schema";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedGigs, setSelectedGigs] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    source: "all",
    priority: "all",
    date: "all"
  });

  const { data: stats, isLoading: statsLoading } = useQuery<{
    availableGigs: number;
    totalValue: string;
    estimatedHours: string;
    routeEfficiency: string;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: gigs, isLoading: gigsLoading, refetch: refetchGigs } = useQuery<Gig[]>({
    queryKey: ["/api/gigs"],
  });

  const { data: sources } = useQuery<Source[]>({
    queryKey: ["/api/sources"],
  });

  const handleGigSelection = (gigId: string, selected: boolean) => {
    const newSelection = new Set(selectedGigs);
    if (selected) {
      newSelection.add(gigId);
    } else {
      newSelection.delete(gigId);
    }
    setSelectedGigs(newSelection);
  };

  const handleOptimizeRoute = () => {
    // This would integrate with route optimization service
    console.log("Optimizing route for selected gigs:", Array.from(selectedGigs));
  };

  const handleMarkCompleted = async (gigId: string) => {
    try {
      await fetch(`/api/gigs/${gigId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });
      
      // Remove from selected list and refetch
      const newSelection = new Set(selectedGigs);
      newSelection.delete(gigId);
      setSelectedGigs(newSelection);
      refetchGigs();
    } catch (error) {
      console.error('Error marking gig as completed:', error);
    }
  };

  const handleRemoveFromSelected = (gigId: string) => {
    const newSelection = new Set(selectedGigs);
    newSelection.delete(gigId);
    setSelectedGigs(newSelection);
  };

  const handleRouteOptimized = (optimizedGigIds: string[]) => {
    // Update the selected gigs order based on optimization
    setSelectedGigs(new Set(optimizedGigIds));
  };

  const filteredGigs = gigs?.filter(gig => {
    if (filters.source !== "all" && gig.sourceId !== filters.source) return false;
    if (filters.priority !== "all" && gig.priority !== filters.priority) return false;
    // Add date filtering logic here
    return true;
  }) || [];

  const selectedGigsList = gigs?.filter(gig => selectedGigs.has(gig.id)) || [];

  const todaysEarnings = "$127.50"; // This would come from API

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Gauge },
    { id: "action-list", label: `Action List (${selectedGigs.size})`, icon: Briefcase },
    { id: "map", label: "Map & Routes", icon: MapPin },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "import", label: "Import", icon: Upload },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Route className="text-white w-5 h-5" />
              </div>
              <h1 className="ml-3 text-xl font-semibold text-slate-800">GigConnect</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {todaysEarnings} today
              </div>
              <Button variant="ghost" size="sm">
                <BellIcon className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <UserCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? "bg-blue-500 text-white hover:bg-blue-600" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                title="Available Gigs"
                value={statsLoading ? "..." : stats?.availableGigs || "0"}
                icon={Briefcase}
                iconColor="blue"
              />
              <StatsCard
                title="Total Value"
                value={statsLoading ? "..." : `$${stats?.totalValue || "0.00"}`}
                icon={DollarSign}
                iconColor="green"
              />
              <StatsCard
                title="Est. Hours"
                value={statsLoading ? "..." : stats?.estimatedHours || "0"}
                icon={Clock}
                iconColor="amber"
              />
              <StatsCard
                title="Route Score"
                value={statsLoading ? "..." : stats?.routeEfficiency || "0%"}
                icon={Route}
                iconColor="purple"
              />
            </div>

            {/* Earnings Analytics */}
            <EarningsDashboard />

            {/* Auto-Scheduler */}
            <AutoScheduler />

            {/* Filters and Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                  <div className="flex flex-wrap gap-3">
                    <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Sources" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {sources?.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.priority} onValueChange={(value) => setFilters({...filters, priority: value})}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="low">Low Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filters.date} onValueChange={(value) => setFilters({...filters, date: value})}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button className="bg-blue-500 hover:bg-blue-600">
                      <Route className="w-4 h-4 mr-2" />
                      Build Route
                    </Button>
                    <CalendarExportButton gigIds={Array.from(selectedGigs)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Listings */}
            <div className="space-y-4">
              {gigsLoading ? (
                <div>Loading gigs...</div>
              ) : filteredGigs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-slate-600">No gigs found matching your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredGigs.map((gig) => (
                  <JobCard
                    key={gig.id}
                    gig={gig}
                    selected={selectedGigs.has(gig.id)}
                    onSelectionChange={(selected) => handleGigSelection(gig.id, selected)}
                  />
                ))
              )}
              {filteredGigs.length > 0 && (
                <div className="text-center py-6">
                  <Button variant="outline">
                    Load More Gigs <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action List Tab */}
        {activeTab === "action-list" && (
          <div className="space-y-6">
            <SelectedGigs
              selectedGigs={selectedGigsList}
              onOptimizeRoute={handleOptimizeRoute}
              onMarkCompleted={handleMarkCompleted}
              onRemoveFromSelected={handleRemoveFromSelected}
            />
            <RouteOptimizer
              selectedGigs={selectedGigsList}
              onRouteOptimized={handleRouteOptimized}
            />
          </div>
        )}

        {/* Map Tab */}
        {activeTab === "map" && (
          <MapView gigs={filteredGigs} selectedGigs={selectedGigs} />
        )}

        {/* Wallet Tab */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <EarningsSummary />
            <TransactionList />
          </div>
        )}

        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="space-y-6">
            <ImportOptions onImportSuccess={() => refetchGigs()} />
            <ManualEntry onGigAdded={() => refetchGigs()} />
          </div>
        )}
      </main>
    </div>
  );
}
