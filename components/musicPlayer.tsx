"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Grid3x3,
  List,
  Music,
  Edit2,
  Trash2,
  X,
  Clock,
} from "lucide-react";
import { AudioFile } from "@/typeScript/audio.interface";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function MusicPlayer() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // Function that updates currentTime every millisecond
    const updateTime = () => setCurrentTime(audio.currentTime);

    // Function that gets total song duration when loaded
    const updateDuration = () => setDuration(audio.duration);
    // Function that plays next song when current one finishes
    const handleEnded = () => {
      if (!currentTrack || audioFiles.length === 0) return;
      const currentIndex = audioFiles.findIndex(
        (item) => item.id === currentTrack.id
      );
      const nextIndex = (currentIndex + 1) % audioFiles.length;
      playTrack(audioFiles[nextIndex]);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    // clean up function
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack, audioFiles]); /// re-run when dependecy changes

  /// file validation

  const validateAudioFile = (file: File): boolean => {
    const validTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/aac",
      "audio/m4a",
    ];
    return (
      validTypes.includes(file.type) ||
      file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i) !== null
    );
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateAudioFile);

    if (validFiles.length === 0) {
      alert("Please upload valid audio files only (MP3, WAV, OGG, AAC, M4A)");
      return;
    }

    ///function for handling new audio file and Process each file


    const newAudioFiles: AudioFile[] = await Promise.all(
      validFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio(url);

        /// wait for metadata to load
        return new Promise<AudioFile>((resolve) => {
          audio.addEventListener("loadedmetadata", () => {
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name.replace(/\.[^/.]+$/, ""),
              file,
              url,
              duration: audio.duration, ///get audio duration
            });
          });
        });
      })
    );
 // Add new files to existing ones
    setAudioFiles((prev) => [...prev, ...newAudioFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  /// drag and drop functions

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  /// music play function
  const playTrack = (track: AudioFile) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    }, 100);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // function for playing the next music
  const playNext = () => {
    if (!currentTrack || audioFiles.length === 0) return;
    const currentIndex = audioFiles.findIndex((f) => f.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % audioFiles.length;
    playTrack(audioFiles[nextIndex]);
  };

  // function for playing the previous music

  const playPrevious = () => {
    if (!currentTrack || audioFiles.length === 0) return;
    const currentIndex = audioFiles.findIndex((f) => f.id === currentTrack.id);
    const prevIndex =
      currentIndex === 0 ? audioFiles.length - 1 : currentIndex - 1;
    playTrack(audioFiles[prevIndex]);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  /// edit function for name of the song

  const startEdit = (track: AudioFile) => {
    setEditingId(track.id);
    setEditName(track.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      setAudioFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: editName.trim() } : f))
      );
      if (currentTrack && currentTrack.id === id) {
        setCurrentTrack({ ...currentTrack, name: editName.trim() });
      }
    }
    setEditingId(null);
  };

  /// delete function

  const deleteTrack = (id: string) => {
    setAudioFiles((prev) => prev.filter((f) => f.id !== id));
    if (currentTrack && currentTrack.id === id) {
      setCurrentTrack(null);
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto p-6 pb-32">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Music Player
        </h1>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-2xl p-12 mb-8 text-center transition-all ${
            isDragging
              ? "border-purple-400 bg-purple-400/10"
              : "border-gray-600 hover:border-purple-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto mb-4 w-16 h-16 text-purple-400" />
          <p className="text-xl mb-2">Drag & Drop Audio Files Here</p>
          <p className="text-gray-400 mb-4">or</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-purple-600 cursor-pointer hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.aac,.m4a"
            onChange={handleFileInput}
            className="hidden"
          />
          <p className="text-sm text-gray-500 mt-4">
            Supported: MP3, WAV, OGG, AAC, M4A
          </p>
        </div>

        {/* Toggle */}
        {audioFiles.length > 0 && (
          <div className="flex justify-end mb-4">
            <div className="bg-gray-800 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid" ? "bg-purple-600" : "hover:bg-gray-700"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list" ? "bg-purple-600" : "hover:bg-gray-700"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Audio List/Grid */}
        {audioFiles.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Music className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p className="text-xl">No audio files uploaded yet</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {audioFiles.map((track) => (
              <div
                key={track.id}
                className={`bg-neutral-800 rounded-xl p-4 hover:bg-gray-750 transition-all cursor-pointer ${
                  currentTrack?.id === track.id
                    ? "ring-2 ring-green-500 bg-green-900/20"
                    : ""
                }`}
              >
                <div
                  onClick={() => playTrack(track)}
                  className="flex flex-col items-center mb-3"
                >
                  <div
                    className={`w-34 h-24 rounded-lg flex items-center justify-center mb-3 ${
                      currentTrack?.id === track.id
                        ? "bg-green-600"
                        : "bg-purple-600"
                    }`}
                  >
                    <Music className="w-12 h-12" />
                  </div>
                  {editingId === track.id ? (
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(track.id)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(track.id)}
                      className="bg-gray-700 text-white px-2 py-1 rounded w-full text-center"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <p className="font-semibold text-center text-sm line-clamp-2">
                      {track.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTime(track.duration)}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(track);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTrack(track.id);
                    }}
                    className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden mb-8">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left">#</th>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">
                    <Clock />{" "}
                  </th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {audioFiles.map((track, index) => (
                  <tr
                    key={track.id}
                    className={`border-t border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors ${
                      currentTrack?.id === track.id ? "bg-green-900/20" : ""
                    }`}
                    onClick={() => playTrack(track)}
                  >
                    <td className="px-6 py-4">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <div className="flex gap-1">
                          <div className="w-1 h-4 bg-green-500 animate-pulse"></div>
                          <div
                            className="w-1 h-4 bg-green-500 animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-1 h-4 bg-green-500 animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      ) : (
                        <span
                          className={
                            currentTrack?.id === track.id
                              ? "text-green-500 font-bold"
                              : ""
                          }
                        >
                          {index + 1}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === track.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => saveEdit(track.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && saveEdit(track.id)
                          }
                          className="bg-gray-700 text-white px-2 py-1 rounded w-full"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span
                          className={
                            currentTrack?.id === track.id
                              ? "text-green-500 font-semibold"
                              : ""
                          }
                        >
                          {track.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatTime(track.duration)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(track);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrack(track.id);
                          }}
                          className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audio Player || Only show when song is playing*/}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-800 border-t border-gray-700 shadow-2xl">
          <div className="container mx-auto px-6 py-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Album Art */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Music className="w-10 h-8" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{currentTrack.name}</p>
                  <p className="text-sm text-gray-400">Now Playing</p>
                </div>
              </div>

              {/*  Controls */}
              <div className="flex items-center gap-6 flex-1 justify-center">
                <button
                  onClick={playPrevious}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-4 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1" />
                  )}
                </button>
                <button
                  onClick={playNext}
                  className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/*  Queue Info */}
              <div className="flex-1 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {audioFiles.findIndex((f) => f.id === currentTrack.id) + 1}{" "}
                    / {audioFiles.length}
                  </p>
                  <p className="text-xs text-gray-500">in queue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={currentTrack?.url} />

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
