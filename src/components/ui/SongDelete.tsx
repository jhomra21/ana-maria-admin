import { createSignal, createEffect } from "solid-js";
import { createMutation, useQueryClient } from "@tanstack/solid-query";
import { Button } from "./button";
import { cn } from "~/lib/utils";

// Function to delete a song from the API
const deleteSong = async (songId: number): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:8787/songs/${songId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete song");
  }
  
  return;
};

interface SongDeleteProps {
  songId: number;
  songTitle: string;
}

export function SongDelete(props: SongDeleteProps) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = createSignal(false);
  
  // Reset confirmation state after timeout
  createEffect(() => {
    let timeoutId: number | undefined;
    
    if (isConfirming()) {
      timeoutId = window.setTimeout(() => {
        setIsConfirming(false);
      }, 5000); // 5 seconds timeout
    }
    
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  });

  // Delete song mutation
  const deleteSongMutation = createMutation(() => ({
    mutationFn: () => deleteSong(props.songId),
    onSuccess: () => {
      // Invalidate and refetch songs query
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      setIsConfirming(false);
    },
    onError: (error: Error) => {
      console.error("Error deleting song:", error);
      alert(`Failed to delete song: ${error.message}`);
      setIsConfirming(false);
    }
  }));

  const handleDelete = () => {
    if (!isConfirming()) {
      setIsConfirming(true);
      return;
    }
    
    // User confirmed, proceed with deletion
    deleteSongMutation.mutate();
  };

  return (
    <Button
      type="button"
      variant={isConfirming() ? "outline" : "ghost"}
      size="sm"
      disabled={deleteSongMutation.isPending}
      onClick={handleDelete}
      class={cn(
        "min-w-[80px] transition-all duration-300 ease-in-out",
        isConfirming() ? "bg-red-600 text-white hover:bg-red-700 hover:text-white" : "text-red-600 hover:text-red-700"
      )}
    >
      <span class="flex items-center justify-center gap-2 whitespace-nowrap">
        {isConfirming() && !deleteSongMutation.isPending && (
          <span class="inline-block text-sm">✓</span>
        )}
        <span>
          {deleteSongMutation.isPending 
            ? "Deleting..." 
            : isConfirming() 
              ? "Confirm" 
              : "Delete"}
        </span>
      </span>
    </Button>
  );
} 