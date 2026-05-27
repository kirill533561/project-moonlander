"use client";

import { useState, useCallback, useMemo } from "react";
import { useCloudStorage } from "@/lib/use-cloud-storage";
import { useDemoMode } from "@/components/layout/header";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──

interface Plan {
  id: string;
  name: string;
  createdAt: string;
}

interface Bucket {
  id: string;
  planId: string;
  name: string;
  order: number;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  bucketId: string;
  planId: string;
  title: string;
  description: string;
  priority: "urgent" | "important" | "medium" | "low";
  progress: "not-started" | "in-progress" | "completed";
  dueDate: string | null;
  labels: string[];
  checklist: ChecklistItem[];
  notes: string;
  order: number;
  createdAt: string;
}

// ── Helpers ──

const uid = () => Math.random().toString(36).slice(2, 9);

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ff4444",
  important: "#ffd700",
  medium: "#00ffff",
  low: "#6b7280",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "URGENT",
  important: "IMPORTANT",
  medium: "MEDIUM",
  low: "LOW",
};

const PROGRESS_LABELS: Record<string, string> = {
  "not-started": "NOT STARTED",
  "in-progress": "IN PROGRESS",
  completed: "COMPLETED",
};

const PROGRESS_COLORS: Record<string, string> = {
  "not-started": "#6b7280",
  "in-progress": "#00ffff",
  completed: "#00ff41",
};

const DEFAULT_LABELS: Label[] = [
  { id: "l1", name: "BUG", color: "#ff4444" },
  { id: "l2", name: "FEATURE", color: "#00ffff" },
  { id: "l3", name: "PERSONAL", color: "#b967ff" },
  { id: "l4", name: "URGENT", color: "#ffd700" },
  { id: "l5", name: "RESEARCH", color: "#00ff88" },
  { id: "l6", name: "DESIGN", color: "#ff69b4" },
];

const CHART_COLORS = ["#00ffff", "#ff4444", "#ffd700", "#00ff41", "#b967ff", "#ff69b4", "#ff8844"];

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}

// ── Sortable Task Card ──

function SortableTaskCard({
  task,
  labels,
  onClick,
}: {
  task: Task;
  labels: Label[];
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} labels={labels} onClick={onClick} />
    </div>
  );
}

