export const dynamic = 'force-dynamic';

import {
  fetchNowTrendingSongs,
  fetchNewReleasesFromJioSaavn,
  fetchRandomAlbums,
  fetchTopArtistsFromJioSaavn,
} from "@/lib/songTypes";
import Home from "./components/Home/HomeView";

export default async function App() {
  const newReleases = await fetchNewReleasesFromJioSaavn();
  const nowTrendingSongs = await fetchNowTrendingSongs();
  const albums = await fetchRandomAlbums();
  const topArtists = (await fetchTopArtistsFromJioSaavn()).sort(
    (a, b) => Number(b.follower_count) - Number(a.follower_count)
  );
  
  return (
    <Home
      newReleases={newReleases}
      nowTrendingSongs={nowTrendingSongs}
      albums={albums}
      topArtists={topArtists}
    />
  );
}
