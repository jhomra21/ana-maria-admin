import { createSignal, For, Show, createEffect } from "solid-js";
import { useQuery, createMutation, useQueryClient } from "@tanstack/solid-query";
import type { Song, Album } from "../../../lib/types";
import { Button } from "~/components/ui/button";
import { SongDelete } from "~/components/ui/SongDelete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { 
  TextField, 
  TextFieldInput, 
  TextFieldLabel 
} from "~/components/ui/text-field";
import { 
  Select as UiSelect,
  SelectContent as UiSelectContent,
  SelectItem as UiSelectItem,
  SelectTrigger as UiSelectTrigger,
  SelectValue as UiSelectValue
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";

// Function to fetch songs from our API
const fetchSongs = async (): Promise<Song[]> => {
  const response = await fetch("http://127.0.0.1:8787/songs");
  if (!response.ok) {
    throw new Error("Failed to fetch songs");
  }
  const data = await response.json();
  return data.songs;
};

// Function to fetch albums from our API
const fetchAlbums = async (): Promise<Album[]> => {
  const response = await fetch("http://127.0.0.1:8787/albums"); // Assuming this endpoint
  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }
  const data = await response.json();
  return data.albums; // Assuming API returns { albums: Album[] }
};

// Function to create a new song
const createSong = async (songData: {
  title: string;
  duration_seconds: number;
  track_number: number;
  is_single: boolean;
  album_id?: number;
}): Promise<Song> => {
  const response = await fetch("http://127.0.0.1:8787/songs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(songData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create song");
  }

  const data = await response.json();
  return data.song;
};

