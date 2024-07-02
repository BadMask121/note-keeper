import { useParams } from "next/navigation";

export function useAppParams() {
  const params = useParams();
  const selectedId = params?.id as string;

  return {
    selectedId,
  };
}
