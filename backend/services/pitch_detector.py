from pathlib import Path

from basic_pitch.inference import predict
from basic_pitch import ICASSP_2022_MODEL_PATH

from utils.exceptions import PitchDetectionError
from config import PITCH_ONSET_THRESHOLD, PITCH_FRAME_THRESHOLD, PITCH_MIN_NOTE_LENGTH


def detect_pitch(
    wav_path: Path,
    midi_output_path: Path,
    tempo_bpm: int | None = None,
) -> Path:
    effective_tempo = float(tempo_bpm) if tempo_bpm else 120.0

    try:
        model_output, midi_data, note_events = predict(
            str(wav_path),
            model_or_model_path=ICASSP_2022_MODEL_PATH,
            onset_threshold=PITCH_ONSET_THRESHOLD,
            frame_threshold=PITCH_FRAME_THRESHOLD,
            minimum_note_length=PITCH_MIN_NOTE_LENGTH,
            midi_tempo=effective_tempo,
        )
    except Exception as e:
        raise PitchDetectionError(str(e))

    if not midi_data.instruments or not midi_data.instruments[0].notes:
        raise PitchDetectionError("인식된 음표가 없습니다. 더 선명한 음원을 사용해 주세요.")

    midi_data.write(str(midi_output_path))
    return midi_output_path
