import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_LOGO, getLoginUrl } from "@/const";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Upload, Music, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Submit() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    artistName: "",
    trackTitle: "",
    genre: "Electronic",
    audioFile: null as File | null,
  });

  const genres = ["Electronic", "Synthwave", "Ambient", "Pop", "Hip Hop", "Rock", "R&B", "Jazz", "Other"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.audioFile) {
      toast.error("Please select an audio file");
      return;
    }

    if (formData.audioFile.size > 16 * 1024 * 1024) {
      toast.error("Audio file must be less than 16MB");
      return;
    }

    setIsSubmitting(true);

    try {
      // For now, we'll just insert the track without uploading audio
      // In production, you'd upload to S3 using storagePut
      const { data, error } = await supabase.from("submissions").insert({
        artist_name: formData.artistName,
        track_title: formData.trackTitle,
        genre: formData.genre,
        audio_url: "https://example.com/placeholder.mp3", // Placeholder
        status: "pending",
        submitted_by: user?.id || "demo-user",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Track submitted successfully!");
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          artistName: "",
          trackTitle: "",
          genre: "Electronic",
          audioFile: null,
        });
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Error submitting track:", error);
      toast.error("Failed to submit track");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-gray-200">FREQUENCY FACTORY</h1>
          <p className="text-gray-400">Sign in to submit tracks</p>
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit Your Track</h2>
          <p className="text-gray-400">Share your music with the Factory community</p>
        </div>

        {submitted ? (
          <div className="bg-gradient-to-br from-green-900/30 to-teal-900/30 border border-green-500/30 rounded-lg p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Track Submitted!</h3>
            <p className="text-gray-400 mb-4">
              Your track is now in the queue for review. You'll be notified when it's approved.
            </p>
            <Button
              onClick={() => setLocation("/feed")}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Back to Feed
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Artist Name */}
            <div className="space-y-2">
              <Label htmlFor="artistName" className="text-gray-200">
                Artist Name *
              </Label>
              <Input
                id="artistName"
                type="text"
                required
                value={formData.artistName}
                onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                placeholder="Enter your artist name"
                className="bg-gray-900 border-gray-800 text-white"
              />
            </div>

            {/* Track Title */}
            <div className="space-y-2">
              <Label htmlFor="trackTitle" className="text-gray-200">
                Track Title *
              </Label>
              <Input
                id="trackTitle"
                type="text"
                required
                value={formData.trackTitle}
                onChange={(e) => setFormData({ ...formData, trackTitle: e.target.value })}
                placeholder="Enter your track title"
                className="bg-gray-900 border-gray-800 text-white"
              />
            </div>

            {/* Genre */}
            <div className="space-y-2">
              <Label htmlFor="genre" className="text-gray-200">
                Genre *
              </Label>
              <select
                id="genre"
                required
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2"
              >
                {genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio File Upload */}
            <div className="space-y-2">
              <Label htmlFor="audioFile" className="text-gray-200">
                Audio File * (MP3, WAV, max 16MB)
              </Label>
              <div className="border-2 border-dashed border-gray-800 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors">
                <input
                  id="audioFile"
                  type="file"
                  accept="audio/*"
                  required
                  onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
                  className="hidden"
                />
                <label htmlFor="audioFile" className="cursor-pointer">
                  {formData.audioFile ? (
                    <div className="space-y-2">
                      <Music className="w-12 h-12 text-green-500 mx-auto" />
                      <p className="text-sm font-medium">{formData.audioFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(formData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-500 mx-auto" />
                      <p className="text-sm font-medium">Click to upload audio file</p>
                      <p className="text-xs text-gray-500">MP3, WAV (max 16MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Guidelines */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h4 className="font-bold mb-2">Submission Guidelines</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Track must be your original work</li>
                <li>• High-quality audio (minimum 128kbps)</li>
                <li>• No explicit content without warning</li>
                <li>• Tracks are reviewed within 24-48 hours</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-6 text-lg shadow-lg shadow-orange-500/30"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </div>
              ) : (
                "SUBMIT TRACK"
              )}
            </Button>
          </form>
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
                <span className="text-xs">Discover</span>
              </Button>
            </Link>
            <Link href="/submit">
              <Button variant="ghost" size="sm" className="flex-col h-auto py-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 mb-1" />
                <span className="text-xs text-purple-500">Submit</span>
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
