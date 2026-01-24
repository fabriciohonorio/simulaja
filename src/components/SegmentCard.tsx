import { cn } from "@/lib/utils";

interface SegmentCardProps {
  icon: React.ReactNode;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const SegmentCard = ({ icon, label, isSelected, onClick }: SegmentCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all duration-300",
        "hover:scale-105 hover:shadow-lg",
        isSelected
          ? "border-secondary bg-secondary/10 shadow-md"
          : "border-border bg-card hover:border-secondary/50"
      )}
    >
      <div className={cn(
        "w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center mb-1 transition-transform",
        isSelected && "scale-110"
      )}>
        {icon}
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
