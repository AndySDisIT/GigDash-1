import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Smartphone, 
  Mail, 
  Download, 
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  ExternalLink,
  Wifi,
  WifiOff,
  Bell
} from "lucide-react";

interface AppIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  gigCount: number;
  avgPay: number;
  methods: string[];
  icon: React.ReactNode;
  color: string;
}

export function AppIntegrations() {
  const [integrations, setIntegrations] = useState<AppIntegration[]>([
    {
      id: 'gigspot',
      name: 'GigSpot',
      description: 'Mystery shopping and retail audits',
      status: 'connected',
      lastSync: '2 minutes ago',
      gigCount: 12,
      avgPay: 28.50,
      methods: ['Share Sheet', 'Email Parsing', 'Notification Listener'],
      icon: <Smartphone className="w-6 h-6" />,
      color: 'blue'
    },
    {
      id: 'ivueit',
      name: 'iVueit',
      description: 'Product verification and display checks',
      status: 'connected',
      lastSync: '5 minutes ago',
      gigCount: 8,
      avgPay: 22.75,
      methods: ['Share Sheet', 'Manual Import'],
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green'
    },
    {
      id: 'observa',
      name: 'Observa',
      description: 'Store audits and compliance checks',
      status: 'syncing',
      lastSync: 'Syncing now...',
      gigCount: 15,
      avgPay: 35.20,
      methods: ['Email Parsing', 'Share Sheet'],
      icon: <RefreshCw className="w-6 h-6 animate-spin" />,
      color: 'purple'
    },
    {
      id: 'field-agent',
      name: 'Field Agent',
      description: 'Price checks and product research',
      status: 'connected',
      lastSync: '1 hour ago',
      gigCount: 6,
      avgPay: 18.30,
      methods: ['Share Sheet', 'Notification Listener'],
      icon: <Smartphone className="w-6 h-6" />,
      color: 'orange'
    },
    {
      id: 'mobee',
      name: 'Mobee',
      description: 'Mystery shopping missions',
      status: 'error',
      lastSync: '3 hours ago',
      gigCount: 0,
      avgPay: 0,
      methods: ['Email Parsing'],
      icon: <AlertCircle className="w-6 h-6" />,
      color: 'red'
    },
    {
      id: 'easyshift',
      name: 'EasyShift',
      description: 'Quick retail tasks and surveys',
      status: 'disconnected',
      lastSync: 'Never',
      gigCount: 0,
      avgPay: 0,
      methods: ['Share Sheet', 'Manual Import'],
      icon: <WifiOff className="w-6 h-6" />,
      color: 'gray'
    }
  ]);

  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSync = (appId: string) => {
    setIntegrations(prev => prev.map(app => 
      app.id === appId 
        ? { ...app, status: 'syncing', lastSync: 'Syncing now...' }
        : app
    ));

    // Simulate sync completion
    setTimeout(() => {
      setIntegrations(prev => prev.map(app => 
        app.id === appId 
          ? { ...app, status: 'connected', lastSync: 'Just now' }
          : app
      ));
    }, 3000);
  };

  const handleConnect = (appId: string) => {
    setIntegrations(prev => prev.map(app => 
      app.id === appId 
        ? { ...app, status: 'connected', lastSync: 'Just now' }
        : app
    ));
  };

  const totalGigs = integrations.reduce((sum, app) => sum + app.gigCount, 0);
  const connectedApps = integrations.filter(app => app.status === 'connected').length;
  const avgPayAcrossApps = integrations.reduce((sum, app) => sum + app.avgPay, 0) / integrations.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-gray-600" />;
      default: return <WifiOff className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{connectedApps}/6</div>
                <div className="text-sm text-slate-600">Connected Apps</div>
              </div>
              <Wifi className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{totalGigs}</div>
                <div className="text-sm text-slate-600">Available Gigs</div>
              </div>
              <Smartphone className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">${avgPayAcrossApps.toFixed(2)}</div>
                <div className="text-sm text-slate-600">Avg Pay/Gig</div>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">4</div>
                <div className="text-sm text-slate-600">Sync Methods</div>
              </div>
              <RefreshCw className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Integration Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-sync</div>
              <div className="text-sm text-slate-600">Automatically check for new gigs every 5 minutes</div>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push notifications</div>
              <div className="text-sm text-slate-600">Get notified when new high-priority gigs are found</div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Integration Methods:</strong> Share Sheet lets you quickly add gigs by sharing from other apps. 
              Email Parsing monitors your Gmail for gig notifications. Notification Listener captures app notifications automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* App Integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((app) => (
          <Card key={app.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg bg-${app.color}-100 mr-3`}>
                    {app.icon}
                  </div>
                  <div>
                    <div>{app.name}</div>
                    <div className="text-sm text-slate-600 font-normal">{app.description}</div>
                  </div>
                </div>
                <Badge className={getStatusColor(app.status)}>
                  {getStatusIcon(app.status)}
                  <span className="ml-1 capitalize">{app.status}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-800">{app.gigCount}</div>
                  <div className="text-xs text-slate-600">Available Gigs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">${app.avgPay.toFixed(2)}</div>
                  <div className="text-xs text-slate-600">Avg Pay</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800">{app.methods.length}</div>
                  <div className="text-xs text-slate-600">Methods</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Integration Methods:</div>
                <div className="flex flex-wrap gap-1">
                  {app.methods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Last sync: {app.lastSync}
                </div>
              </div>

              <div className="flex gap-2">
                {app.status === 'connected' || app.status === 'syncing' ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleSync(app.id)}
                      disabled={app.status === 'syncing'}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${app.status === 'syncing' ? 'animate-spin' : ''}`} />
                      Sync Now
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open App
                    </Button>
                  </>
                ) : app.status === 'error' ? (
                  <>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleConnect(app.id)}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reconnect
                    </Button>
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleConnect(app.id)}
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Get App
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>How App Integrations Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h4 className="font-medium mb-2">Share Sheet</h4>
              <p className="text-sm text-slate-600">
                Share gig details directly from any app to automatically import them into your dashboard
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Mail className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h4 className="font-medium mb-2">Email Parsing</h4>
              <p className="text-sm text-slate-600">
                Connect Gmail to automatically detect and import gig notifications from your email
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Bell className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h4 className="font-medium mb-2">Notification Listener</h4>
              <p className="text-sm text-slate-600">
                Android service that captures app notifications and extracts gig information automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}