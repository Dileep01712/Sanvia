import {
  fetchNowTrendingSongsFromJioSaavn,
  fetchNewReleasesFromJioSaavn,
  fetchAlbumsFromJioSaavn,
  fetchTopArtistsFromJioSaavn,
} from "@/lib/songs";
import HomepageContent from "./sections/HomepageContent";

export default async function Home() {
  const newReleases = await fetchNewReleasesFromJioSaavn();
  const nowTrendingSongs = await fetchNowTrendingSongsFromJioSaavn();
  const albums = await fetchAlbumsFromJioSaavn();
  const topArtists = (await fetchTopArtistsFromJioSaavn()).sort(
    (a, b) => Number(b.follower_count) - Number(a.follower_count)
  );

  return (
    <HomepageContent
      newReleases={newReleases}
      nowTrendingSongs={nowTrendingSongs}
      albums={albums}
      topArtists={topArtists}
    />
  );
}
