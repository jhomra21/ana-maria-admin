import { createSignal, For, Show } from "solid-js";
import { useQuery, useQueryClient } from "@tanstack/solid-query";
import type { Song } from "../../../lib/types";
import { Button } from "~/components/ui/button";
import { SongDelete } from "~/components/ui/SongDelete";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { fetchSongs, fetchAlbums } from "../../../lib/apiService";
import { AddSongDialog } from "../../../components/admin/songs/AddSongDialog";
import { EditSongDialog } from "../../../components/admin/songs/EditSongDialog";

export default function SongsPage() {
  const queryClient = useQueryClient();
  const [isAddSongDialogOpen, setIsAddSongDialogOpen] = createSignal(false);
  
  // State for EditSongDialog
  const [isEditDialogOpen, setIsEditDialogOpen] = createSignal(false);
  const [songToEdit, setSongToEdit] = createSignal<Song | null>(null);

  const songsQuery = useQuery(() => ({
    queryKey: ["songs"],
    queryFn: fetchSongs,
  }));

  const albumsQuery = useQuery(() => ({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  }));
  
  const handleOpenEditDialog = (song: Song) => {
    setSongToEdit(song);
    setIsEditDialogOpen(true);
  };

  const handleSongAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
  };

  const handleSongUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["songs"] });
    setSongToEdit(null);
  };

  return (
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Songs</h1>
        <Button onClick={() => setIsAddSongDialogOpen(true)} class=" bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          Add Song
        </Button>
        <AddSongDialog
          open={isAddSongDialogOpen}
          onOpenChange={setIsAddSongDialogOpen}
          albums={() => albumsQuery.data}
          albumsLoading={() => albumsQuery.isLoading}
          albumsError={() => albumsQuery.error}
          onSongAdded={handleSongAdded}
        />
      </div>
      
      <EditSongDialog 
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        songToEdit={songToEdit} 
        albums={() => albumsQuery.data}
        albumsLoading={() => albumsQuery.isLoading}
        albumsError={() => albumsQuery.error}
        onSongUpdated={handleSongUpdated}
      />
      
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
        <div class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <Table>
            <TableCaption>Songs</TableCaption>
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
                        <div class="font-medium">{song.title}</div>
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
                        <div class="flex justify-end items-center gap-2 pr-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            onClick={() => handleOpenEditDialog(song)}
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
    </div>
  );
} 