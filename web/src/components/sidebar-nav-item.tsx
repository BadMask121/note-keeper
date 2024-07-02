import { useAppParams } from "@/hooks/useAppParams";
import { ProtectedRoutes } from "@/lib/routes";
import { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toDate } from "date-fns";
import Link from "next/link";

export interface SidebarNavItemProps {
  item: Note;
}

export default function SidebarNavItem({ item, ...props }: SidebarNavItemProps) {
  const { selectedId } = useAppParams();
  const selected = selectedId === item.id;
  return (
    <Link
      href={
        `${ProtectedRoutes.Note}/${item.id}`
      }
      className={cn(
        "group mb-1 grid grid-cols-[24px_1fr_auto] gap-3 rounded-lg rounded-l-none bg-white p-3",
        { "bg-primary": selected },
        { "hover:bg-gray-50": !selected },
      )}
    >
      <div>
        <p className="text-sm">{item.id}</p>
      </div>
    </Link>
  );
}
