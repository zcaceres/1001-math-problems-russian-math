"""Export the app's 18 human-recorded clips. Requires Python 3 and ffmpeg.

Usage: python3 scripts/split-recording.py /path/to/abecedario-recording.m4a

The original recording is read-only and stays outside the repository. Cut times
refer to decoded PCM seconds, not the M4A container's encoder-delay timestamps.
We retain complete letter names and words, with no pitch or tempo changes.
"""

import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
RECIPE = ROOT / "scripts" / "audio-sources" / "recording.json"
CHECKSUMS = RECIPE.with_name("recording-checksums.json")
OUTPUT = ROOT / "public" / "audio"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decode(path, sample_rate):
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-xerror", "-i", str(path),
        "-map", "0:a:0", "-ac", "1", "-ar", str(sample_rate),
        "-f", "f32le", "pipe:1",
    ])
    samples = array("f", raw)
    if sys.byteorder != "little":
        samples.byteswap()
    return samples


def peak_db(samples):
    peak = max(map(abs, samples), default=0)
    return 20 * math.log10(max(peak, 1e-12))


def prepare_clips(recipe, samples):
    rate = recipe["source"]["decodedSampleRate"]
    duration = len(samples) / rate
    if abs(duration - recipe["source"]["decodedDurationSeconds"]) > 0.01:
        raise ValueError("Decoded duration changed; recheck the cut boundaries.")
    if recipe["processing"]["targetPeakDbfs"] > -6:
        raise ValueError("Keep at least 6 dB of headroom before MP3 encoding.")
    prepared = []
    ids = set()
    previous_end = 0
    for clip in recipe["clips"]:
        name, start, end = clip["id"], clip["start"], clip["end"]
        if not re.fullmatch(r"[a-z][a-z0-9-]*", name) or name in ids:
            raise ValueError(f"Invalid or duplicate clip ID: {name}")
        if not all(math.isfinite(value) for value in [start, end]):
            raise ValueError(f"{name}: cut times must be finite")
        if not 0 <= previous_end <= start < end <= duration:
            raise ValueError(f"{name}: overlapping or out-of-range cut")
        if end - start < 0.1 or end - start > 3:
            raise ValueError(f"{name}: unexpected utterance duration")
        ids.add(name)
        previous_end = end
        segment = samples[round(start * rate):round(end * rate)]
        gain = recipe["processing"]["targetPeakDbfs"] - peak_db(segment)
        if gain > recipe["processing"]["maxGainDb"]:
            raise ValueError(f"{name}: clip is too quiet; check the source/cut")
        # Cuts should land in pauses, not on a syllable or word ending.
        edge = round(0.02 * rate)
        if max(peak_db(segment[:edge]), peak_db(segment[-edge:])) > peak_db(segment) - 26:
            raise ValueError(f"{name}: speech may touch a cut boundary")
        prepared.append((clip, segment, gain))
    return prepared


def encode(segment, gain, recipe, destination):
    source_rate = recipe["source"]["decodedSampleRate"]
    settings = recipe["processing"]
    duration = len(segment) / source_rate
    fade = settings["fadeSeconds"]
    if sys.byteorder != "little":
        segment = segment[:]
        segment.byteswap()
    # Raw PCM has no source-device metadata. Only gain and tiny fades in the
    # surrounding pauses are applied; the spoken content is not synthesized.
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-xerror",
        "-f", "f32le", "-ar", str(source_rate), "-ac", "1", "-i", "pipe:0",
        "-af", (
            f"volume={gain:.8f}dB,afade=t=in:d={fade},"
            f"afade=t=out:st={duration - fade}:d={fade},"
            f"aresample={settings['outputSampleRate']},asetpts=N/SR/TB"
        ),
        "-map_metadata", "-1", "-codec:a", "libmp3lame",
        "-b:a", f"{settings['bitrateKbps']}k", str(destination),
    ], input=segment.tobytes(), check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Original M4A recording (not copied into the repo)")
    args = parser.parse_args()
    source = args.source.expanduser().resolve(strict=True)
    recipe = json.loads(RECIPE.read_text())
    if sha256(source) != recipe["source"]["sha256"]:
        raise ValueError("Source checksum mismatch. Recheck the recording and recipe before exporting.")
    samples = decode(source, recipe["source"]["decodedSampleRate"])
    prepared = prepare_clips(recipe, samples)
    checksums = {
        "sourceSha256": recipe["source"]["sha256"],
        "recipeSha256": sha256(RECIPE),
        "clips": {},
    }
    # Render and validate everything before replacing any of the app's audio.
    with tempfile.TemporaryDirectory(prefix=".recording-", dir=OUTPUT.parent) as temporary:
        temporary = Path(temporary)
        for clip, segment, gain in prepared:
            name = clip["id"]
            output = temporary / f"{name}.mp3"
            encode(segment, gain, recipe, output)
            decoded = decode(output, recipe["processing"]["outputSampleRate"])
            duration = len(decoded) / recipe["processing"]["outputSampleRate"]
            peak = peak_db(decoded)
            if abs(duration - (clip["end"] - clip["start"])) > 0.005:
                raise ValueError(f"{name}: encoded duration does not match the cut")
            if not -10 <= peak <= -3:
                raise ValueError(f"{name}: unexpected encoded peak ({peak:.2f} dBFS)")
            checksums["clips"][name] = {
                "sha256": sha256(output),
                "durationSeconds": round(duration, 6),
                "peakDbfs": round(peak, 2),
                "gainDb": round(gain, 2),
            }
            print(f"{name:9} {clip['start']:5.2f}–{clip['end']:5.2f}s  {duration:.2f}s  peak {peak:.1f} dBFS")
        if sha256(RECIPE) != checksums["recipeSha256"]:
            raise ValueError("The recipe changed during export; no app audio was replaced.")
        if sha256(source) != checksums["sourceSha256"]:
            raise ValueError("The source changed during export; no app audio was replaced.")
        OUTPUT.mkdir(parents=True, exist_ok=True)
        for clip, _, _ in prepared:
            (temporary / f"{clip['id']}.mp3").replace(OUTPUT / f"{clip['id']}.mp3")
        CHECKSUMS.write_text(json.dumps(checksums, indent=2) + "\n")
    print(f"Exported {len(prepared)} human-recorded clips. Original recording unchanged.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))
