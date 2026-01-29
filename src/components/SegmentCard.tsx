import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SegmentCardProps {
  Icon: LucideIcon;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const SegmentCard = ({ Icon, label, isSelected, onClick }: SegmentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-3 sm:p-4 rounded-lg border transition-all duration-200",
        "hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/30",
        isSelected
          ? "border-secondary bg-secondary/5 shadow-sm"
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div className={cn(
        "w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center mb-2 transition-colors",
      )}>
        <Icon 
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 stroke-[1.5]",
            isSelected ? "text-secondary" : "text-primary"
          )} 
        />
      </div>
      <span className={cn(
        "text-xs sm:text-sm font-medium text-center transition-colors leading-tight",
        isSelected ? "text-secondary" : "text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};

export default SegmentCard;
