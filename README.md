> # ⚠️ This project has moved
>
> **YouTube No Distractions is now [YouTube Toolkit](https://github.com/dnl-gentile/yt-toolkit).**
>
> Everything here still works, but development happens in the new repository. No
> Distractions carried over intact — it is now one feature of a larger extension.
>
> ### → **[Get YouTube Toolkit](https://github.com/dnl-gentile/yt-toolkit)**
>
> This repository stays up for history and for anyone still running the old version.
> It receives no further updates.

---

# YouTube No Distractions

> **A distraction-free YouTube experience: no homepage noise, no recommendations, no comments — just the video you want.**

<img width="1440" height="900" alt="YouTube with No Distractions enabled" src="https://github.com/user-attachments/assets/344e62a0-50b6-4598-80ac-8dc2121f02d7" />

## What replaced it

[**YouTube Toolkit**](https://github.com/dnl-gentile/yt-toolkit) keeps everything this
extension did and adds the features that came out of actually living with it.

The original problem was the rabbit hole — opening YouTube for one thing and leaving with
forty tabs. No Distractions solved that. But the story below mentions a second habit, in
passing: *watching things at 3× just to get through them.* That one turned out to need a
tool of its own.

### 🎚️ Pace control based on the transcript

The headline feature, and the reason the project needed a new name.

The extension reads the video's captions, measures **how fast the person is actually
talking**, and moves the playback rate to hold a words-per-minute target you choose. 2×
describes the file; WPM describes your experience of it.

A slow lecturer at 180 WPM plays near 2×. A fast presenter plays below 1×. It adjusts
continuously as the speaking rate changes *within* a single video — so you stop riding the
speed control, and you stop finishing videos you did not actually absorb.

### ✂️ Trim silence

Gaps of 1.2 s or more are accelerated rather than skipped — no seeking, so no stutter —
and it snaps back to your pace the instant someone speaks again. Lecture recordings get
noticeably shorter.

### 🕐 Adjusted watch clock

`12:41 / 31:20 (57:04)` — how long the video will really take *you* at your settings, with
the original length in parentheses. Stable, not a flickering estimate.

### 💬 Dual subtitles

Two languages at once, stacked and independently draggable, each with its own color. The
original in one line and your own language in the other. Auto-translations included, and
the same language cannot occupy both slots.

### 🖍️ Word highlight and center word

The word being spoken lights up while the rest of the line dims — which is what makes a
fast pace target readable at all. Or switch to **Center word**: Spritz-style RSVP, one word
at a time pinned to a marker at the center of the player.

### 🔇 No Distractions

Unchanged in spirit, better in the details. Same masthead toggle, same homepage redirect to
the quiet search page. The refinements are the ones that came from using it every day:
the account menu, chapters and the transcript panel now always open, and it no longer
freezes the tab on a logo click.

---

**All of it is optional.** If you only ever want No Distractions, turn the rest off and you
have this extension, maintained.

## Moving over

1. Remove this extension at `chrome://extensions`
2. Install [YouTube Toolkit](https://github.com/dnl-gentile/yt-toolkit#install) — same
   five steps, about a minute
3. Turn on No Distractions from the masthead

Your old settings do not carry over; there are only a few and the defaults are sensible.
The new extension keeps its own preferences the same way, in Chrome's storage.

Both can technically be installed at once, but do not — they modify the same page elements
and will fight each other.

## 💭 Why I built this

*Kept because it is still the reason both extensions exist.*

I built this extension because YouTube became too overwhelming. Many times I found myself
opening YouTube and clicking on almost all the recommended videos in new tabs, ending up
with thousands of tabs open with videos I felt I "had to watch." Sometimes I'd watch them
at 3x speed just to finish them because I felt they were important somehow, and I didn't
want to miss anything.

I didn't want that anymore. I wanted to go on YouTube, search for what I was actually
looking for, watch it, and move on — without the endless rabbit hole of recommendations,
trending videos, shorts, and comments pulling me in different directions.

This tool makes YouTube calm again. It's for anyone who wants to use YouTube
intentionally, not compulsively.

## ✨ What this version does

Preserved for reference. All of it exists in
[YouTube Toolkit](https://github.com/dnl-gentile/yt-toolkit).

**Homepage redirection** — `youtube.com` and `youtube.com/feed` redirect to a clean search
bar. Toggle on and off with one click.

**Video page** — theater mode on automatically; recommendations sidebar, comments and
end-screen recommendations removed; distracting action buttons hidden (the like button
stays).

**Navigation bar** — Create button and notification bell hidden; a toggle button added.

<details>
<summary><b>Installing this old version anyway</b></summary>

You probably want [YouTube Toolkit](https://github.com/dnl-gentile/yt-toolkit) instead. But
if you specifically need this one:

1. Download `yt-no-distractions-ext.zip` from
   [Releases](https://github.com/dnl-gentile/yt-no-distractions-ext/releases), or clone:

   ```bash
   git clone https://github.com/dnl-gentile/yt-no-distractions-ext.git
   ```

2. Extract it somewhere permanent — Chrome loads it from that folder on every start
3. Open `chrome://extensions`
4. Enable **Developer mode** (top right)
5. **Load unpacked** → select the folder containing `manifest.json`

Toggle the mode with the do-not-disturb icon in YouTube's navigation bar, or by clicking
the extension icon in Chrome's toolbar.

**Permissions:** `storage` to remember your preference, `webNavigation` to catch a homepage
load and redirect it.

**Known limitations, never fixed here:** some Shorts elements are not fully hidden;
asynchronously loaded elements can flash before being hidden; theater mode can take a
moment; the end screen may appear briefly. These are among the things the rewrite
addressed.

</details>

## Issues and questions

Please open them on the **[new repository](https://github.com/dnl-gentile/yt-toolkit/issues)**.
Issues here are no longer monitored — if the problem is in code that carried over, it is
better fixed where the code now lives.

## 📝 License

GNU General Public License v3.0 or later. See [LICENSE](LICENSE).

You are free to use, modify and distribute it; distributed modifications must stay under
the same license and ship their source. No warranty is provided.

YouTube Toolkit continues under the same license.

---

Not affiliated with or endorsed by YouTube or Google. An independent project to make
YouTube a calmer place to be.
