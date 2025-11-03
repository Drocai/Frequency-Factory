import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_LOGO, getLoginUrl } from "@/const";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, Filter, TrendingUp, Clock, Flame } from "lucide-react";

interface Track {
  id: number;
  artist_name: string;
  track_title: string;
  audio_url: string;
  genre: string;
  artist_image?: string;
  prediction_count: number;
  submitted_at: string;
}

export default function Discover() {
  const { user, loading } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"trending" | "recent" | "hot">("trending");
  const [isLoading, setIsLoading] = useState(true);

  const genres = ["All", "Electronic", "Synthwave", "Ambient", "Pop", "Hip Hop", "Rock"];

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    filterAndSortTracks();
  }, [tracks, searchQuery, selectedGenre, sortBy]);

  async function fetchTracks() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("status", "approved")
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching tracks:", error);
    } else {
      setTracks(data || []);
    }
    setIsLoading(false);
  }

  function filterAndSortTracks() {
    let filtered = [...tracks];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (track) =>
          track.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.track_title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== "All") {
      filtered = filtered.filter((track) => track.genre === selectedGenre);
    }

    // Sort
    if (sortBy === "trending") {
      filtered.sort((a, b) => (b.prediction_count || 0) - (a.prediction_count || 0));
    } else if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    } else if (sortBy === "hot") {
      // Hot = recent + high prediction count
      filtered.sort((a, b) => {
        const aScore = (b.prediction_count || 0) * 0.7 + (new Date(b.submitted_at).getTime() / 1000000) * 0.3;
        const bScore = (a.prediction_count || 0) * 0.7 + (new Date(a.submitted_at).getTime() / 1000000) * 0.3;
        return bScore - aScore;
      });
    }

    setFilteredTracks(filtered);
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-200">FREQUENCY FACTORY</h1>
          <p className="text-gray-400">Sign in to discover tracks</p>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-3 rounded-lg shadow-lg shadow-orange-500/50"
          >
            ENTER THE FACTORY
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt="Logo" className="h-8" />
          </Link>
          <h1 className="text-xl font-bold">FREQUENCY FACTORY</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-full border border-orange-500/30">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-bold">50 FT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Discover Tracks</h2>
          <p className="text-gray-400">Explore and certify the next generation of hits</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search artists or tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Sort Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={sortBy === "trending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("trending")}
              className={sortBy === "trending" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button
              variant={sortBy === "hot" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("hot")}
              className={sortBy === "hot" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Flame className="w-4 h-4 mr-2" />
              Hot
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("recent")}
              className={sortBy === "recent" ? "bg-orange-500 hover:bg-orange-600" : ""}
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </Button>
          </div>

          {/* Genre Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {genres.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className={selectedGenre === genre ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                {genre}
              </Button>
            ))}
          </div>
        </div>

        {/* Tracks Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-400">Loading tracks...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No tracks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTracks.map((track) => (
              <Link key={track.id} href="/feed">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-orange-500/50 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={track.artist_image || APP_LOGO}
                      alt={track.artist_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-orange-500/30"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate group-hover:text-orange-500 transition-colors">
                        {track.artist_name}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{track.track_title}</p>
                      <p className="text-xs text-gray-500 mt-1">{track.genre}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{track.prediction_count || 0} predictions</span>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30"
                    >
                      CERTIFY
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link href="/feed">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 mb-1" />
                <span className="text-xs">Home</span>
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 mb-1" />
                <span className="text-xs text-orange-500">Discover</span>
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-1" />
                <span className="text-xs">Submit</span>
              </Button>
            </Link>
            <Link href="/rewards">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 mb-1" />
                <span className="text-xs">Rewards</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 mb-1" />
                <span className="text-xs">Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
