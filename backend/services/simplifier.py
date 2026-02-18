from pathlib import Path

import music21
from music21 import converter, note, stream

from utils.exceptions import ConversionError


def simplify_score(
    musicxml_path: Path,
    output_path: Path,
    minimum_note_length: float = 0.25,
) -> Path:
    """
    Simplify a MusicXML score by quantizing durations and removing very short notes.

    Args:
        musicxml_path: Input MusicXML file path
        output_path: Output MusicXML file path
        minimum_note_length: Minimum quarterLength to keep (default 0.25 = 16th note).
                             Use 0.125 for less aggressive filtering.
    """
    try:
        score = converter.parse(str(musicxml_path))
    except Exception as e:
        raise ConversionError(f"MusicXML 파싱 실패: {e}")

    for part in score.parts:
        new_elements = []
        for element in part.recurse().notesAndRests:
            if isinstance(element, note.Note):
                # Quantize durations to nearest standard value
                ql = element.quarterLength
                if ql < 0.375:
                    element.quarterLength = 0.25    # 16th note
                elif ql < 0.75:
                    element.quarterLength = 0.5     # 8th note
                elif ql < 1.5:
                    element.quarterLength = 1.0     # quarter
                elif ql < 3.0:
                    element.quarterLength = 2.0     # half
                else:
                    element.quarterLength = 4.0     # whole

            elif isinstance(element, note.Rest):
                # Remove very short rests (merge into surrounding notes)
                if element.quarterLength < minimum_note_length:
                    continue

            new_elements.append(element)

        # Remove notes shorter than minimum_note_length
        filtered = []
        for el in new_elements:
            if isinstance(el, note.Note) and el.quarterLength < minimum_note_length:
                continue
            filtered.append(el)

        # Replace part content
        part.elements = []
        measure = stream.Measure()
        current_ql = 0.0
        for el in filtered:
            if current_ql + el.quarterLength > 4.0:
                part.append(measure)
                measure = stream.Measure()
                current_ql = 0.0
            measure.append(el)
            current_ql += el.quarterLength
        if measure.elements:
            part.append(measure)

    try:
        score.write("musicxml", fp=str(output_path))
    except Exception as e:
        raise ConversionError(f"단순화된 MusicXML 쓰기 실패: {e}")

    return output_path
