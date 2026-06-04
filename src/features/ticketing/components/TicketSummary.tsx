import { useQuery } from "@tanstack/react-query";
import { troubleTicketApi } from "../services/ticketing.api";
import { 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Activity,
    ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ticketStatusLabels } from "../types/ticketing.types";

export const TicketSummary = () => {
    const { data: summary, isLoading } = useQuery({
        queryKey: ["tickets-summary"],
        queryFn: () => troubleTicketApi.getSummary(),
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-muted rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (!summary) return null;

    const totalTickets = summary.byStatus.reduce((acc, curr) => acc + curr.total, 0);

    return (
        <div className="space-y-8">
            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tickets</p>
                                <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{totalTickets}</h3>
                            </div>
                            <div className="p-3 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                                <ClipboardList className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {summary.byStatus.map((item) => {
                    const statusConfig: Record<string, { gradient: string; textColor: string; iconBg: string; shadow: string; icon: any }> = {
                        progress: {
                            gradient: "from-amber-500/10 to-amber-600/5",
                            textColor: "text-amber-600 dark:text-amber-400",
                            iconBg: "bg-amber-500",
                            shadow: "shadow-amber-500/20",
                            icon: Clock
                        },
                        pending: {
                            gradient: "from-rose-500/10 to-rose-600/5",
                            textColor: "text-rose-600 dark:text-rose-400",
                            iconBg: "bg-rose-500",
                            shadow: "shadow-rose-500/20",
                            icon: AlertCircle
                        },
                        closed: {
                            gradient: "from-emerald-500/10 to-emerald-600/5",
                            textColor: "text-emerald-600 dark:text-emerald-400",
                            iconBg: "bg-emerald-500",
                            shadow: "shadow-emerald-500/20",
                            icon: CheckCircle2
                        }
                    };

                    const config = statusConfig[item.status] || {
                        gradient: "from-slate-500/10 to-slate-600/5",
                        textColor: "text-slate-600",
                        iconBg: "bg-slate-500",
                        shadow: "shadow-slate-500/20",
                        icon: ClipboardList
                    };
                    
                    const Icon = config.icon;

                    return (
                        <Card key={item.status} className={`border-none shadow-lg bg-gradient-to-br ${config.gradient} hover:shadow-xl transition-all duration-300`}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className={`text-sm font-medium ${config.textColor}`}>{ticketStatusLabels[item.status]}</p>
                                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{item.total}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl shadow-lg ${config.iconBg} ${config.shadow}`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up [animation-delay:200ms]">
                {/* PIC Statistics */}
                <Card className="border-none shadow-lg overflow-hidden card-shadow">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Ringkasan per PIC</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {summary.byPic.map((pic, index) => (
                                <div key={pic.picId} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{pic.picName}</p>
                                            <p className="text-xs text-muted-foreground">Person In Charge</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-lg font-bold px-3 py-1 bg-primary/5 border-primary/20 text-primary">
                                            {pic.total}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Problem Statistics */}
                <Card className="border-none shadow-lg overflow-hidden card-shadow">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/50">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-rose-500" />
                            <CardTitle className="text-lg">Ringkasan per Problems</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {summary.byProblem.map((prob) => (
                                <div key={prob.problemId} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-rose-500/10">
                                            <AlertCircle className="h-4 w-4 text-rose-500" />
                                        </div>
                                        <span className="font-medium">{prob.problemName}</span>
                                    </div>
                                    <Badge variant="secondary" className="px-3 py-1 font-bold">
                                        {prob.total}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
