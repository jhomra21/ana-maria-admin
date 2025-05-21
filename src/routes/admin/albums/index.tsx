import { createSignal, For, Show } from "solid-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/solid-query";
import type { Album } from "../../../lib/types";
import { AlbumForm, type AlbumFormData } from "../../../components/AlbumForm";
import { Button } from "~/components/ui/button";

// Function to fetch albums from our API
const fetchAlbums = async (): Promise<Album[]> => {
  const response = await fetch("http://127.0.0.1:8787/albums");
  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }
  const data = await response.json();
  return data.albums;
};

// Function to delete an album
const deleteAlbum = async (id: number): Promise<void> => {
  const response = await fetch(`http://127.0.0.1:8787/albums/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete album");
  }
};

// Function to create an album
const createAlbum = async (data: AlbumFormData): Promise<Album> => {
  const response = await fetch("http://127.0.0.1:8787/albums", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error("Failed to create album");
  }
  
  const result = await response.json();
  return result.album;
};

// Function to update an album
const updateAlbum = async ({ id, data }: { id: number; data: AlbumFormData }): Promise<Album> => {
  const response = await fetch(`http://127.0.0.1:8787/albums/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update album");
  }
  
  const result = await response.json();
  return result.album;
};

export default function AlbumsPage() {
  const [selectedAlbum, setSelectedAlbum] = createSignal<Album | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = createSignal(false);
  const [isEditModalOpen, setIsEditModalOpen] = createSignal(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);
  
  const queryClient = useQueryClient();
  
  // Query to fetch albums
  const albumsQuery = useQuery(() => ({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
    // staleTime: 5 * 60 * 1000, // 5 minutes
    // refetchOnWindowFocus: false,
    // refetchOnMount: false,
    // refetchOnReconnect: false,
  }));
  
  // Mutation to delete an album
  const deleteMutation = useMutation(() => ({
    mutationFn: (id: number) => deleteAlbum(id),
    onSuccess: () => {
      // Invalidate and refetch albums after deletion
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setIsDeleteModalOpen(false);
      setSelectedAlbum(null);
    },
  }));
  
  // Mutation to create an album
  const createMutation = useMutation(() => ({
    mutationFn: (data: AlbumFormData) => createAlbum(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setIsCreateModalOpen(false);
    },
  }));
  
  // Mutation to update an album
  const updateMutation = useMutation(() => ({
    mutationFn: ({ id, data }: { id: number; data: AlbumFormData }) => updateAlbum({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["albums"] });
      setIsEditModalOpen(false);
      setSelectedAlbum(null);
    },
  }));
  
  const handleDeleteClick = (album: Album) => {
    setSelectedAlbum(album);
    setIsDeleteModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedAlbum()) {
      deleteMutation.mutate(selectedAlbum()!.id);
    }
  };
  
  const handleEditClick = (album: Album) => {
    setSelectedAlbum(album);
    setIsEditModalOpen(true);
  };
  
  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleCreateSubmit = (data: AlbumFormData) => {
    createMutation.mutate(data);
  };
  
  const handleEditSubmit = (data: AlbumFormData) => {
    if (selectedAlbum()) {
      updateMutation.mutate({ id: selectedAlbum()!.id, data });
    }
  };
  
  return (
    <div class="container mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Albums</h1>
        <Button
          onClick={handleCreateClick}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Album
        </Button>
      </div>
      
      <Show when={albumsQuery.isLoading}>
        <div class="flex justify-center items-center h-64">
          <p class="text-gray-500 dark:text-gray-400">Loading albums...</p>
        </div>
      </Show>
      
      <Show when={albumsQuery.isError}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span class="block sm:inline">
            Error loading albums: {albumsQuery.error?.message || "Unknown error"}
          </span>
        </div>
      </Show>
      
      <Show when={!albumsQuery.isLoading && !albumsQuery.isError}>
        <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cover
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Release Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Songs
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <Show
                when={albumsQuery.data && albumsQuery.data.length > 0}
                fallback={
                  <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No albums found
                    </td>
                  </tr>
                }
              >
                <For each={albumsQuery.data}>
                  {(album) => (
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="h-12 w-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={album.coverart_url || "/placeholder-album.jpg"}
                            alt={`${album.title} cover`}
                            class="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {album.title}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(album.release_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {album.songs.length}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(album)}
                          class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(album)}
                          class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </Show>
      
      {/* Delete Confirmation Modal */}
      <Show when={isDeleteModalOpen()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p class="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete the album "{selectedAlbum()?.title}"? This will also delete all songs associated with this album.
            </p>
            <div class="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Show>
      
      {/* Create Album Modal */}
      <Show when={isCreateModalOpen()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create New Album
            </h3>
            <AlbumForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsCreateModalOpen(false)}
              isSubmitting={createMutation.isPending}
            />
          </div>
        </div>
      </Show>
      
      {/* Edit Album Modal */}
      <Show when={isEditModalOpen() && selectedAlbum()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit Album: {selectedAlbum()?.title}
            </h3>
            <AlbumForm
              album={selectedAlbum()!}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditModalOpen(false)}
              isSubmitting={updateMutation.isPending}
            />
          </div>
        </div>
      </Show>
    </div>
  );
} 