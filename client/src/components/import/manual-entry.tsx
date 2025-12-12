import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Source, InsertGig } from "@shared/schema";

interface ManualEntryProps {
  onGigAdded: () => void;
}

export function ManualEntry({ onGigAdded }: ManualEntryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: sources } = useQuery<Source[]>({
    queryKey: ["/api/sources"],
  });

  const [formData, setFormData] = useState({
    title: "",
    sourceId: "",
    payBase: "",
    estimatedDuration: "",
    dueDate: "",
    location: "",
    description: "",
    tipExpected: "0.00",
    payBonus: "0.00"
  });

  const createGigMutation = useMutation({
    mutationFn: async (gigData: InsertGig) => {
      const response = await apiRequest("POST", "/api/gigs", gigData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gig added successfully",
        description: "Your gig has been added to the dashboard.",
      });
      setFormData({
        title: "",
        sourceId: "",
        payBase: "",
        estimatedDuration: "",
        dueDate: "",
        location: "",
        description: "",
        tipExpected: "0.00",
        payBonus: "0.00"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onGigAdded();
    },
    onError: () => {
      toast({
        title: "Error adding gig",
        description: "There was an error adding your gig. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.sourceId || !formData.payBase || !formData.estimatedDuration || !formData.dueDate || !formData.location) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const gigData: InsertGig = {
      userId: "user-123", // This would come from auth in production
      sourceId: formData.sourceId,
      title: formData.title,
      description: formData.description,
      payBase: formData.payBase,
      tipExpected: formData.tipExpected || "0.00",
      payBonus: formData.payBonus || "0.00",
      location: formData.location,
      latitude: null,
      longitude: null,
      estimatedDuration: parseInt(formData.estimatedDuration) * 60, // convert hours to minutes
      travelDistance: null,
      travelTime: null,
      dueDate: new Date(formData.dueDate),
      status: "available"
    };

    createGigMutation.mutate(gigData);
  };

  const handleClear = () => {
    setFormData({
      title: "",
      sourceId: "",
      payBase: "",
      estimatedDuration: "",
      dueDate: "",
      location: "",
      description: "",
      tipExpected: "0.00",
      payBonus: "0.00"
    });
  };

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">Manual Gig Entry</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              placeholder="Mystery Shop - Target Electronics"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source">Source *</Label>
            <Select value={formData.sourceId} onValueChange={(value) => setFormData({...formData, sourceId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                {sources?.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payBase">Pay Amount ($) *</Label>
            <Input
              id="payBase"
              type="number"
              placeholder="45.00"
              step="0.01"
              value={formData.payBase}
              onChange={(e) => setFormData({...formData, payBase: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">Estimated Time (hours) *</Label>
            <Input
              id="estimatedDuration"
              type="number"
              placeholder="1.5"
              step="0.25"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="1234 Main St, City, State 12345"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Additional details about the gig..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-600"
            disabled={createGigMutation.isPending}
          >
            {createGigMutation.isPending ? "Adding..." : "Add Gig"}
          </Button>
          <Button type="button" variant="outline" onClick={handleClear}>
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
}
