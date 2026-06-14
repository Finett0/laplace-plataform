"use client";

import { useEffect, useRef, useState } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
} from "d3-force";
import { CLUSTER_COLORS } from "@/lib/sample";

export type GNode = {
  id: string;
  label: string;
  cluster: number;
  val: number;
  isBridge?: boolean;
  isGap?: boolean;
  x?: number;
  y?: number;
};
export type GLink = { source: string; target: string; weight: number };

type SimNode = GNode & { x: number; y: number };
type SimLink = { source: SimNode; target: SimNode; weight: number };

export default function ForceCanvas({
  nodes,
  links,
  selectedId,
  onSelect,
  labelMinVal = 0,
  sizeScale = 0.9,
}: {
  nodes: GNode[];
  links: GLink[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  labelMinVal?: number;
  sizeScale?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  // refs que mudam sem reconstruir a simulação
  const selRef = useRef(selectedId);
  const onSelRef = useRef(onSelect);
  const drawRef = useRef<() => void>(() => {});
  useEffect(() => {
    selRef.current = selectedId;
    drawRef.current();
  }, [selectedId]);
  useEffect(() => {
    onSelRef.current = onSelect;
  }, [onSelect]);

  // medir o container
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDims({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // simulação + render
  useEffect(() => {
    if (!dims || !canvasRef.current) return;
    const { w, h } = dims;
    const dpr = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d")!;

    const ns: SimNode[] = nodes.map((n) => ({ ...n })) as SimNode[];
    const ls: SimLink[] = links.map((l) => ({ ...l })) as unknown as SimLink[];
    const radius = (n: SimNode) => 6 + n.val * sizeScale;

    const adj = new Map<string, Set<string>>();
    ns.forEach((n) => adj.set(n.id, new Set()));
    links.forEach((l) => {
      adj.get(l.source)?.add(l.target);
      adj.get(l.target)?.add(l.source);
    });

    const sim: Simulation<SimNode, SimLink> = forceSimulation(ns)
      .force("charge", forceManyBody().strength(-180).distanceMax(380))
      .force(
        "link",
        forceLink<SimNode, SimLink>(ls)
          .id((d) => d.id)
          .distance((l) => 130 / ((l as SimLink).weight || 1))
          .strength(0.4),
      )
      .force("center", forceCenter(w / 2, h / 2))
      .force("collide", forceCollide<SimNode>((n) => radius(n) + 4));

    const tf = { k: 1, tx: 0, ty: 0 };
    let hoverId: string | null = null;

    function fit() {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      ns.forEach((n) => {
        minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
        minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
      });
      const k = Math.min(w / (maxX - minX + 140), h / (maxY - minY + 140), 2.2);
      tf.k = k;
      tf.tx = w / 2 - ((minX + maxX) / 2) * k;
      tf.ty = h / 2 - ((minY + maxY) / 2) * k;
    }

    function draw() {
      const focus = hoverId ?? selRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(dpr * tf.k, 0, 0, dpr * tf.k, dpr * tf.tx, dpr * tf.ty);

      // arestas
      ls.forEach((l) => {
        const lit = !focus || l.source.id === focus || l.target.id === focus;
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.strokeStyle = lit ? "rgba(24,87,160,0.30)" : "rgba(24,87,160,0.06)";
        ctx.lineWidth = (0.6 + (l.weight || 1) * 0.5) / tf.k;
        ctx.stroke();
      });

      // nós
      ns.forEach((n) => {
        const r = radius(n);
        const color = CLUSTER_COLORS[n.cluster % CLUSTER_COLORS.length];
        const isN = !focus || focus === n.id || adj.get(focus)?.has(n.id);
        ctx.globalAlpha = isN ? 1 : 0.14;

        if (n.isBridge) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 6, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(63,143,214,0.18)";
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        const g = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.4, r * 0.1, n.x, n.y, r);
        g.addColorStop(0, "rgba(255,255,255,0.45)");
        g.addColorStop(0.55, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fill();

        if (n.isGap) {
          ctx.beginPath();
          ctx.setLineDash([3 / tf.k, 3 / tf.k]);
          ctx.arc(n.x, n.y, r + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = "#E0A23C";
          ctx.lineWidth = 1.5 / tf.k;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (selRef.current === n.id) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = "#0A2440";
          ctx.lineWidth = 2 / tf.k;
          ctx.stroke();
        }

        if (n.val >= labelMinVal || focus === n.id) {
          const fs = Math.max(10, Math.min(13, 9 + n.val * 0.25)) / tf.k;
          ctx.font = `600 ${fs}px "Space Grotesk", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          const ly = n.y + r + 3 / tf.k;
          ctx.lineWidth = 3 / tf.k;
          ctx.strokeStyle = "rgba(246,248,251,0.95)";
          ctx.strokeText(n.label, n.x, ly);
          ctx.fillStyle = "#0E1C2E";
          ctx.fillText(n.label, n.x, ly);
        }
        ctx.globalAlpha = 1;
      });
    }

    drawRef.current = draw;
    sim.on("tick", draw);
    sim.on("end", () => { fit(); draw(); });
    // primeiro fit cedo p/ não começar fora da tela
    sim.tick(40);
    fit();
    draw();

    // interação
    function toGraph(ev: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      return { gx: (ev.clientX - rect.left - tf.tx) / tf.k, gy: (ev.clientY - rect.top - tf.ty) / tf.k };
    }
    function pick(ev: MouseEvent): SimNode | null {
      const { gx, gy } = toGraph(ev);
      for (const n of ns) {
        const r = radius(n) + 3;
        if ((n.x - gx) ** 2 + (n.y - gy) ** 2 <= r * r) return n;
      }
      return null;
    }
    function onMove(ev: MouseEvent) {
      const n = pick(ev);
      const id = n ? n.id : null;
      if (id !== hoverId) {
        hoverId = id;
        canvas.style.cursor = id ? "pointer" : "default";
        draw();
      }
    }
    function onClick(ev: MouseEvent) {
      const n = pick(ev);
      onSelRef.current(n ? (n.id === selRef.current ? null : n.id) : null);
    }
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("click", onClick);

    return () => {
      sim.stop();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("click", onClick);
      drawRef.current = () => {};
    };
  }, [dims, nodes, links, sizeScale, labelMinVal]);

  return (
    <div ref={wrapRef} className="h-full w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
