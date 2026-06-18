import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend: string;
  trendUp: boolean;
  color: string;
  bg: string;
  onClick?: () => void;
}

export function DashboardCards({ 
  cards, 
  periodLabel 
}: { 
  cards: DashboardCardProps[]; 
  periodLabel: string 
}) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10 px-4 md:px-0">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          onClick={card.onClick}
          className={cn(
            "group transition-all duration-300 hover:shadow-md hover:-translate-y-1",
            card.onClick && "cursor-pointer"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", card.bg)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground tracking-tight group-hover:scale-[1.02] transition-transform origin-left">
              {card.value}
            </div>
            <div className="flex items-center mt-3 text-xs font-bold">
              <div className={cn(
                "flex items-center px-2 py-0.5 rounded-full mr-2",
                card.trendUp ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                {card.trendUp ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {card.trend}
              </div>
              {card.trend.includes("%") && (
                <span className="text-muted-foreground">{periodLabel}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
