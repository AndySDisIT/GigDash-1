import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface EmailConnectionProps {
  onImportSuccess: () => void;
}

const PLATFORM_OPTIONS = [
  { id: 'gigspot', label: 'GigSpot', emails: ['jobs@gigspot.com', 'confirmations@gigspot.com'] },
  { id: 'qwick', label: 'Qwick', emails: ['notifications@qwick.com', 'support@qwick.com'] },
  { id: 'wonolo', label: 'Wonolo', emails: ['jobs@wonolo.com', 'confirmations@wonolo.com'] },
  { id: 'instawork', label: 'Instawork', emails: ['help@instawork.com'] },
  { id: 'fieldagent', label: 'Field Agent', emails: ['support@fieldagent.net'] },
  { id: 'ivueit', label: 'iVueit', emails: ['notifications@ivueit.com'] },
  { id: 'generic', label: 'All Platforms (Generic)', emails: ['Any sender with gig/shift/job keywords'] },
];

export function EmailConnection({ onImportSuccess }: EmailConnectionProps) {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const [credentials, setCredentials] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['generic']);
  const [syncDays, setSyncDays] = useState('7');

  const handleTestConnection = async () => {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.refreshToken) {
      toast({
        title: "Missing credentials",
        description: "Please fill in all Gmail API credentials.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/import/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success) {
        setIsConnected(true);
        toast({
          title: "Connection successful!",
          description: `Connected to Gmail. Found ${result.emailCount} recent emails.`,
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.error || "Unable to connect to Gmail.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncEmails = async () => {
    if (!isConnected) {
      toast({
        title: "Not connected",
        description: "Please test your connection first.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const afterDate = new Date();
      afterDate.setDate(afterDate.getDate() - parseInt(syncDays));

      const response = await fetch('/api/import/email/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          platforms: selectedPlatforms,
          afterDate: afterDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Email sync successful!",
          description: `Imported ${result.imported} gigs from ${result.total} emails.`,
        });
        onImportSuccess();
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Unable to sync emails.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  return (
    <Card data-testid="card-email-integration">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <CardTitle>Email Integration</CardTitle>
          {isConnected && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Automatically import gig opportunities from your email inbox
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="setup">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup" data-testid="tab-setup">Setup</TabsTrigger>
            <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Gmail API Credentials Required</strong>
                <br />
                You'll need to create OAuth credentials from Google Cloud Console.
                <a 
                  href="https://console.cloud.google.com/apis/credentials" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Get credentials →
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  type={showCredentials ? "text" : "password"}
                  placeholder="Your Gmail API Client ID"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials({ ...credentials, clientId: e.target.value })}
                  data-testid="input-client-id"
                />
              </div>

              <div>
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type={showCredentials ? "text" : "password"}
                  placeholder="Your Gmail API Client Secret"
                  value={credentials.clientSecret}
                  onChange={(e) => setCredentials({ ...credentials, clientSecret: e.target.value })}
                  data-testid="input-client-secret"
                />
              </div>

              <div>
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Input
                  id="refreshToken"
                  type={showCredentials ? "text" : "password"}
                  placeholder="Your Gmail API Refresh Token"
                  value={credentials.refreshToken}
                  onChange={(e) => setCredentials({ ...credentials, refreshToken: e.target.value })}
                  data-testid="input-refresh-token"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCredentials"
                  checked={showCredentials}
                  onCheckedChange={(checked) => setShowCredentials(checked as boolean)}
                />
                <Label htmlFor="showCredentials" className="text-sm cursor-pointer">
                  Show credentials
                </Label>
              </div>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={isTesting || !credentials.clientId || !credentials.clientSecret || !credentials.refreshToken}
              className="w-full"
              data-testid="button-test-connection"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            <div className="space-y-3">
              <Label>Select platforms to monitor</Label>
              <div className="space-y-2">
                {PLATFORM_OPTIONS.map((platform) => (
                  <div key={platform.id} className="flex items-start space-x-2 border rounded p-3">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                      data-testid={`checkbox-platform-${platform.id}`}
                    />
                    <div className="flex-1">
                      <Label htmlFor={platform.id} className="cursor-pointer font-medium">
                        {platform.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {platform.emails.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="syncDays">Import emails from the last</Label>
              <select
                id="syncDays"
                value={syncDays}
                onChange={(e) => setSyncDays(e.target.value)}
                className="w-full mt-1 p-2 border rounded"
                data-testid="select-sync-days"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSyncEmails}
          disabled={isSyncing || !isConnected}
          className="w-full"
          size="lg"
          data-testid="button-sync-emails"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing Emails...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Sync Emails & Import Gigs
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