function TaskCard({
  task,
  labels,
  onClick,
}: {
  task: Task;
  labels: Label[];
  onClick: () => void;
}) {
  const overdue = isOverdue(task.dueDate);
  const checkDone = task.checklist.filter((c) => c.done).length;
  const checkTotal = task.checklist.length;
  const taskLabels = labels.filter((l) => task.labels.includes(l.id));

  return (
    <button
      onClick={onClick}
      className="w-full text-left pixel-card p-3 hover:border-pixel-cyan transition-colors group"
    >
      {/* Labels */}
      {taskLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {taskLabels.map((l) => (
            <span
              key={l.id}
              className="font-pixel text-[5px] px-1.5 py-0.5"
              style={{ background: l.color + "25", color: l.color }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p
        className={`font-pixel-body text-base leading-tight mb-1.5 ${
          task.progress === "completed"
            ? "text-gray-500 line-through"
            : "text-white"
        }`}
      >
        {task.title}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Priority */}
        <span
          className="font-pixel text-[5px] px-1 py-0.5"
          style={{
            color: PRIORITY_COLORS[task.priority],
            border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>

        {/* Progress */}
        <span
          className="font-pixel text-[5px]"
          style={{ color: PROGRESS_COLORS[task.progress] }}
        >
          {task.progress === "in-progress" && "▶ "}
          {task.progress === "completed" && "✓ "}
          {PROGRESS_LABELS[task.progress]}
        </span>

        {/* Due date */}
        {task.dueDate && (
          <span
            className={`font-pixel text-[5px] ${
              overdue ? "text-pixel-red" : "text-gray-500"
            }`}
          >
            {overdue && "⚠ "}
            {task.dueDate}
          </span>
        )}

        {/* Checklist count */}
        {checkTotal > 0 && (
          <span
            className={`font-pixel text-[5px] ${
              checkDone === checkTotal ? "text-pixel-green" : "text-gray-500"
            }`}
          >
            ✓{checkDone}/{checkTotal}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Task Detail Modal ──

function TaskModal({
  task,
  buckets,
  labels,
  onUpdate,
  onDelete,
  onClose,
}: {
  task: Task;
  buckets: Bucket[];
  labels: Label[];
  onUpdate: (t: Task) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [t, setT] = useState<Task>({ ...task });
  const [newCheckItem, setNewCheckItem] = useState("");

  const save = (patch: Partial<Task>) => {
    const updated = { ...t, ...patch };
    setT(updated);
    onUpdate(updated);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto p-3 md:p-6 md:items-center"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-xl my-4 pixel-card p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close + Delete */}
        <div className="flex justify-between items-start mb-4">
          <input
            className="font-pixel text-[10px] md:text-xs text-pixel-cyan bg-transparent border-b-2 border-transparent hover:border-[#2a2a4a] focus:border-pixel-cyan outline-none w-full mr-4 pb-1"
            value={t.title}
            onChange={(e) => save({ title: e.target.value })}
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onDelete}
              className="font-pixel text-[7px] text-pixel-red hover:text-red-300 px-2 py-1 border border-pixel-red/30 hover:border-pixel-red transition-colors"
            >
              DELETE
            </button>
            <button
              onClick={onClose}
              className="font-pixel-body text-xl text-gray-500 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* Bucket */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div>
            <p className="font-pixel text-[6px] text-gray-500 mb-1">BUCKET</p>
            <select
              className="w-full bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1.5 outline-none focus:border-pixel-cyan"
              value={t.bucketId}
              onChange={(e) => save({ bucketId: e.target.value })}
            >
              {buckets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-pixel text-[6px] text-gray-500 mb-1">PRIORITY</p>
            <select
              className="w-full bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1.5 outline-none focus:border-pixel-cyan"
              value={t.priority}
              onChange={(e) =>
                save({ priority: e.target.value as Task["priority"] })
              }
            >
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="font-pixel text-[6px] text-gray-500 mb-1">PROGRESS</p>
            <select
              className="w-full bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1.5 outline-none focus:border-pixel-cyan"
              value={t.progress}
              onChange={(e) =>
                save({ progress: e.target.value as Task["progress"] })
              }
            >
              {Object.entries(PROGRESS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due date */}
        <div className="mb-4">
          <p className="font-pixel text-[6px] text-gray-500 mb-1">DUE DATE</p>
          <input
            type="date"
            className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1.5 outline-none focus:border-pixel-cyan"
            value={t.dueDate || ""}
            onChange={(e) => save({ dueDate: e.target.value || null })}
          />
          {t.dueDate && (
            <button
              onClick={() => save({ dueDate: null })}
              className="ml-2 font-pixel text-[6px] text-gray-500 hover:text-pixel-red"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Labels */}
        <div className="mb-4">
          <p className="font-pixel text-[6px] text-gray-500 mb-1">LABELS</p>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const active = t.labels.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() =>
                    save({
                      labels: active
                        ? t.labels.filter((id) => id !== l.id)
                        : [...t.labels, l.id],
                    })
                  }
                  className="font-pixel text-[6px] px-2 py-1 border transition-colors"
                  style={{
                    color: active ? l.color : "#6b7280",
                    borderColor: active ? l.color : "#2a2a4a",
                    background: active ? l.color + "15" : "transparent",
                  }}
                >
                  {l.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="font-pixel text-[6px] text-gray-500 mb-1">DESCRIPTION</p>
          <textarea
            className="w-full bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 outline-none focus:border-pixel-cyan min-h-[60px] resize-y"
            value={t.description}
            onChange={(e) => save({ description: e.target.value })}
            placeholder="Add description..."
          />
        </div>

        {/* Checklist */}
        <div className="mb-4">
          <p className="font-pixel text-[6px] text-gray-500 mb-1">
            CHECKLIST{" "}
            {t.checklist.length > 0 &&
              `(${t.checklist.filter((c) => c.done).length}/${t.checklist.length})`}
          </p>
          {t.checklist.length > 0 && (
            <div className="h-1.5 bg-[#1a1a3a] border border-[#2a2a4a] mb-2">
              <div
                className="h-full bg-pixel-green transition-all"
                style={{
                  width: `${(t.checklist.filter((c) => c.done).length / t.checklist.length) * 100}%`,
                }}
              />
            </div>
          )}
          <div className="flex flex-col gap-1 mb-2">
            {t.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 group">
                <button
                  onClick={() =>
                    save({
                      checklist: t.checklist.map((c) =>
                        c.id === item.id ? { ...c, done: !c.done } : c
                      ),
                    })
                  }
                  className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.done
                      ? "border-pixel-green text-pixel-green"
                      : "border-[#2a2a4a] text-transparent hover:border-gray-500"
                  }`}
                >
                  ✓
                </button>
                <span
                  className={`font-pixel-body text-sm flex-1 ${
                    item.done ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {item.text}
                </span>
                <button
                  onClick={() =>
                    save({
                      checklist: t.checklist.filter((c) => c.id !== item.id),
                    })
                  }
                  className="font-pixel-body text-xs text-gray-600 hover:text-pixel-red opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newCheckItem.trim()) return;
              save({
                checklist: [
                  ...t.checklist,
                  { id: uid(), text: newCheckItem.trim(), done: false },
                ],
              });
              setNewCheckItem("");
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1 outline-none focus:border-pixel-cyan"
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              placeholder="Add item..."
            />
            <button
              type="submit"
              className="pixel-btn font-pixel text-[7px] px-3"
            >
              ADD
            </button>
          </form>
        </div>

        {/* Notes */}
        <div>
          <p className="font-pixel text-[6px] text-gray-500 mb-1">NOTES</p>
          <textarea
            className="w-full bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-3 py-2 outline-none focus:border-pixel-cyan min-h-[50px] resize-y"
            value={t.notes}
            onChange={(e) => save({ notes: e.target.value })}
            placeholder="Add notes..."
          />
        </div>
      </div>
    </div>
  );
}

// ── Charts View ──

function ChartsView({
  tasks,
  buckets,
  labels,
}: {
  tasks: Task[];
  buckets: Bucket[];
  labels: Label[];
}) {
  const byProgress = Object.entries(PROGRESS_LABELS).map(([k, v]) => ({
    name: v,
    value: tasks.filter((t) => t.progress === k).length,
    color: PROGRESS_COLORS[k],
  }));

  const byPriority = Object.entries(PRIORITY_LABELS).map(([k, v]) => ({
    name: v,
    value: tasks.filter((t) => t.priority === k).length,
    color: PRIORITY_COLORS[k],
  }));

  const byBucket = buckets.map((b, i) => ({
    name: b.name.length > 10 ? b.name.slice(0, 10) + ".." : b.name,
    total: tasks.filter((t) => t.bucketId === b.id).length,
    done: tasks.filter((t) => t.bucketId === b.id && t.progress === "completed")
      .length,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const overdue = tasks.filter(
    (t) => isOverdue(t.dueDate) && t.progress !== "completed"
  ).length;

  const totalChecklist = tasks.reduce((a, t) => a + t.checklist.length, 0);
  const doneChecklist = tasks.reduce(
    (a, t) => a + t.checklist.filter((c) => c.done).length,
    0
  );

  const completionPct =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.progress === "completed").length /
            tasks.length) *
            100
        )
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Summary tiles */}
      <div className="pixel-card p-3 text-center">
        <p className="font-pixel text-[7px] text-gray-500 mb-1">TOTAL TASKS</p>
        <p className="font-pixel text-lg text-pixel-cyan">{tasks.length}</p>
      </div>
      <div className="pixel-card p-3 text-center">
        <p className="font-pixel text-[7px] text-gray-500 mb-1">COMPLETED</p>
        <p className="font-pixel text-lg text-pixel-green">{completionPct}%</p>
      </div>
      <div className="pixel-card p-3 text-center">
        <p className="font-pixel text-[7px] text-gray-500 mb-1">OVERDUE</p>
        <p
          className={`font-pixel text-lg ${overdue > 0 ? "text-pixel-red" : "text-gray-500"}`}
        >
          {overdue}
        </p>
      </div>
      <div className="pixel-card p-3 text-center">
        <p className="font-pixel text-[7px] text-gray-500 mb-1">CHECKLIST</p>
        <p className="font-pixel text-lg text-pixel-purple">
          {doneChecklist}/{totalChecklist}
        </p>
      </div>

      {/* Progress pie */}
      <div className="pixel-card p-3 col-span-2">
        <p className="font-pixel text-[7px] text-gray-500 mb-2">BY STATUS</p>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={byProgress.filter((d) => d.value > 0)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              strokeWidth={2}
              stroke="#0a0a1a"
            >
              {byProgress
                .filter((d) => d.value > 0)
                .map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1a1a3a",
                border: "2px solid #2a2a4a",
                fontFamily: "VT323",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-2 justify-center mt-1">
          {byProgress.map((d) => (
            <span
              key={d.name}
              className="font-pixel text-[5px] flex items-center gap-1"
            >
              <span
                className="w-2 h-2 inline-block"
                style={{ background: d.color }}
              />
              {d.name} ({d.value})
            </span>
          ))}
        </div>
      </div>

      {/* Priority bar */}
      <div className="pixel-card p-3 col-span-2">
        <p className="font-pixel text-[7px] text-gray-500 mb-2">BY PRIORITY</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byPriority.filter((d) => d.value > 0)}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 8, fontFamily: "Press Start 2P", fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "VT323", fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a3a",
                border: "2px solid #2a2a4a",
                fontFamily: "VT323",
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {byPriority
                .filter((d) => d.value > 0)
                .map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* By bucket */}
      <div className="pixel-card p-3 col-span-2 md:col-span-4">
        <p className="font-pixel text-[7px] text-gray-500 mb-2">BY BUCKET</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byBucket}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 8, fontFamily: "Press Start 2P", fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fontFamily: "VT323", fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1a3a",
                border: "2px solid #2a2a4a",
                fontFamily: "VT323",
              }}
            />
            <Bar dataKey="total" fill="#2a2a4a" radius={[2, 2, 0, 0]} name="Total" />
            <Bar dataKey="done" fill="#00ff41" radius={[2, 2, 0, 0]} name="Done" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main Page ──

const DEFAULT_PLAN: Plan = {
  id: "default",
  name: "MISSION PLAN",
  createdAt: new Date().toISOString(),
};

const DEFAULT_BUCKETS: Bucket[] = [
  { id: "b1", planId: "default", name: "TO DO", order: 0 },
  { id: "b2", planId: "default", name: "IN PROGRESS", order: 1 },
  { id: "b3", planId: "default", name: "DONE", order: 2 },
];

export default function PlannerPage() {
  const { demoMode } = useDemoMode();
  const [plans, setPlans] = useCloudStorage<Plan[]>("ml-planner-plans", [DEFAULT_PLAN]);
  const [buckets, setBuckets] = useCloudStorage<Bucket[]>("ml-planner-buckets", DEFAULT_BUCKETS);
  const [tasks, setTasks] = useCloudStorage<Task[]>("ml-planner-tasks", []);
  const [labels, setLabels] = useCloudStorage<Label[]>("ml-planner-labels", DEFAULT_LABELS);
  const [activePlanId, setActivePlanId] = useCloudStorage<string>("ml-planner-active", "default");

  const [view, setView] = useState<"board" | "charts">("board");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [newPlanName, setNewPlanName] = useState("");
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editBucketId, setEditBucketId] = useState<string | null>(null);
  const [editBucketName, setEditBucketName] = useState("");
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterLabel, setFilterLabel] = useState<string>("all");
  const [filterProgress, setFilterProgress] = useState<string>("all");
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#00ffff");

  const plan = plans.find((p) => p.id === activePlanId) || plans[0];
  const planBuckets = useMemo(
    () =>
      buckets
        .filter((b) => b.planId === (plan?.id ?? ""))
        .sort((a, b) => a.order - b.order),
    [buckets, plan]
  );
  const planTasks = useMemo(
    () => tasks.filter((t) => t.planId === (plan?.id ?? "")),
    [tasks, plan]
  );

  const filteredTasks = useMemo(() => {
    return planTasks.filter((t) => {
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterLabel !== "all" && !t.labels.includes(filterLabel)) return false;
      if (filterProgress !== "all" && t.progress !== filterProgress) return false;
      return true;
    });
  }, [planTasks, filterPriority, filterLabel, filterProgress]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Plan CRUD ──

  const createPlan = () => {
    if (!newPlanName.trim()) return;
    const id = uid();
    setPlans([...plans, { id, name: newPlanName.trim().toUpperCase(), createdAt: new Date().toISOString() }]);
    setBuckets([
      ...buckets,
      { id: uid(), planId: id, name: "TO DO", order: 0 },
      { id: uid(), planId: id, name: "IN PROGRESS", order: 1 },
      { id: uid(), planId: id, name: "DONE", order: 2 },
    ]);
    setActivePlanId(id);
    setNewPlanName("");
    setShowNewPlan(false);
  };

  const deletePlan = (id: string) => {
    if (plans.length <= 1) return;
    setPlans(plans.filter((p) => p.id !== id));
    setBuckets(buckets.filter((b) => b.planId !== id));
    setTasks(tasks.filter((t) => t.planId !== id));
    if (activePlanId === id) {
      setActivePlanId(plans.find((p) => p.id !== id)?.id ?? "");
    }
  };

  // ── Bucket CRUD ──

  const addBucket = () => {
    if (!plan) return;
    const maxOrder = Math.max(0, ...planBuckets.map((b) => b.order));
    setBuckets([
      ...buckets,
      { id: uid(), planId: plan.id, name: "NEW BUCKET", order: maxOrder + 1 },
    ]);
  };

  const renameBucket = (id: string, name: string) => {
    setBuckets(
      buckets.map((b) => (b.id === id ? { ...b, name: name.toUpperCase() } : b))
    );
    setEditBucketId(null);
  };

  const deleteBucket = (id: string) => {
    setBuckets(buckets.filter((b) => b.id !== id));
    setTasks(tasks.filter((t) => t.bucketId !== id));
  };

  // ── Task CRUD ──

  const addTask = (bucketId: string) => {
    if (!plan) return;
    const order =
      Math.max(
        0,
        ...tasks.filter((t) => t.bucketId === bucketId).map((t) => t.order)
      ) + 1;
    const task: Task = {
      id: uid(),
      bucketId,
      planId: plan.id,
      title: "New task",
      description: "",
      priority: "medium",
      progress: "not-started",
      dueDate: null,
      labels: [],
      checklist: [],
      notes: "",
      order,
      createdAt: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setEditTask(task);
  };

  const updateTask = useCallback(
    (updated: Task) => {
      setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
      setEditTask(updated);
    },
    [tasks, setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks(tasks.filter((t) => t.id !== id));
      setEditTask(null);
    },
    [tasks, setTasks]
  );

  // ── DnD handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    setDragActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overTask = tasks.find((t) => t.id === over.id);
    const overBucketId = overTask
      ? overTask.bucketId
      : planBuckets.find((b) => b.id === over.id)?.id;

    if (overBucketId && activeTask.bucketId !== overBucketId) {
      setTasks(
        tasks.map((t) =>
          t.id === active.id ? { ...t, bucketId: overBucketId } : t
        )
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (activeTask && overTask && activeTask.bucketId === overTask.bucketId) {
      const bucketTasks = tasks
        .filter((t) => t.bucketId === activeTask.bucketId)
        .sort((a, b) => a.order - b.order);
      const oldIdx = bucketTasks.findIndex((t) => t.id === active.id);
      const newIdx = bucketTasks.findIndex((t) => t.id === over.id);
      const reordered = arrayMove(bucketTasks, oldIdx, newIdx).map((t, i) => ({
        ...t,
        order: i,
      }));
      setTasks(
        tasks.map(
          (t) => reordered.find((r) => r.id === t.id) || t
        )
      );
    }
  };

  const draggedTask = dragActiveId
    ? tasks.find((t) => t.id === dragActiveId)
    : null;

  // ── Label management ──

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    setLabels([
      ...labels,
      { id: uid(), name: newLabelName.trim().toUpperCase(), color: newLabelColor },
    ]);
    setNewLabelName("");
  };

  const deleteLabel = (id: string) => {
    setLabels(labels.filter((l) => l.id !== id));
    setTasks(
      tasks.map((t) => ({
        ...t,
        labels: t.labels.filter((lid) => lid !== id),
      }))
    );
  };

  return (
    <div>
      <h1 className="font-pixel text-sm md:text-base text-pixel-cyan mb-4">
        MISSION PLANNER
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Plan selector */}
        <select
          className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel text-[7px] px-2 py-2 outline-none focus:border-pixel-cyan"
          value={activePlanId}
          onChange={(e) => setActivePlanId(e.target.value)}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {showNewPlan ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createPlan();
            }}
            className="flex gap-1"
          >
            <input
              autoFocus
              className="bg-[#1a1a3a] border-2 border-pixel-cyan text-white font-pixel-body text-sm px-2 py-1 outline-none w-32"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Plan name..."
            />
            <button type="submit" className="pixel-btn font-pixel text-[7px] px-2">
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowNewPlan(false)}
              className="font-pixel-body text-gray-500 hover:text-white px-1"
            >
              ×
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewPlan(true)}
            className="font-pixel text-[7px] text-gray-500 hover:text-pixel-cyan border-2 border-[#2a2a4a] hover:border-pixel-cyan px-2 py-1.5 transition-colors"
          >
            + NEW PLAN
          </button>
        )}

        {plans.length > 1 && plan && (
          <button
            onClick={() => {
              if (confirm(`Delete plan "${plan.name}"?`)) deletePlan(plan.id);
            }}
            className="font-pixel text-[7px] text-gray-600 hover:text-pixel-red px-2 py-1.5 transition-colors"
          >
            DELETE PLAN
          </button>
        )}

        <div className="flex-1" />

        {/* View toggle */}
        <div className="flex">
          {(["board", "charts"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`font-pixel text-[7px] px-3 py-1.5 border-2 transition-colors ${
                view === v
                  ? "border-pixel-cyan text-pixel-cyan bg-[#1a1a3a]"
                  : "border-[#2a2a4a] text-gray-500 hover:text-white"
              }`}
            >
              {v === "board" ? "BOARD" : "CHARTS"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowLabelManager(!showLabelManager)}
          className="font-pixel text-[7px] text-gray-500 hover:text-pixel-purple border-2 border-[#2a2a4a] hover:border-pixel-purple px-2 py-1.5 transition-colors"
        >
          LABELS
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel text-[6px] px-2 py-1 outline-none"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="all">ALL PRIORITY</option>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel text-[6px] px-2 py-1 outline-none"
          value={filterProgress}
          onChange={(e) => setFilterProgress(e.target.value)}
        >
          <option value="all">ALL STATUS</option>
          {Object.entries(PROGRESS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="bg-[#1a1a3a] border border-[#2a2a4a] text-white font-pixel text-[6px] px-2 py-1 outline-none"
          value={filterLabel}
          onChange={(e) => setFilterLabel(e.target.value)}
        >
          <option value="all">ALL LABELS</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        {(filterPriority !== "all" || filterLabel !== "all" || filterProgress !== "all") && (
          <button
            onClick={() => {
              setFilterPriority("all");
              setFilterLabel("all");
              setFilterProgress("all");
            }}
            className="font-pixel text-[6px] text-pixel-red hover:text-red-300"
          >
            CLEAR FILTERS
          </button>
        )}
      </div>

      {/* Label manager */}
      {showLabelManager && (
        <div className="pixel-card p-4 mb-4">
          <p className="font-pixel text-[8px] text-pixel-purple mb-3">LABEL MANAGER</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {labels.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-1.5 px-2 py-1 border"
                style={{ borderColor: l.color + "40" }}
              >
                <span
                  className="w-3 h-3 shrink-0"
                  style={{ background: l.color }}
                />
                <span className="font-pixel text-[6px]" style={{ color: l.color }}>
                  {l.name}
                </span>
                <button
                  onClick={() => deleteLabel(l.id)}
                  className="font-pixel-body text-xs text-gray-500 hover:text-pixel-red ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addLabel();
            }}
            className="flex gap-2 items-center"
          >
            <input
              className="bg-[#1a1a3a] border-2 border-[#2a2a4a] text-white font-pixel-body text-sm px-2 py-1 outline-none focus:border-pixel-purple w-32"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name..."
            />
            <input
              type="color"
              className="w-8 h-8 bg-transparent border-2 border-[#2a2a4a] cursor-pointer"
              value={newLabelColor}
              onChange={(e) => setNewLabelColor(e.target.value)}
            />
            <button type="submit" className="pixel-btn font-pixel text-[7px] px-3">
              ADD
            </button>
          </form>
        </div>
      )}

      {/* Board view */}
      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 min-h-[300px]">
            {planBuckets.map((bucket) => {
              const bucketTasks = filteredTasks
                .filter((t) => t.bucketId === bucket.id)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={bucket.id}
                  className="flex-shrink-0 w-[260px] md:w-[280px]"
                >
                  {/* Bucket header */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    {editBucketId === bucket.id ? (
                      <input
                        autoFocus
                        className="font-pixel text-[8px] text-pixel-cyan bg-transparent border-b-2 border-pixel-cyan outline-none w-full"
                        value={editBucketName}
                        onChange={(e) =>
                          setEditBucketName(e.target.value)
                        }
                        onBlur={() =>
                          renameBucket(bucket.id, editBucketName)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            renameBucket(bucket.id, editBucketName);
                          if (e.key === "Escape") setEditBucketId(null);
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setEditBucketId(bucket.id);
                          setEditBucketName(bucket.name);
                        }}
                        className="font-pixel text-[8px] text-pixel-cyan hover:text-white transition-colors"
                      >
                        {bucket.name}
                      </button>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="font-pixel text-[7px] text-gray-600">
                        {bucketTasks.length}
                      </span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete bucket "${bucket.name}"?`))
                            deleteBucket(bucket.id);
                        }}
                        className="font-pixel-body text-xs text-gray-600 hover:text-pixel-red transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Tasks */}
                  <SortableContext
                    items={bucketTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2 min-h-[100px] p-2 bg-[#0a0a1a]/50 border-2 border-[#1a1a2a]">
                      {bucketTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          labels={labels}
                          onClick={() => setEditTask(task)}
                        />
                      ))}
                      <button
                        onClick={() => addTask(bucket.id)}
                        className="w-full font-pixel text-[7px] text-gray-600 hover:text-pixel-cyan py-2 border-2 border-dashed border-[#2a2a4a] hover:border-pixel-cyan transition-colors"
                      >
                        + ADD TASK
                      </button>
                    </div>
                  </SortableContext>
                </div>
              );
            })}

            {/* Add bucket */}
            <div className="flex-shrink-0 w-[260px] md:w-[280px]">
              <button
                onClick={addBucket}
                className="w-full font-pixel text-[8px] text-gray-600 hover:text-pixel-cyan py-4 border-2 border-dashed border-[#2a2a4a] hover:border-pixel-cyan transition-colors mt-7"
              >
                + ADD BUCKET
              </button>
            </div>
          </div>

          <DragOverlay>
            {draggedTask && (
              <div className="opacity-80 rotate-2">
                <TaskCard
                  task={draggedTask}
                  labels={labels}
                  onClick={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Charts view */}
      {view === "charts" && (
        <ChartsView tasks={planTasks} buckets={planBuckets} labels={labels} />
      )}

      {/* Task detail modal */}
      {editTask && (
        <TaskModal
          task={editTask}
          buckets={planBuckets}
          labels={labels}
          onUpdate={updateTask}
          onDelete={() => deleteTask(editTask.id)}
          onClose={() => setEditTask(null)}
        />
      )}
    </div>
  );
}
