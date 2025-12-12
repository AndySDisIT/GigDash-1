import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Upload, Mail, Share2, ArrowRight, Database, Download, FileText, ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Source } from "@shared/schema";
import { EmailConnection } from "./email-connection";

interface ImportOptionsProps {
  onImportSuccess: () => void;
}

export function ImportOptions({ onImportSuccess }: ImportOptionsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/gigs/import/csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload CSV');
      }

      const result = await response.json();
      toast({
        title: "Import successful",
        description: `Imported ${result.imported} gigs from CSV.`,
      });
      
      onImportSuccess();
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing your CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleLoadSampleData = async () => {
    setIsLoadingSample(true);
    
    try {
      const response = await fetch('/api/sample-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load sample data');
      }

      const result = await response.json();
      toast({
        title: "Sample data loaded",
        description: `Created ${result.created} sample gigs in Jacksonville area.`,
      });
      
      onImportSuccess();
    } catch (error) {
      toast({
        title: "Failed to load sample data",
        description: "There was an error loading sample data.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvTemplate = `title,description,payBase,tipExpected,payBonus,location,latitude,longitude,estimatedDuration,travelDistance,travelTime,dueDate,sourceId
"Store Audit","Complete product display audit at Target",45.00,0.00,5.00,"Jacksonville, FL",30.3322,-81.6557,90,5.2,15,2024-01-15T10:00:00,
"Delivery Task","Deliver packages in downtown area",32.50,10.00,0.00,"Jacksonville Beach, FL",30.2926,-81.3931,120,8.5,20,2024-01-15T14:00:00,`;
    
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gigconnect_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template downloaded",
      description: "Use this CSV template to import your gigs.",
    });
  };

  const { data: sources } = useQuery<Source[]>({
    queryKey: ["/api/sources"],
  });

  const platformGuides = {
    "GigSpot": "Export your jobs from the GigSpot app's history section. Copy job details to the CSV template.",
    "GigPro": "Check your email for GigPro notifications and manually add job details to the CSV.",
    "Qwick": "Access your Qwick dashboard and copy shift details into the import template.",
    "Emps": "Forward Emps job emails to yourself, then extract details for CSV import.",
    "Gracehill": "Use the Gracehill mobile app to view job details and manually enter into CSV.",
    "PrestoShip": "Export delivery assignments from your PrestoShip driver portal.",
    "iSpos": "Screenshot job postings from iSpos and manually transcribe to CSV format.",
    "Wonolo": "Download your shift history from Wonolo account settings.",
    "Instawork": "Check your Instawork email confirmations for shift details.",
  };

  return (
    <div className="space-y-6">
      {/* CSV Template Download */}
      <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Quick Start: Download CSV Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Download our CSV template to easily import gigs from GigSpot, GigPro, Qwick, Emps, Gracehill, PrestoShip, iSpos, and all other platforms.
          </p>
          <Button 
            onClick={handleDownloadTemplate}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            data-testid="button-download-template"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Import Template
          </Button>
        </CardContent>
      </Card>

      {/* Sample Data Card - For Demo */}
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50 hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
            <Database className="text-blue-600 w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Demo: Load Sample Jacksonville Gigs</h3>
          <p className="text-sm text-slate-600 mb-4">Load sample gigs in Jacksonville area to test map features, transit routes, and bike paths</p>
          <Button 
            onClick={handleLoadSampleData}
            className="bg-blue-500 hover:bg-blue-600 text-white"
            disabled={isLoadingSample}
            data-testid="button-load-sample"
          >
            {isLoadingSample ? "Loading..." : "Load Sample Data"} <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Email Integration Component */}
      <EmailConnection onImportSuccess={onImportSuccess} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
            <Upload className="text-blue-600 w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">CSV Import</h3>
          <p className="text-sm text-slate-600 mb-4">Upload a CSV file with your gig data from multiple sources</p>
          <div className="relative">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium w-full justify-start"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Choose File"} <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
            <Mail className="text-green-600 w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Email Integration</h3>
          <p className="text-sm text-slate-600 mb-4">Connect Gmail to automatically import gig emails</p>
          <Button variant="ghost" className="text-green-600 hover:text-green-700 text-sm font-medium">
            Connect Gmail <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
            <Share2 className="text-purple-600 w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Share Sheet</h3>
          <p className="text-sm text-slate-600 mb-4">Share job postings directly from other gig apps</p>
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            Learn More <ArrowRight className="ml-1 w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
      </div>

      {/* Platform-Specific Import Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Platform Import Guides</CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Learn how to export and import gigs from {sources?.length || 26} supported platforms
          </p>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sources?.filter(s => s.type === 'app').map((source) => (
              <AccordionItem key={source.id} value={source.name}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                      {source.name.substring(0, 2).toUpperCase()}
                    </div>
                    {source.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600 pl-11">
                  <div className="space-y-2">
                    <p>{platformGuides[source.name as keyof typeof platformGuides] || "Most gig platforms don't offer direct data export. Check your email notifications for job details, or manually copy information from the app into the CSV template."}</p>
                    <div className="bg-slate-50 p-3 rounded-lg mt-2">
                      <p className="font-medium text-slate-700 mb-1">Quick Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Download the CSV template above</li>
                        <li>Open it in Excel or Google Sheets</li>
                        <li>Copy job details from {source.name} (app or email)</li>
                        <li>Fill in the template with job information</li>
                        <li>Save and upload the CSV using the import button</li>
                      </ol>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Most gig platforms don't provide official data export features. We recommend checking your email for job notifications or taking screenshots to help transfer information to the CSV template.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
