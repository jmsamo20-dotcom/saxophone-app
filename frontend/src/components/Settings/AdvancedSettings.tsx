"use client";

import { useAppStore } from "@/store/useAppStore";
import { TRANSPOSITION_OPTIONS } from "@/lib/constants";

export default function AdvancedSettings() {
  const {
    transposition, setTransposition,
    simplify, setSimplify,
    tempoEnabled, setTempoEnabled,
    tempoBpm, setTempoBpm,
  } = useAppStore();

  return (
    <div className="space-y-4">
      {/* Transposition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이조 (Transposition)
        </label>
        <div className="flex flex-wrap gap-2">
          {TRANSPOSITION_OPTIONS.map((option) => (
            <button
              key={option.key}
              onClick={() => setTransposition(option.key)}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                min-h-[48px]
                ${transposition === option.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              <span className="block">{option.label}</span>
              <span className="block text-xs opacity-75">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tempo */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={tempoEnabled}
            onChange={(e) => setTempoEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">템포 직접 지정</span>
            <span className="block text-xs text-gray-500">
              기본 120 BPM. 원곡 템포에 맞추면 마디/리듬이 정확해집니다
            </span>
          </div>
        </label>

        {tempoEnabled && (
          <div className="mt-3 ml-8 flex items-center gap-4">
            <input
              type="range"
              min={40}
              max={240}
              value={tempoBpm}
              onChange={(e) => setTempoBpm(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={40}
                max={240}
                value={tempoBpm}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= 40 && v <= 240) setTempoBpm(v);
                }}
                className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded-md"
              />
              <span className="text-sm text-gray-500">BPM</span>
            </div>
          </div>
        )}
      </div>

      {/* Simplification */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={simplify}
          onChange={(e) => setSimplify(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-700">음표 단순화</span>
          <span className="block text-xs text-gray-500">
            짧은 음표를 정리하여 읽기 쉽게 만듭니다
          </span>
        </div>
      </label>
    </div>
  );
}
