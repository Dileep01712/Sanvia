export const dynamic = 'force-dynamic';

import {
  fetchNowTrendingSongs,
  fetchNewReleases,
  fetchRandomAlbums,
  fetchTopArtists,
  fetchViralSongs,
} from "@/lib/songTypes";
import HomeView from "./components/Home/HomeView";

export default async function App() {
  const newReleases = await fetchNewReleases();
  const nowTrendingSongs = await fetchNowTrendingSongs();
  const viralSongs = await fetchViralSongs();
  const albums = await fetchRandomAlbums();
  const topArtists = (await fetchTopArtists()).sort(
    (a, b) => Number(b.follower_count) - Number(a.follower_count)
  );

  return (
    <HomeView
      newReleases={newReleases}
      nowTrendingSongs={nowTrendingSongs}
      viralSongs={viralSongs}
      albums={albums}
      topArtists={topArtists}
    />
  );
}