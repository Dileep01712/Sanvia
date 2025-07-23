"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var image_1 = require("next/image");
var react_2 = require("react");
var getStreamingUrl_1 = require("@/lib/getStreamingUrl");
var AlbumSongs_1 = require("./AlbumSongs");
var button_1 = require("@/components/ui/button");
var react_fontawesome_1 = require("@fortawesome/react-fontawesome");
var free_solid_svg_icons_1 = require("@fortawesome/free-solid-svg-icons");
function NowPlayingModal(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f;
    var isOpen = _a.isOpen, item = _a.item, playlist = _a.playlist, topArtists = _a.topArtists, onArtistChange = _a.onArtistChange, setPlaylist = _a.setPlaylist;
    var _g = react_2.useState(0), currentIndex = _g[0], setCurrentIndex = _g[1];
    var _h = react_2.useState(true), isPlaying = _h[0], setIsPlaying = _h[1];
    var _j = react_2.useState(""), streamingUrl = _j[0], setStreamingUrl = _j[1];
    var _k = react_2.useState(null), overriddenTitle = _k[0], setOverriddenTitle = _k[1];
    var _l = react_2.useState(null), overriddenArtist = _l[0], setOverriddenArtist = _l[1];
    var audioRef = react_2.useRef(null);
    var _m = react_2.useState(0), duration = _m[0], setDuration = _m[1];
    var _o = react_2.useState(0), currentTime = _o[0], setCurrentTime = _o[1];
    var _p = react_2.useState(false), isImageLoaded = _p[0], setIsImageLoaded = _p[1];
    var _q = react_2.useState(false), isTimeoutOver = _q[0], setIsTimeoutOver = _q[1];
    var _r = react_1["default"].useState(true), isExpanded = _r[0], setIsExpanded = _r[1];
    var progressBarRef = react_2.useRef(null);
    var _s = react_2.useState(false), isDragging = _s[0], setIsDragging = _s[1];
    var _t = react_2.useState(null), dragProgress = _t[0], setDragProgress = _t[1];
    var _u = react_2.useState(false), isShuffle = _u[0], setIsShuffle = _u[1];
    var _v = react_2.useState(false), pendingShuffle = _v[0], setPendingShuffle = _v[1];
    var _w = react_2.useState(null), setLastSongId = _w[1];
    var _x = react_2.useState(false), isRepeat = _x[0], setIsRepeat = _x[1];
    var hasLoadedRef = react_2.useRef(null);
    var volumeBarRef = react_2.useRef(null);
    var previousVolumeRef = react_2.useRef(1);
    var _y = react_2.useState(1), volume = _y[0], setVolume = _y[1];
    var _z = react_2.useState(false), isMuted = _z[0], setIsMuted = _z[1];
    var _0 = react_2.useState(0), activePage = _0[0], setActivePage = _0[1];
    var _1 = react_2.useState(false), isHeightExpanded = _1[0], setIsHeightExpanded = _1[1];
    var _2 = react_2.useState(null), selectedSong = _2[0], setSelectedSong = _2[1];
    // Set the current song based on the currentIndex
    var currentSong = !isArtist(item) && playlist.length > 0 && currentIndex >= 0 ? playlist[currentIndex] : null;
    var isArtistView = item ? isArtist(item) : false;
    var currentArtist = isArtistView ? item : null;
    function decodeHTMLEntities(text) {
        var txt = document.createElement("textarea");
        txt.innerHTML = text;
        return txt.value;
    }
    ;
    currentSong = react_1.useMemo(function () {
        var _a, _b, _c, _d;
        if (selectedSong) {
            debugger;
            // new Promise(resolve => setTimeout(resolve, 1000));
            var selectedImage = Array.isArray(selectedSong.image) ? ((_a = selectedSong.image.find(function (img) { return img.quality === '500x500'; })) === null || _a === void 0 ? void 0 : _a.url) || "" : typeof selectedSong.image === 'string' ? selectedSong.image : "";
            var downloadUrl = selectedSong.url || "";
            var streamingUrl_1 = Array.isArray(selectedSong.downloadUrl) ? ((_b = selectedSong.downloadUrl.find(function (d) { return d.quality === '320kbps'; })) === null || _b === void 0 ? void 0 : _b.url) || "" : selectedSong.streamingUrl || "";
            return {
                id: selectedSong.id,
                name: decodeHTMLEntities(selectedSong.name),
                primaryArtists: ((_d = (_c = selectedSong.artists) === null || _c === void 0 ? void 0 : _c.primary) === null || _d === void 0 ? void 0 : _d.map(function (a) { return a.name; }).join(", ")) || selectedSong.primaryArtists || "",
                image: selectedImage,
                downloadUrl: downloadUrl,
                streamingUrl: streamingUrl_1
            };
        }
        if (!isArtist(item) && playlist.length > 0 && currentIndex >= 0) {
            return playlist[currentIndex];
        }
        return null;
    }, [selectedSong, playlist, currentIndex, item]);
    /**
     * Sets the current index when a new item is passed to the modal.
     * Finds the item in the playlist and sets it as the current song.
     */
    react_2.useEffect(function () {
        var _a, _b;
        if (item) {
            var index = playlist.findIndex(function (song) { return song.id === item.id; });
            setCurrentIndex(index);
            setLastSongId((_b = (_a = playlist[index]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null);
        }
    }, [item, playlist]);
    /**
     * Fetches and sets the streaming URL for the current song when it changes
     * Only triggers if the image is loaded to ensure smoother playback experience.
     */
    react_2.useEffect(function () {
        if (!currentSong || (!currentSong.streamingUrl && !currentSong.downloadUrl) || (!isImageLoaded && !isArtist(item))) {
            setStreamingUrl("");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
                setIsPlaying(false);
            }
            return;
        }
        if (currentSong.streamingUrl) {
            hasLoadedRef.current = currentSong.id;
            setStreamingUrl(currentSong.streamingUrl);
            setOverriddenTitle(null);
            setOverriddenArtist(null);
            return;
        }
        // Only proceed if this song wasn't just loaded (prevents double-fetch on same song in dev)
        if (hasLoadedRef.current === currentSong.id)
            return;
        hasLoadedRef.current = currentSong.id;
        var controller = new AbortController();
        var signal = controller.signal;
        var loadStream = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, url, name_1, primaryArtists, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, getStreamingUrl_1.getStreamingUrlFromSaavn(currentSong.id, currentSong.name, currentSong.downloadUrl)];
                    case 1:
                        _a = _b.sent(), url = _a.url, name_1 = _a.name, primaryArtists = _a.primaryArtists;
                        if (!signal.aborted) {
                            if (item && "downloadUrl" in item) {
                                setStreamingUrl(url);
                            }
                            else {
                                setStreamingUrl("");
                            }
                            if (currentSong.downloadUrl.includes("/album/")) {
                                setOverriddenTitle(name_1);
                                setOverriddenArtist(primaryArtists);
                            }
                            else {
                                setOverriddenTitle(null);
                                setOverriddenArtist(null);
                            }
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        if (!signal.aborted) {
                            console.error("Stream fetch error: ", error_1);
                            setStreamingUrl("");
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        loadStream();
        return function () {
            controller.abort();
        };
    }, [currentSong, isImageLoaded, item]);
    /**
     * Moves to the next song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the next song in order.
     * Pauses audio if at the end of the playlist in normal mode.
     */
    var next = react_1.useCallback(function () {
        var _a, _b, _c, _d, _e;
        var shouldShuffle = isShuffle;
        if (pendingShuffle) {
            setIsShuffle(true);
            setPendingShuffle(false);
            shouldShuffle = true;
        }
        if (shouldShuffle) {
            var randomIndex = currentIndex;
            while (playlist.length > 1 && (!((_a = playlist[randomIndex]) === null || _a === void 0 ? void 0 : _a.downloadUrl) || randomIndex === currentIndex)) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            setCurrentIndex(randomIndex);
            return;
        }
        var nextIndex = currentIndex + 1;
        while (nextIndex < playlist.length && !((_b = playlist[nextIndex]) === null || _b === void 0 ? void 0 : _b.downloadUrl)) {
            nextIndex++;
        }
        if (nextIndex < playlist.length) {
            setCurrentIndex(nextIndex);
            setLastSongId((_d = (_c = playlist[nextIndex]) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null);
        }
        else {
            (_e = audioRef.current) === null || _e === void 0 ? void 0 : _e.pause();
            setIsPlaying(false);
        }
    }, [currentIndex, playlist, isShuffle, pendingShuffle]);
    /**
     * Moves to the previous song.
     * If shuffle is enabled, selects a random valid song that’s not the current one.
     * Otherwise, moves to the previous song in circular order.
     */
    var prev = function () {
        var _a;
        if (isShuffle) {
            var randomIndex = currentIndex;
            while (playlist.length > 1 && (!((_a = playlist[randomIndex]) === null || _a === void 0 ? void 0 : _a.downloadUrl) || randomIndex === currentIndex)) {
                randomIndex = Math.floor(Math.random() * playlist.length);
            }
            setCurrentIndex(randomIndex);
        }
        else {
            setCurrentIndex(function (prev) { return (prev - 1 + playlist.length) % playlist.length; });
        }
    };
    /**
     * Toggles shuffle mode.
     * If already on, turns it off.
     * If off, marks shuffle as pending (applied on next song).
     */
    var shuffle = function () {
        if (isShuffle || pendingShuffle) {
            setIsShuffle(false);
            setPendingShuffle(false);
        }
        else {
            setPendingShuffle(true);
        }
    };
    /**
     * Replays the current song from the start.
     */
    var repeat = function () {
        setIsRepeat(function (prev) { return !prev; });
    };
    /**
     * Controls the audio element:
     * - Loads the new stream if the URL has changed.
     * - Plays audio when stream is ready and image is loaded.
     * - Handles play/pause/end events to update state and move to next song.
     */
    react_2.useEffect(function () {
        var audio = audioRef.current;
        if (!audio)
            return;
        var handlePlay = function () { return setIsPlaying(true); };
        var handlePause = function () { return setIsPlaying(false); };
        var handleEnded = function () {
            if (isRepeat && audio) {
                audio.currentTime = 0;
                audio.play();
            }
            else {
                next();
            }
        };
        if (!streamingUrl || !isImageLoaded) {
            if (!streamingUrl && audio.src) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            }
            else {
                audio.pause();
            }
            setIsPlaying(false);
        }
        else {
            if (audio.src !== streamingUrl) {
                audio.src = streamingUrl;
                audio.play()
                    .then(function () { return setIsPlaying(true); })["catch"](console.error);
            }
        }
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("pause", handlePause);
        audio.addEventListener("ended", handleEnded);
        return function () {
            audio.removeEventListener("play", handlePlay);
            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("ended", handleEnded);
            if (isArtist(item) && audio.src) {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
                setIsPlaying(false);
            }
        };
    }, [streamingUrl, isImageLoaded, next, isRepeat, isOpen, item]);
    /**
     * Toggles audio playback manually (via play/pause button).
     */
    var togglePlay = function () {
        var audio = audioRef.current;
        if (!audio)
            return;
        if (audio.paused) {
            audio.play()
                .then(function () { return setIsPlaying(true); })["catch"](console.error);
        }
        else {
            audio.pause();
            setIsPlaying(false);
        }
    };
    /**
     * Converts seconds into a MM:SS format string.
     */
    function formatTime(seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ":" + (secs < 10 ? "0" : "") + secs;
    }
    /**
     * Shows fallback skeleton loader for 12 seconds while image loads.
     */
    react_2.useEffect(function () {
        var timer = setTimeout(function () {
            setIsTimeoutOver(true);
        }, 12000);
        return function () { return clearTimeout(timer); };
    }, []);
    /**
     * Locks the body scroll when modal is open.
     */
    react_2.useLayoutEffect(function () {
        if (isOpen && isExpanded) {
            document.body.style.overflow = "hidden";
        }
        else {
            document.body.style.overflow = "auto";
        }
        return function () {
            document.body.style.overflow = "";
        };
    }, [isOpen, isExpanded]);
    /**
     * Starts seeking audio position when user clicks down on the progress bar.
     */
    var handleMouseDown = function (e) {
        setIsDragging(true);
        updateCurrentTimeFromMouse(e);
    };
    /**
     * Updates currentTime and progress as user drags along the progress bar.
     */
    var updateCurrentTimeFromMouse = react_1.useCallback(function (e) {
        if (!audioRef.current || !progressBarRef.current)
            return;
        var rect = progressBarRef.current.getBoundingClientRect();
        var x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        var percentage = x / rect.width;
        var newTime = percentage * duration;
        setDragProgress(percentage);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);
    /**
     * Listens to mouse events on the progress bar during dragging and updates time accordingly.
     */
    react_2.useEffect(function () {
        var bar = progressBarRef.current;
        if (!isDragging || !bar)
            return;
        var handleMouseMove = function (e) {
            updateCurrentTimeFromMouse(e);
        };
        var handleMouseUp = function () {
            setIsDragging(false);
            setDragProgress(null);
        };
        bar.addEventListener("mousemove", handleMouseMove);
        bar.addEventListener("mouseup", handleMouseUp);
        bar.addEventListener("mouseleave", handleMouseUp);
        return function () {
            bar.removeEventListener("mousemove", handleMouseMove);
            bar.removeEventListener("mouseup", handleMouseUp);
            bar.removeEventListener("mouseleave", handleMouseUp);
        };
    }, [isDragging, updateCurrentTimeFromMouse]);
    react_2.useEffect(function () {
        setOverriddenTitle(null);
        setOverriddenArtist(null);
    }, [item]);
    function isArtist(item) {
        return !!item && typeof item === "object" && "follower_count" in item;
    }
    react_2.useEffect(function () {
        if (!item || !("downloadUrl" in item)) {
            setStreamingUrl("");
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute("src");
                audioRef.current.load();
            }
        }
    }, [item]);
    react_2.useEffect(function () {
        if (item && isArtist(item) && topArtists.length > 0) {
            var index = topArtists.findIndex(function (artist) { return artist.id === item.id; });
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            }
            else if (index === -1) {
                console.warn("Artist " + item.name + " not found in topArtists");
            }
        }
    }, [item, topArtists, currentIndex]);
    var prevArtist = function () {
        if (!isArtistView || topArtists.length === 0 || currentIndex === -1)
            return;
        var newIndex = (currentIndex - 1 + topArtists.length) % topArtists.length;
        setCurrentIndex(newIndex);
        onArtistChange(topArtists[newIndex]);
    };
    var nextArtist = function () {
        if (!isArtistView || topArtists.length === 0)
            return;
        setCurrentIndex(function (prev) {
            if (prev === -1) {
                onArtistChange(topArtists[0]);
                return 0;
            }
            var newIndex = (prev + 1) % topArtists.length;
            onArtistChange(topArtists[newIndex]);
            return newIndex;
        });
    };
    var handleVolumeBarClick = function (e) {
        if (!volumeBarRef.current || !audioRef.current)
            return;
        var rect = volumeBarRef.current.getBoundingClientRect();
        var newVolume = (e.clientX - rect.left) / rect.width;
        newVolume = Math.min(1, Math.max(0, newVolume));
        audioRef.current.volume = newVolume;
        setVolume(newVolume);
        if (newVolume === 0) {
            setIsMuted(true);
        }
        else {
            previousVolumeRef.current = newVolume;
            setIsMuted(false);
        }
    };
    var toggleMute = function () {
        var audio = audioRef.current;
        if (!audio)
            return;
        if (isMuted || volume === 0) {
            var restoreVolume = previousVolumeRef.current > 0 ? previousVolumeRef.current : 1;
            audio.volume = restoreVolume;
            setVolume(restoreVolume);
            setIsMuted(false);
        }
        else {
            previousVolumeRef.current = volume;
            audio.volume = 0;
            setVolume(0);
            setIsMuted(true);
        }
    };
    react_2.useEffect(function () {
        setIsHeightExpanded(isExpanded ? true : false);
    }, [isExpanded]);
    var handleSongSelect = function (song, recommended) {
        debugger;
        var newPlaylist = recommended;
        setPlaylist(newPlaylist);
        var index = newPlaylist.findIndex(function (s) { return s.id === song.id; });
        setCurrentIndex(index !== -1 ? index : 0);
        setSelectedSong(song);
    };
    react_2.useEffect(function () {
        debugger;
        if (selectedSong) {
            setPlaylist([]); // clear playlist on new selection
        }
    }, [selectedSong, setPlaylist]);
    var image = (_c = (_b = currentSong === null || currentSong === void 0 ? void 0 : currentSong.image) !== null && _b !== void 0 ? _b : currentArtist === null || currentArtist === void 0 ? void 0 : currentArtist.image) !== null && _c !== void 0 ? _c : "";
    var name = (_f = (_e = (_d = currentSong === null || currentSong === void 0 ? void 0 : currentSong.name) !== null && _d !== void 0 ? _d : currentArtist === null || currentArtist === void 0 ? void 0 : currentArtist.name) !== null && _e !== void 0 ? _e : currentSong === null || currentSong === void 0 ? void 0 : currentSong.primaryArtists) !== null && _f !== void 0 ? _f : "";
    var fanCount = (currentArtist === null || currentArtist === void 0 ? void 0 : currentArtist.follower_count) ? Number(currentArtist.follower_count).toLocaleString()
        : null;
    /**
     * Prevents rendering if modal is closed or no song is selected.
     */
    if (!isOpen || !item)
        return null;
    var effectiveProgress = isDragging && dragProgress !== null ? dragProgress : currentTime / duration || 0;
    return (react_1["default"].createElement(react_1["default"].Fragment, null,
        streamingUrl && (react_1["default"].createElement("audio", { ref: audioRef, src: streamingUrl || "", controls: true, autoPlay: true, hidden: true, onLoadedMetadata: function () {
                if (audioRef.current)
                    setDuration(audioRef.current.duration);
            }, onTimeUpdate: function () {
                if (audioRef.current)
                    setCurrentTime(audioRef.current.currentTime);
            } })),
        react_1["default"].createElement("div", { className: "fixed inset-0 z-40 transition-opacity duration-500 " + (isExpanded ? "bg-black/80 pointer-events-auto" : "bg-transparent pointer-events-none") }),
        react_1["default"].createElement("div", { className: "fixed inset-0 z-50 flex items-end justify-center pointer-events-none" },
            react_1["default"].createElement("div", { onClick: function (e) { return e.stopPropagation(); }, className: "absolute justify-items-center pointer-events-auto w-[500px] bg-zinc-950 text-white border-2 shadow-lg transition-all duration-500 ease-in-out " + (isExpanded ? "h-[650px] rounded-2xl top-[41%] translate-y-[-40%] pt-10" : "h-[100px] rounded-t-2xl translate-y-0 pt-8 bottom-[1px]") },
                react_1["default"].createElement(button_1.Button, { tabIndex: -1, className: "absolute left-1/2 transform -translate-x-1/2 bg-zinc-950 hover:bg-zinc-950 opacity-70 transition-opacity hover:opacity-100 focus:outline-none outline-none " + (isExpanded ? "w-9 top-0.5" : "w-7 h-7 top-0.5"), onClick: function () { return setIsExpanded(function (v) { return !v; }); } },
                    react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: isExpanded ? free_solid_svg_icons_1.faAngleDown : free_solid_svg_icons_1.faAngleUp, className: "text-white" })),
                react_1["default"].createElement("div", { className: "justify-items-center w-[500px] h-[585px] border-t-2" },
                    activePage === 0 && (react_1["default"].createElement("div", { className: 'h-[575px]' },
                        !isImageLoaded && !isTimeoutOver ? (react_1["default"].createElement("div", { className: (isExpanded ? "w-[400px] h-[400px] my-2" : "absolute left-2.5 w-[55px] h-[55px] my-1") + " transition-all duration-500" },
                            react_1["default"].createElement("div", { className: "w-full h-full bg-zinc-800 rounded-md animate-pulse" }))) : (react_1["default"].createElement(image_1["default"], { src: image, alt: name, width: isExpanded ? 400 : 55, height: isExpanded ? 400 : 55, className: " rounded-md select-none transition-all duration-500 " + (isExpanded ? "my-2" : "absolute left-2.5 my-1"), onLoad: function () { return setIsImageLoaded(true); }, onError: function () { return setIsImageLoaded(true); } })),
                        react_1["default"].createElement("h2", { className: "text-center px-12 max-w-[400px] " + (isArtist(item) ? isExpanded ? "min-h-[4px]" : "min-h-10" : isExpanded ? "min-h-[50px]" : "min-h-10") }, overriddenTitle ? decodeHTMLEntities(overriddenTitle) : name),
                        react_1["default"].createElement("p", { className: "text-sm text-gray-400 text-center max-w-[400px] truncate " + (isArtist(item) ? isExpanded ? "min-h-4 mb-0" : "min-h-0" : isExpanded ? "min-h-6 mb-1" : "hidden") }, overriddenArtist ? decodeHTMLEntities(overriddenArtist) : isArtist(item) ? "" : currentSong === null || currentSong === void 0 ? void 0 : currentSong.primaryArtists),
                        react_1["default"].createElement("div", null, currentSong && "downloadUrl" in currentSong ? (react_1["default"].createElement("div", { className: 'flex flex-col' },
                            react_1["default"].createElement("div", { className: "select-none " + (isExpanded ? "w-[399px]" : "flex absolute right-10 bottom-2 w-[377px]") },
                                !isImageLoaded && !isTimeoutOver ? (react_1["default"].createElement("div", { className: "w-full h-2 bg-gray-600 rounded-[2px] animate-pulse" })) : (react_1["default"].createElement("div", { ref: progressBarRef, className: "w-full h-2 bg-gray-600 rounded-[2px] relative cursor-pointer", onMouseDown: handleMouseDown },
                                    react_1["default"].createElement("div", { className: "absolute top-0 left-0 h-full bg-white rounded-[2px] transition-[width] duration-100", style: { width: effectiveProgress * 100 + "%" } }),
                                    react_1["default"].createElement("div", { className: "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-gray-400 hover:scale-110 transition-transform", style: { left: "calc(" + effectiveProgress * 100 + "% - 6px)" } }))),
                                react_1["default"].createElement("div", { className: "border border-transparent " + (isExpanded ? "" : "flex absolute right-0 bottom-3") }, !isExpanded && (react_1["default"].createElement("span", { className: "absolute text-xs text-gray-300 ml-2" }, formatTime(currentTime)))),
                                isExpanded && (react_1["default"].createElement("div", { className: "flex justify-between text-sm text-gray-300 pt-1" },
                                    react_1["default"].createElement("span", null, formatTime(currentTime)),
                                    react_1["default"].createElement("span", null, formatTime(duration))))),
                            react_1["default"].createElement("div", { className: "grid grid-flow-col mx-auto my-1 " + (isExpanded ? "" : "hidden") },
                                react_1["default"].createElement("div", { className: "relative flex group items-center h-7" },
                                    volume === 0 ? (react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faVolumeXmark, title: 'Unmute', onClick: toggleMute, className: " text-white h-7 w-7 cursor-pointer" })) : (react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faVolumeHigh, title: 'Mute', onClick: toggleMute, className: "m text-white h-7 w-7 cursor-pointer" })),
                                    react_1["default"].createElement("div", { ref: volumeBarRef, className: "absolute top-10 w-24 h-2" },
                                        react_1["default"].createElement("div", { className: "w-24 bg-gray-600 rounded-[2px] cursor-pointer", onClick: handleVolumeBarClick },
                                            react_1["default"].createElement("div", { className: "absolute top-0 left-0 h-2 bg-white rounded-[2px] transition-[width] duration-100", style: { width: volume * 100 + "%" } }),
                                            react_1["default"].createElement("div", { className: "absolute top-[37%] -translate-y-1/2 w-3 h-3 bg-white rounded-full border border-gray-400 hover:scale-110 transition-transform", style: { left: "calc(" + volume * 100 + "% - 6px)" } })),
                                        react_1["default"].createElement("div", { className: "absolute -right-10 -top-[11px] select-none cursor-default" },
                                            react_1["default"].createElement("span", { className: "text-xs text-gray-300" },
                                                Math.round(volume * 100),
                                                "%")))),
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faRepeat, onClick: repeat, title: 'Repeat', className: "ml-5 h-7 w-7 cursor-pointer " + (isRepeat ? "text-blue-400" : "text-white") }),
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faBackwardStep, onClick: prev, title: 'Previous', className: "mx-5 text-white h-7 w-7 cursor-pointer" }),
                                isPlaying ?
                                    (react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faPause, onClick: togglePlay, title: 'Pause', className: "text-white h-7 w-7 cursor-pointer relative" })) : (react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faPlay, onClick: togglePlay, title: 'Play', className: "text-white h-7 w-7 cursor-pointer relative left-0.5" })),
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faForwardStep, onClick: next, title: 'Next', className: "mx-5 text-white h-7 w-7 cursor-pointer" }),
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faShuffle, onClick: shuffle, title: 'Shuffle', className: "mr-5 h-7 w-7 cursor-pointer " + (isShuffle || pendingShuffle ? "text-blue-400" : "text-white") }),
                                react_1["default"].createElement("a", { href: currentSong.downloadUrl, download: true, target: '_blank', rel: 'noopener noreferrer' },
                                    react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faDownload, title: 'Download', className: "ml-0 text-white h-7 w-7 cursor-pointer" }))))) : isArtistView ? (react_1["default"].createElement(react_1["default"].Fragment, null,
                            fanCount && (react_1["default"].createElement("p", { className: "text-sm text-center text-gray-400 select-none " + (isExpanded ? "border-b border-dashed pb-2" : "border-b border-transparent") },
                                fanCount,
                                " Fans")),
                            react_1["default"].createElement("div", { className: "grid grid-flow-col mx-auto justify-items-center my-3 " + (isExpanded ? "" : "hidden") },
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faBackwardStep, onClick: prevArtist, title: 'Previous', className: "text-white h-7 w-7 cursor-pointer" }),
                                react_1["default"].createElement(react_fontawesome_1.FontAwesomeIcon, { icon: free_solid_svg_icons_1.faForwardStep, onClick: nextArtist, title: 'Next', className: "text-white h-7 w-7 cursor-pointer" })))) : null))),
                    react_1["default"].createElement(AlbumSongs_1["default"], { key: (currentArtist === null || currentArtist === void 0 ? void 0 : currentArtist.id) || "0", currentSong: currentSong, isExpanded: activePage === 1, isHeightExpanded: isHeightExpanded, artistName: (currentArtist === null || currentArtist === void 0 ? void 0 : currentArtist.name) || "", onSongSelect: handleSongSelect }),
                    isExpanded && (react_1["default"].createElement("div", { className: "absolute bottom-2 w-full flex justify-center gap-2" }, [0, 1].map(function (index) { return (react_1["default"].createElement("div", { key: index, onClick: function () { return setActivePage(index); }, className: "w-2.5 h-2.5 rounded-full cursor-pointer " + (activePage === index ? "bg-white" : "bg-gray-400") })); }))))))));
}
exports["default"] = NowPlayingModal;