export default function SongsPage() {
  const queryClient = useQueryClient();
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = createSignal(false);
  const [isSingle, setIsSingle] = createSignal(false);
  const [title, setTitle] = createSignal("");
  const [duration, setDuration] = createSignal<number | undefined>(undefined);
  const [trackNumber, setTrackNumber] = createSignal<number | undefined>(undefined);
  const [selectedAlbum, setSelectedAlbum] = createSignal<Album | undefined>(undefined); // Store selected album object
  const [isAlbumSelectOpen, setIsAlbumSelectOpen] = createSignal(false); // For controlling Select open state
  const [isConfirming, setIsConfirming] = createSignal(false); // Track confirmation state

  // Create an effect to auto-reset the confirmation state after a timeout
  createEffect(() => {
    let timeoutId: number | undefined;
    
    if (isConfirming()) {
      // If in confirming state, set a timeout to reset after 5 seconds
      timeoutId = window.setTimeout(() => {
        setIsConfirming(false);
      }, 5000); // 5 seconds
    }
    
    // Clean up the timeout when the effect reruns or component unmounts
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  });

  // Reset confirmation state when any form value changes
  const resetConfirmationState = () => {
    if (isConfirming()) {
      setIsConfirming(false);
    }
  };

  // Custom setters that also reset confirmation
  const setTitleWithReset = (value: string) => {
    setTitle(value);
    resetConfirmationState();
  };

  const setDurationWithReset = (value: number | undefined) => {
    setDuration(value);
    resetConfirmationState();
  };

  const setTrackNumberWithReset = (value: number | undefined) => {
    setTrackNumber(value);
    resetConfirmationState();
  };

  const setIsSingleWithReset = (value: boolean) => {
    setIsSingle(value);
    resetConfirmationState();
  };

  // Fixed type to handle Album | null for UiSelect compatibility
  const setSelectedAlbumWithReset = (value: Album | null) => {
    setSelectedAlbum(value || undefined); // Convert null to undefined if needed
    resetConfirmationState();
  };

  // Query to fetch songs
  const songsQuery = useQuery(() => ({
    queryKey: ["songs"],
    queryFn: fetchSongs,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchOnWindowFocus: false,
    // refetchOnMount: false,
    // refetchOnReconnect: false,
  }));

  const albumsQuery = useQuery(() => ({ // Query for albums
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  }));
  
  // Create song mutation
  const createSongMutation = createMutation(() => ({
    mutationFn: createSong,
    onSuccess: () => {
      // Invalidate and refetch songs query
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      
      // Reset form
      setTitle("");
      setDuration(undefined);
      setTrackNumber(undefined);
      setIsSingle(false);
      setSelectedAlbum(undefined);
      setIsConfirming(false); // Reset confirmation state
      
      // Close dialog
      setIsAddSongDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Error creating song:", error);
      alert(`Failed to create song: ${error.message}`);
      setIsConfirming(false); // Reset confirmation state on error too
    }
  }));

  // Form submission handler
  const handleAddSongSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    
    // If we're not confirming yet, switch to confirming mode
    if (!isConfirming()) {
      setIsConfirming(true);
      return; // Don't submit form yet
    }
    
    // If we reach here, the user has confirmed, proceed with form submission
    
    // Validate required fields
    if (!title()) {
      alert("Title is required");
      setIsConfirming(false);
      return;
    }
    
    if (duration() === undefined || isNaN(duration()!)) {
      alert("Duration is required and must be a number");
      setIsConfirming(false);
      return;
    }
    
    if (trackNumber() === undefined || isNaN(trackNumber()!)) {
      alert("Track number is required and must be a number");
      setIsConfirming(false);
      return;
    }
    
    // Create the song data object
    const songData = {
      title: title(),
      duration_seconds: duration()!,
      track_number: trackNumber()!,
      is_single: isSingle(),
      album_id: selectedAlbum()?.id
    };
    
    // Call the mutation
    createSongMutation.mutate(songData);
    // Reset confirmation state
    setIsConfirming(false);
  };

  // Helper to find an album by ID from the query data, for setting the Select's value prop
  console.log("Albums Data for Select:", albumsQuery.data);
  console.log("Selected Album for Select:", selectedAlbum());

  return (
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Songs</h1>
        <Dialog open={isAddSongDialogOpen()} onOpenChange={setIsAddSongDialogOpen}>
          <DialogTrigger as={Button} class=" bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Add Song
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <form onSubmit={handleAddSongSubmit}>
              <DialogHeader>
                <DialogTitle>Add New Song</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new song. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div class="grid gap-4 py-4">
                <TextField class="grid grid-cols-4 items-center gap-4">
                  <TextFieldLabel for="title" class="text-right">
                    Title
                  </TextFieldLabel>
                  <TextFieldInput id="title" value={title()} onInput={(e) => setTitleWithReset(e.currentTarget.value)} class="col-span-3" />
                </TextField>
                <TextField class="grid grid-cols-4 items-center gap-4">
                  <TextFieldLabel for="duration" class="text-right">
                    Duration (sec)
                  </TextFieldLabel>
                  <TextFieldInput 
                    id="duration" 
                    type="number" 
                    value={duration() ?? ""} 
                    onInput={(e) => setDurationWithReset(e.currentTarget.valueAsNumber || undefined)} 
                    class="col-span-3" 
                  />
                </TextField>
                <TextField class="grid grid-cols-4 items-center gap-4">
                  <TextFieldLabel for="track_number" class="text-right">
                    Track #
                  </TextFieldLabel>
                  <TextFieldInput 
                    id="track_number" 
                    type="number" 
                    value={trackNumber() ?? 1} 
                    onInput={(e) => setTrackNumberWithReset(e.currentTarget.valueAsNumber || undefined)} 
                    class="col-span-3" 
                  />
                </TextField>
                <div class="grid grid-cols-4 items-center gap-4">
                  <label for="is_single_checkbox" class="text-sm font-medium text-right">
                    Single?
                  </label>
                  <Checkbox 
                    id="is_single_checkbox"
                    checked={isSingle()} 
                    onChange={setIsSingleWithReset} 
                    class="col-span-3 justify-self-start"
                  />
                </div>
                {/* Album Field with Loading/Error/Success states */}
                <div class="grid grid-cols-4 items-center gap-4">
                  <label class="text-right text-sm font-medium">Album</label>
                  <div class="col-span-3"> {/* Container for states */}
                    <Show when={albumsQuery.isLoading}>
                      <p class="text-sm text-muted-foreground">Loading albums...</p>
                    </Show>
                    <Show when={albumsQuery.isError}>
                      <p class="text-sm text-destructive">
                        Error loading albums: {albumsQuery.error?.message || "Unknown error"}
                      </p>
                      {/* TODO: Consider adding a refetch button for albumsQuery.refetch() */}
                    </Show>
                    <Show when={albumsQuery.isSuccess && albumsQuery.data && albumsQuery.data.length > 0}>
                      <UiSelect<Album> 
                        options={albumsQuery.data || []} 
                        value={selectedAlbum()} 
                        onChange={setSelectedAlbumWithReset} 
                        optionValue="id" 
                        optionTextValue="title" 
                        open={isAlbumSelectOpen()}
                        onOpenChange={setIsAlbumSelectOpen}
                        itemComponent={(props) => (
                          <UiSelectItem item={props.item}>
                            {props.item.rawValue.title} 
                          </UiSelectItem>
                        )}
                        placeholder="Select an album"
                        class="w-full" // Ensure select takes full width
                      >
                        <UiSelectTrigger>
                          <UiSelectValue<Album>>
                            {(state) => state.selectedOption()?.title || "Select an album"}
                          </UiSelectValue>
                        </UiSelectTrigger>
                        <UiSelectContent portal={false} />
                      </UiSelect>
                    </Show>
                    <Show when={albumsQuery.isSuccess && (!albumsQuery.data || albumsQuery.data.length === 0)}>
                      <p class="text-sm text-muted-foreground">No albums found. Create one first.</p>
                    </Show>
                  </div>
                </div>
              </div>
              <DialogFooter class="relative">
                <Button 
                  type="submit" 
                  disabled={createSongMutation.isPending}
                  class={`
                    relative transition-all duration-300 ease-in-out 
                    min-w-[160px] px-4 py-2 font-medium
                    ${isConfirming() 
                      ? "bg-green-600 hover:bg-green-700 scale-105 shadow-lg" 
                      : "transform hover:scale-[101%]"}
                  `}
                >
                  {/* Text content with animation */}
                  <span 
                    class="flex items-center justify-center gap-2 transition-all duration-300 ease-in-out"
                    classList={{
                      "text-white": isConfirming()
                    }}
                  >
                    {isConfirming() && !createSongMutation.isPending && (
                      <span class="inline-block text-white text-lg">✓</span>
                    )}
                    <span>
                      {createSongMutation.isPending 
                        ? "Saving..." 
                        : isConfirming() 
                          ? "Confirm Add Song" 
                          : "Save Song"}
                    </span>
                  </span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Show when={songsQuery.isLoading}>
        <div class="flex justify-center items-center h-64">
          <p class="text-gray-500 dark:text-gray-400">Loading songs...</p>
        </div>
      </Show>
      
      <Show when={songsQuery.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span class="block sm:inline">
            Error loading songs: {songsQuery.error?.message || "Unknown error"}
          </span>
        </div>
      </Show>
      
      <Show when={!songsQuery.isLoading && !songsQuery.isError}>
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-1/4">Title</TableHead>
                <TableHead class="w-1/6">Album</TableHead>
                <TableHead class="w-1/12">Track #</TableHead>
                <TableHead class="w-1/12">Duration</TableHead>
                <TableHead class="w-1/12">Single</TableHead>
                <TableHead class="w-1/6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Show
                when={songsQuery.data && songsQuery.data.length > 0}
                fallback={
                  <TableRow>
                    <TableCell colSpan={6} class="h-24 text-center text-gray-500 dark:text-gray-400">
                      No songs found
                    </TableCell>
                  </TableRow>
                }
              >
                <For each={songsQuery.data}>
                  {(song) => (
                    <TableRow>
                      <TableCell>
                        <div class="font-medium">
                          {song.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-muted-foreground">
                          {(song as any).album_title || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-muted-foreground">
                          {song.track_number}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-muted-foreground">
                          {Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, '0')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div class="text-muted-foreground">
                          {song.is_single ? "Yes" : "No"}
                        </div>
                      </TableCell>
                      <TableCell class="text-right">
                        <div class="flex justify-end items-center space-x-2 transition-safe duration-300 ease-in-out">
                          <Button
                            variant="ghost"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            Edit
                          </Button>
                          <SongDelete songId={song.id} songTitle={song.title} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </Show>
            </TableBody>
          </Table>
        </div>
      </Show>
      
      {/* We'll implement the song form modals in the next step */}
    </div>
  );
} 