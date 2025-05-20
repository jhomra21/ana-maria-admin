import { createSignal, createResource, Show, For, createEffect } from 'solid-js';
import { createClient } from '@libsql/client';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Label } from '~/components/ui/label';

export default function DBTest() {
  const [dbUrl, setDbUrl] = createSignal('');
  const [dbAuthToken, setDbAuthToken] = createSignal('');
  const [isConnected, setIsConnected] = createSignal(false);
  const [client, setClient] = createSignal<ReturnType<typeof createClient> | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [activeTab, setActiveTab] = createSignal('albums');
  const [selectedQuery, setSelectedQuery] = createSignal('list');
  
  // Album form fields
  const [albumTitle, setAlbumTitle] = createSignal('');
  const [albumReleaseDate, setAlbumReleaseDate] = createSignal('');
  const [albumCoverUrl, setAlbumCoverUrl] = createSignal('');
  
  // Song form fields
  const [songTitle, setSongTitle] = createSignal('');
  const [songDuration, setSongDuration] = createSignal('');
  const [songTrackNumber, setSongTrackNumber] = createSignal('1');
  const [songIsSingle, setSongIsSingle] = createSignal(true);
  const [songAlbumId, setSongAlbumId] = createSignal('');
  
  // Selected album for viewing songs
  const [selectedAlbumId, setSelectedAlbumId] = createSignal<number | null>(null);

  const connectToDb = () => {
    try {
      if (!dbUrl() || !dbAuthToken()) {
        setError('Database URL and Auth Token are required');
        return;
      }

      const newClient = createClient({
        url: dbUrl(),
        authToken: dbAuthToken(),
      });
      
      setClient(newClient);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
    }
  };

  const executeQuery = async (queryString: string) => {
    if (!client()) {
      setError('Please connect to the database first');
      return null;
    }

    try {
      setError(null);
      const result = await client()!.execute(queryString);
      return result;
    } catch (err) {
      setError(`Query error: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };

  const getQueryString = () => {
    if (activeTab() === 'albums') {
      switch (selectedQuery()) {
        case 'list':
          return 'SELECT * FROM albums ORDER BY title';
        case 'add':
          return `INSERT INTO albums (title, release_date, coverart_url) 
                 VALUES ('${albumTitle()}', '${albumReleaseDate()}', '${albumCoverUrl()}')`;
        default:
          return 'SELECT * FROM albums';
      }
    } else {
      switch (selectedQuery()) {
        case 'list':
          return selectedAlbumId() 
            ? `SELECT songs.*, albums.title as album_title FROM songs 
               JOIN albums ON songs.album_id = albums.id 
               WHERE album_id = ${selectedAlbumId()} 
               ORDER BY track_number`
            : 'SELECT songs.*, albums.title as album_title FROM songs JOIN albums ON songs.album_id = albums.id ORDER BY album_id, track_number';
        case 'add':
          return `INSERT INTO songs (title, duration_seconds, track_number, is_single, album_id) 
                 VALUES ('${songTitle()}', ${songDuration()}, ${songTrackNumber()}, ${songIsSingle() ? 1 : 0}, ${songAlbumId()})`;
        default:
          return 'SELECT * FROM songs';
      }
    }
  };
  
  // Fetch all albums for the dropdown
  const [albumsForDropdown] = createResource(
    () => isConnected() ? 'SELECT id, title FROM albums ORDER BY title' : null,
    executeQuery
  );

  // Main query resource
  const [queryResult, { refetch }] = createResource(
    () => isConnected() ? getQueryString() : null,
    executeQuery
  );
  
  // Effects to reset form fields when changing tabs or query types
  createEffect(() => {
    selectedQuery();
    // Reset form fields
    setAlbumTitle('');
    setAlbumReleaseDate('');
    setAlbumCoverUrl('');
    setSongTitle('');
    setSongDuration('');
    setSongTrackNumber('1');
    setSongIsSingle(true);
    setSongAlbumId('');
  });
  
  const handleFormSubmit = async (e: Event) => {
    e.preventDefault();
    if (selectedQuery() === 'add') {
      await executeQuery(getQueryString());
      // Reset form fields
      if (activeTab() === 'albums') {
        setAlbumTitle('');
        setAlbumReleaseDate('');
        setAlbumCoverUrl('');
      } else {
        setSongTitle('');
        setSongDuration('');
        setSongTrackNumber('1');
        setSongIsSingle(true);
      }
      // Refetch the list view
      setSelectedQuery('list');
      refetch();
    }
  };

  return (
    <div class="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Turso Database Connection</CardTitle>
          <CardDescription>Connect to your music database and manage albums and songs</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Database URL</Label>
            <Input
              type="text"
              placeholder="libsql://your-database-url"
              value={dbUrl()}
              onInput={(e) => setDbUrl(e.currentTarget.value)}
            />
          </div>
          <div class="space-y-2">
            <Label>Auth Token</Label>
            <Input
              type="password"
              placeholder="Your database auth token"
              value={dbAuthToken()}
              onInput={(e) => setDbAuthToken(e.currentTarget.value)}
            />
          </div>
          <Button onClick={connectToDb} disabled={isConnected()}>
            {isConnected() ? 'Connected' : 'Connect to Database'}
          </Button>
          
          <Show when={error()}>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
              {error()}
            </div>
          </Show>
        </CardContent>
      </Card>

      <Show when={isConnected()}>
        <Tabs value={activeTab()} onChange={setActiveTab} class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="songs">Songs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="albums" class="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Albums</CardTitle>
                <CardDescription>Manage your music albums</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="flex gap-4 mb-6">
                  <Button 
                    variant={selectedQuery() === 'list' ? 'default' : 'outline'} 
                    onClick={() => setSelectedQuery('list')}
                  >
                    View Albums
                  </Button>
                  <Button 
                    variant={selectedQuery() === 'add' ? 'default' : 'outline'} 
                    onClick={() => setSelectedQuery('add')}
                  >
                    Add Album
                  </Button>
                </div>
                
                <Show when={selectedQuery() === 'add'}>
                  <form onSubmit={handleFormSubmit} class="space-y-4">
                    <div class="grid gap-4">
                      <div class="space-y-2">
                        <Label for="album-title">Album Title</Label>
                        <Input
                          id="album-title"
                          required
                          value={albumTitle()}
                          onInput={(e) => setAlbumTitle(e.currentTarget.value)}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="release-date">Release Date</Label>
                        <Input
                          id="release-date"
                          type="date"
                          required
                          value={albumReleaseDate()}
                          onInput={(e) => setAlbumReleaseDate(e.currentTarget.value)}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="coverart-url">Cover Art URL</Label>
                        <Input
                          id="coverart-url"
                          value={albumCoverUrl()}
                          onInput={(e) => setAlbumCoverUrl(e.currentTarget.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit">Add Album</Button>
                  </form>
                </Show>
                
                <Show when={selectedQuery() === 'list' && !queryResult.loading}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Release Date</TableHead>
                        <TableHead>Cover Art</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <Show when={queryResult()?.rows}>
                        <For each={queryResult()?.rows}>
                          {(album: any) => (
                            <TableRow>
                              <TableCell>{album.id}</TableCell>
                              <TableCell>{album.title}</TableCell>
                              <TableCell>{album.release_date}</TableCell>
                              <TableCell>
                                {album.coverart_url && (
                                  <img 
                                    src={album.coverart_url} 
                                    alt={album.title} 
                                    class="w-12 h-12 object-cover rounded"
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => {
                                    setActiveTab('songs');
                                    setSelectedAlbumId(album.id);
                                    setSelectedQuery('list');
                                  }}
                                >
                                  View Songs
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </For>
                      </Show>
                    </TableBody>
                  </Table>
                </Show>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="songs" class="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Songs</CardTitle>
                <CardDescription>
                  {selectedAlbumId() ? 
                    'Songs from selected album' : 
                    'Manage your music songs'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div class="flex gap-4 mb-6">
                  <Button 
                    variant={selectedQuery() === 'list' ? 'default' : 'outline'} 
                    onClick={() => setSelectedQuery('list')}
                  >
                    View Songs
                  </Button>
                  <Button 
                    variant={selectedQuery() === 'add' ? 'default' : 'outline'} 
                    onClick={() => setSelectedQuery('add')}
                  >
                    Add Song
                  </Button>
                  
                  <Show when={selectedAlbumId()}>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedAlbumId(null)}
                    >
                      Show All Albums' Songs
                    </Button>
                  </Show>
                </div>
                
                <Show when={selectedQuery() === 'add'}>
                  <form onSubmit={handleFormSubmit} class="space-y-4">
                    <div class="grid gap-4">
                      <div class="space-y-2">
                        <Label for="song-title">Song Title</Label>
                        <Input
                          id="song-title"
                          required
                          value={songTitle()}
                          onInput={(e) => setSongTitle(e.currentTarget.value)}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="duration">Duration (seconds)</Label>
                        <Input
                          id="duration"
                          type="number"
                          required
                          min="1"
                          value={songDuration()}
                          onInput={(e) => setSongDuration(e.currentTarget.value)}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="track-number">Track Number</Label>
                        <Input
                          id="track-number"
                          type="number"
                          min="1"
                          value={songTrackNumber()}
                          onInput={(e) => setSongTrackNumber(e.currentTarget.value)}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label>Is Single</Label>
                        <div class="flex items-center space-x-2">
                          <input
                            id="is-single"
                            type="checkbox"
                            class="h-4 w-4"
                            checked={songIsSingle()}
                            onChange={(e) => setSongIsSingle(e.currentTarget.checked)}
                          />
                          <Label for="is-single">Yes</Label>
                        </div>
                      </div>
                      <div class="space-y-2">
                        <Label for="album-id">Album</Label>
                        <select
                          id="album-id"
                          class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground"
                          value={songAlbumId()}
                          onChange={(e) => setSongAlbumId(e.target.value)}
                          required
                        >
                          <option value="" disabled selected>Select album</option>
                          <For each={albumsForDropdown()?.rows}>
                            {(album: any) => (
                              <option value={String(album.id)}>
                                {album.title}
                              </option>
                            )}
                          </For>
                        </select>
                      </div>
                    </div>
                    <Button type="submit">Add Song</Button>
                  </form>
                </Show>
                
                <Show when={selectedQuery() === 'list' && !queryResult.loading}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Track #</TableHead>
                        <TableHead>Single</TableHead>
                        <TableHead>Album</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <Show when={queryResult()?.rows}>
                        <For each={queryResult()?.rows}>
                          {(song: any) => (
                            <TableRow>
                              <TableCell>{song.id}</TableCell>
                              <TableCell>{song.title}</TableCell>
                              <TableCell>
                                {Math.floor(song.duration_seconds / 60)}:{(song.duration_seconds % 60).toString().padStart(2, '0')}
                              </TableCell>
                              <TableCell>{song.track_number}</TableCell>
                              <TableCell>{song.is_single ? 'Yes' : 'No'}</TableCell>
                              <TableCell>{song.album_title}</TableCell>
                            </TableRow>
                          )}
                        </For>
                      </Show>
                    </TableBody>
                  </Table>
                </Show>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Show>
    </div>
  );
}
