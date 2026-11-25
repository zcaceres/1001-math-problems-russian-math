"""Regenerate the bundled PROTOTYPE audio on macOS. Requires `say` and ffmpeg.

Words and vowels use the local es-MX Paulina voice. Consonants are extracted
from pinned recordings of that same voice, never synthesized from oscillators
or noise. These are still unreviewed placeholders, not finished teaching audio.

Use --consonants-only to rebuild just the four consonants without needing `say`.
No keys, network services, or runtime speech-synthesis dependencies are used.
"""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

OUTPUT = Path(__file__).resolve().parents[1] / "public" / "audio"
SOURCES = Path(__file__).resolve().parent / "audio-sources"
RATE = 44100
WORDS = {
    "abeja": "abeja", "elefante": "elefante", "iglu": "iglú",
    "oso": "oso", "uvas": "uvas", "manzana": "manzana",
    "pato": "pato", "sol": "sol", "luna": "luna",
}


def encode(source, destination):
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
        "-af", "loudnorm=I=-20:TP=-3:LRA=7,apad=pad_dur=0.15",
        "-ar", str(RATE), "-ac", "1", "-codec:a", "libmp3lame",
        "-b:a", "96k", str(destination),
    ], check=True)


def render_consonants():
    """Keep real speech timbre and exclude neighboring vowels from each clip.

    Source hashes pin the exact recordings used to select the phoneme boundaries.
    Do not regenerate their source speech blindly: a different OS voice can shift
    those boundaries. Inspect the source and update its crop when replacing it.
    """
    manifest = json.loads((SOURCES / "consonants.json").read_text())
    for letter, clip in manifest["clips"].items():
        source = SOURCES / clip["source"]
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != clip["sha256"]:
            raise ValueError(f"{letter}: speech source changed; recheck its phoneme boundaries")
        duration = (clip["end"] - clip["start"]) / clip["tempo"]
        filters = [
            f"atrim=start={clip['start']}:end={clip['end']}",
            "asetpts=PTS-STARTPTS",
            # Small, pitch-preserving slowdown for the short /s/ and /l/ onsets.
            # The /p/ release is not stretched or turned into a voiced syllable.
            f"atempo={clip['tempo']}",
            "afade=t=in:d=0.003",
            f"afade=t=out:st={duration - 0.003}:d=0.003",
            # Give the loudness meter a full window, then remove the extra tail.
            "apad=whole_dur=0.6",
            "loudnorm=I=-20:TP=-6:LRA=7",
            f"atrim=end={duration + 0.15}",
            "adelay=60:all=1",
            "asetpts=N/SR/TB",
        ]
        subprocess.run([
            "ffmpeg", "-y", "-xerror", "-loglevel", "error", "-i", str(source),
            "-af", ",".join(filters), "-ar", str(RATE), "-ac", "1",
            "-codec:a", "libmp3lame", "-b:a", "96k",
            str(OUTPUT / f"{letter}.mp3"),
        ], check=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--consonants-only", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    if not args.consonants_only:
        with tempfile.TemporaryDirectory() as temporary:
            temporary = Path(temporary)
            for name, text in {**WORDS, **{vowel: vowel for vowel in "aeiou"}}.items():
                source = temporary / f"{name}.aiff"
                subprocess.run([
                    "say", "-v", "Paulina (Spanish (Mexico))", "-r", "135",
                    "-o", str(source), text,
                ], check=True)
                encode(source, OUTPUT / f"{name}.mp3")
    render_consonants()
    count = 4 if args.consonants_only else len(WORDS) + 9
    print(f"Created {count} prototype audio files in {OUTPUT}")


if __name__ == "__main__":
    main()
