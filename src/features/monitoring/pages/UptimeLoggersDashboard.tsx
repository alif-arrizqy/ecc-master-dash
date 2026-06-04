import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Server } from "lucide-react";
import { SiteUptimeTab } from "../components/SiteUptimeTab";
import { PullingLogsTab } from "../components/PullingLogsTab";

export default function UptimeLoggersDashboard() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Uptime & Loggers
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time pulling logs and historical site uptime status.
          </p>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="uptime" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="h-auto bg-muted border border-border p-1.5 rounded-xl shadow-sm">
            <TabsTrigger 
              value="uptime"
              className="rounded-lg px-6 py-2.5 text-foreground/70 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="font-semibold">Site Uptime</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="pulling"
              className="rounded-lg px-6 py-2.5 text-foreground/70 data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border transition-all duration-200"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span className="font-semibold">Pulling Logs Status</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Uptime Monitoring Tab */}
        <TabsContent 
          value="uptime" 
          className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in zoom-in-95 duration-300"
        >
          <SiteUptimeTab />
        </TabsContent>

        {/* Pulling Logs Tab */}
        <TabsContent 
          value="pulling" 
          className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in zoom-in-95 duration-300"
        >
          <PullingLogsTab />
        </TabsContent>
      </Tabs>
      
    </div>
  );
}
