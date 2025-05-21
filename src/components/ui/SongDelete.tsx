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
  
  const handleCancel = () => {
    setIsConfirming(false);
  };

  return (
    <div 
      class={cn(
        "relative overflow-hidden min-w-[80px] h-9 rounded-md",
        "transition-all duration-300 ease-out",
        "w-[50%]"
      )}
    >
      {/* Normal Delete Button - Always visible but changes opacity */}
      <div 
        class={cn(
          "absolute inset-0 transition-all duration-300 ease-out",
          isConfirming() ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={deleteSongMutation.isPending || isConfirming()}
          onClick={handleDelete}
          class="w-full h-full text-red-600 hover:text-red-700 transition-colors duration-200"
        >
          <span class="flex items-center justify-center whitespace-nowrap">
            {deleteSongMutation.isPending ? "Deleting..." : "Delete"}
          </span>
        </Button>
      </div>

      {/* Confirmation State - Split button layout */}
      <div 
        class={cn(
          "absolute inset-0 flex transition-all duration-300 ease-out",
          isConfirming() 
            ? "opacity-100 transform translate-y-0 scale-100" 
            : "opacity-0 transform translate-y-1 scale-95"
        )}
      >
        {/* Delete confirm button - 70% width */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={deleteSongMutation.isPending}
          onClick={handleDelete}
          class={cn(
            "w-[70%] rounded-r-none border-r-0",
            "bg-red-600 text-white hover:bg-red-700 hover:text-white",
            "transition-colors duration-200 ease-out shadow-sm"
          )}
        >
          <span class="flex items-center justify-center whitespace-nowrap">
            {deleteSongMutation.isPending ? "Deleting..." : "Delete"}
          </span>
        </Button>
        
        {/* Cancel button - 30% width */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={deleteSongMutation.isPending}
          onClick={handleCancel}
          class={cn(
            "w-[30%] rounded-l-none border-l-0",
            "bg-gray-100 hover:bg-gray-200 text-gray-700",
            "transition-colors duration-200 ease-out shadow-sm"
          )}
        >
          <span class="flex items-center justify-center">
            ✕
          </span>
        </Button>
      </div>
    </div>
  );
} 