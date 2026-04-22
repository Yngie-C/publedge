import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

interface Habit {
  name: string;
  checks: boolean[];
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function parseHabits(raw: string): Habit[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Habit[];
  } catch {
    // fall through
  }
  return [{ name: "습관 1", checks: [false, false, false, false, false, false, false] }];
}

export function HabitTrackerNodeView({ node, updateAttributes }: NodeViewProps) {
  const habits = parseHabits(node.attrs.habits as string);

  function setHabits(next: Habit[]) {
    updateAttributes({ habits: JSON.stringify(next) });
  }

  function updateName(index: number, name: string) {
    setHabits(habits.map((h, i) => (i === index ? { ...h, name } : h)));
  }

  function toggleCheck(habitIndex: number, dayIndex: number) {
    setHabits(
      habits.map((h, i) =>
        i === habitIndex
          ? {
              ...h,
              checks: h.checks.map((c, j) => (j === dayIndex ? !c : c)),
            }
          : h
      )
    );
  }

  function addHabit() {
    setHabits([
      ...habits,
      {
        name: `습관 ${habits.length + 1}`,
        checks: [false, false, false, false, false, false, false],
      },
    ]);
  }

  function removeHabit(index: number) {
    if (habits.length === 1) return;
    setHabits(habits.filter((_, i) => i !== index));
  }

  return (
    <NodeViewWrapper
      className="template-habit-tracker my-3 rounded-lg border border-gray-200 bg-white p-4"
      data-template-type="habitTracker"
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        습관 트래커
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">
                습관
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="w-10 border border-gray-200 bg-gray-50 px-1 py-2 text-center text-xs font-semibold text-gray-600"
                >
                  {day}
                </th>
              ))}
              <th className="w-8 border border-gray-200 bg-gray-50 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {habits.map((habit, hi) => (
              <tr key={hi}>
                <td className="border border-gray-200 px-2 py-1">
                  <input
                    type="text"
                    value={habit.name}
                    onChange={(e) => updateName(hi, e.target.value)}
                    className="w-full border-none bg-transparent text-sm text-gray-800 outline-none"
                    placeholder="습관 이름"
                  />
                </td>
                {habit.checks.map((checked, di) => (
                  <td
                    key={di}
                    className="border border-gray-200 px-1 py-1 text-center"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCheck(hi, di)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-blue-500"
                    />
                  </td>
                ))}
                <td className="border border-gray-200 px-1 py-1 text-center">
                  <button
                    onClick={() => removeHabit(hi)}
                    className="text-gray-300 hover:text-red-400"
                    title="삭제"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addHabit}
        className="mt-3 flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
      >
        <span className="text-base font-bold">+</span> 습관 추가
      </button>
    </NodeViewWrapper>
  );
}
