import { createSignal, Show } from "solid-js";
import type { Album } from "../lib/types";

interface AlbumFormProps {
  album?: Album;
  onSubmit: (formData: AlbumFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface AlbumFormData {
  title: string;
  release_date: string;
  coverart_url: string | null;
}

export function AlbumForm(props: AlbumFormProps) {
  const [title, setTitle] = createSignal(props.album?.title || "");
  const [releaseDate, setReleaseDate] = createSignal(
    props.album?.release_date 
      ? new Date(props.album.release_date).toISOString().split("T")[0] 
      : ""
  );
  const [coverartUrl, setCoverartUrl] = createSignal(props.album?.coverart_url || "");
  const [errors, setErrors] = createSignal<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title().trim()) {
      newErrors.title = "Title is required";
    }

    if (!releaseDate()) {
      newErrors.releaseDate = "Release date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    props.onSubmit({
      title: title(),
      release_date: releaseDate(),
      coverart_url: coverartUrl().trim() || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title()}
          onInput={(e) => setTitle(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
        />
        <Show when={errors().title}>
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors().title}</p>
        </Show>
      </div>
      
      <div>
        <label for="releaseDate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Release Date
        </label>
        <input
          type="date"
          id="releaseDate"
          value={releaseDate()}
          onInput={(e) => setReleaseDate(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
        />
        <Show when={errors().releaseDate}>
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">{errors().releaseDate}</p>
        </Show>
      </div>
      
      <div>
        <label for="coverartUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cover Art URL
        </label>
        <input
          type="text"
          id="coverartUrl"
          value={coverartUrl()}
          onInput={(e) => setCoverartUrl(e.currentTarget.value)}
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="https://example.com/album-cover.jpg"
        />
      </div>
      
      <Show when={coverartUrl()}>
        <div class="mt-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Preview</p>
          <div class="h-40 w-40 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={coverartUrl()}
              alt="Album cover preview"
              class="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-album.jpg";
              }}
            />
          </div>
        </div>
      </Show>
      
      <div class="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={props.onCancel}
          class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={props.isSubmitting}
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {props.isSubmitting ? "Saving..." : props.album ? "Update Album" : "Create Album"}
        </button>
      </div>
    </form>
  );
} 