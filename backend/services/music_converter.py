from pathlib import Path

import music21
from music21 import converter, instrument, key, meter, tempo

from utils.exceptions import ConversionError

TRANSPOSITION_MAP = {
    "concert": 0,        # Concert pitch (C)
    "alto_eb": 9,        # Alto sax: up major 6th (9 semitones)
    "tenor_bb": 2,       # Tenor sax: up major 2nd (2 semitones)
}


def midi_to_musicxml(
    midi_path: Path,
    output_path: Path,
    transposition: str = "concert",
    tempo_bpm: int | None = None,
) -> tuple[Path, dict]:
    effective_tempo = tempo_bpm if tempo_bpm else 120

    try:
        score = converter.parse(str(midi_path))
    except Exception as e:
        raise ConversionError(f"MIDI 파싱 실패: {e}")

    # Extract the first part (melody)
    parts = score.parts
    if not parts:
        raise ConversionError("MIDI에서 파트를 찾을 수 없습니다.")

    part = parts[0]

    # Create a new clean score
    new_score = music21.stream.Score()
    new_part = music21.stream.Part()

    # Set saxophone instrument
    if transposition == "alto_eb":
        sax = instrument.AltoSaxophone()
    elif transposition == "tenor_bb":
        sax = instrument.TenorSaxophone()
    else:
        sax = instrument.Saxophone()
    new_part.insert(0, sax)

    # Add time signature if missing
    existing_ts = part.recurse().getElementsByClass(meter.TimeSignature)
    if not existing_ts:
        new_part.insert(0, meter.TimeSignature("4/4"))

    # Add tempo (use effective_tempo)
    existing_tempo = part.recurse().getElementsByClass(tempo.MetronomeMark)
    if not existing_tempo:
        new_part.insert(0, tempo.MetronomeMark(number=effective_tempo))
    elif tempo_bpm:
        # User specified tempo: override existing
        new_part.insert(0, tempo.MetronomeMark(number=effective_tempo))

    # Copy notes from the original part
    for element in part.recurse().notesAndRests:
        new_part.append(element)

    # Apply transposition
    semitones = TRANSPOSITION_MAP.get(transposition, 0)
    if semitones != 0:
        new_part = new_part.transpose(semitones)

    # Try key analysis
    try:
        detected_key = new_part.analyze("key")
        new_part.insert(0, detected_key)
    except Exception:
        pass

    new_score.insert(0, new_part)

    # Collect metadata
    all_notes = list(new_part.recurse().notes)
    pitches = [n.pitch.midi for n in all_notes if hasattr(n, "pitch")]

    # Duration calculation: quarterLength / beatsPerMinute * 60
    total_ql = float(new_score.duration.quarterLength)
    duration_seconds = total_ql / effective_tempo * 60.0

    # Build warnings
    warnings: list[str] = []
    note_count = len(all_notes)
    lowest = min(pitches) if pitches else 0
    highest = max(pitches) if pitches else 0

    if note_count < 20:
        warnings.append(
            "인식된 음표가 너무 적습니다. 음질이 선명한 단선율 WAV를 사용해 주세요."
        )
    if duration_seconds < 5:
        warnings.append(
            "음원이 너무 짧아 악보 품질이 낮을 수 있습니다."
        )
    if pitches and (highest - lowest) < 6:
        warnings.append(
            "음역 변화가 작아 인식 결과가 단순하게 나올 수 있습니다."
        )

    metadata = {
        "note_count": note_count,
        "duration_seconds": round(duration_seconds, 1),
        "pitch_range": {
            "lowest": lowest,
            "highest": highest,
        },
        "transposition": transposition,
        "tempo_bpm": effective_tempo,
        "warnings": warnings,
    }

    # Write MusicXML
    try:
        new_score.write("musicxml", fp=str(output_path))
    except Exception as e:
        raise ConversionError(f"MusicXML 쓰기 실패: {e}")

    return output_path, metadata
