import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { equalIds } from "@/lib/utils";

export function useIdTags(source: string[]) {
  const [ids, setIds] = useState<string[]>(source);

  useEffect(() => {
    if (!equalIds(ids, source)) setIds(source);
  }, [source, ids]);

  //           ↓↓↓ expose the real React setter
  return [ids, setIds] as [string[], Dispatch<SetStateAction<string[]>>];
}