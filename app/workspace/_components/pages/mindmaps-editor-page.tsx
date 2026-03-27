"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  ChevronLeft,
  FolderOpen,
  Link2,
  Maximize2,
  Move,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Waypoints,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "@/app/workspace/_components/workspace-provider";
import {
  DataCard,
  EmptyState,
  Field,
  GhostButton,
  PageFrame,
  Pill,
  PrimaryButton,
  SecondaryButton,
  Select,
  TextInput,
  WorkspaceModal,
} from "@/app/workspace/_components/workspace-ui";
import { LockedFeaturePage } from "@/app/workspace/_components/pages/shared";
import {
  colorFromHex,
  decodeMindMap,
  encodeMindMap,
  formatDateTime,
  formatShortDate,
  initialMindMapDocument,
} from "@/utils/workspace/helpers";
import type {
  MindMapDocument,
  MindMapNodeData,
  MindMapNodeShape,
  MindMapRow,
  ProjectBundle,
  TrackBlueprint,
} from "@/utils/workspace/types";

const BOARD_WIDTH = 2200;
const BOARD_HEIGHT = 1400;
const MIN_SCALE = 0.45;
const MAX_SCALE = 2.4;
const DEFAULT_VIEW_STATE: ViewState = {
  scale: 1,
  offsetX: 80,
  offsetY: 80,
};
const MIND_MAP_PALETTE = [
  "#005F73",
  "#2EC5FF",
  "#35D39A",
  "#FFC857",
  "#EF476F",
  "#6C5CE7",
  "#0A9396",
  "#F4A261",
] as const;

type ViewState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type MessageState = {
  tone: "success" | "error";
  text: string;
};

type MapModalPayload = {
  id?: string;
  folder_name: string;
  title: string;
  track_id: string | null;
  module_id: string | null;
  project_id: string | null;
};

type NodeModalState = {
  open: boolean;
  mode: "create" | "edit";
  linkToNodeId: string | null;
  initialNode: MindMapNodeData | null;
};

type NodeModalPayload = {
  label: string;
  shape: MindMapNodeShape;
  colorHex: string;
};

type PanGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
};

type NodeGesture = {
  pointerId: number;
  nodeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

type ScheduledDraftCommit = {
  document: MindMapDocument;
  nodeId: string | null | undefined;
};

type ConnectionPathModel = {
  id: string;
  d: string;
  stroke: string;
  strokeWidth: number;
};

export function MindMapsEditorPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { data, error, saveMindMap, deleteMindMap } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(data!.mindMaps[0]?.id ?? null);
  const [selectedFolder] = useState("Todas");
  const [searchQuery] = useState("");
  const [draftState, setDraftState] = useState<{
    mapId: string | null;
    document: MindMapDocument | null;
  }>({
    mapId: null,
    document: null,
  });
  const [selectedNodeState, setSelectedNodeState] = useState<{
    mapId: string | null;
    nodeId: string | null;
  }>({
    mapId: null,
    nodeId: null,
  });
  const [mapModalState, setMapModalState] = useState<{
    open: boolean;
    editing: MindMapRow | null;
  }>({
    open: false,
    editing: null,
  });
  const [nodeModalState, setNodeModalState] = useState<NodeModalState>({
    open: false,
    mode: "create",
    linkToNodeId: null,
    initialNode: null,
  });
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [connectMode, setConnectMode] = useState(false);
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingNode, setIsDraggingNode] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pendingFitMapRef = useRef<string | null>(null);
  const panGestureRef = useRef<PanGesture | null>(null);
  const nodeGestureRef = useRef<NodeGesture | null>(null);
  const latestDraftRef = useRef<MindMapDocument | null>(null);
  const selectedRef = useRef<MindMapRow | null>(null);
  const viewStateRef = useRef<ViewState>(viewState);
  const selectedNodeIdRef = useRef<string | null>(null);
  const connectModeRef = useRef(connectMode);
  const connectionSourceIdRef = useRef<string | null>(connectionSourceId);
  const persistDocumentRef = useRef<
    (nextDraft?: MindMapDocument | null, successMessage?: string) => Promise<void>
  >(async () => {});
  const handleNodeActivationRef = useRef<(nodeId: string) => Promise<void>>(async () => {});
  const pendingViewStateRef = useRef<ViewState | null>(null);
  const viewFrameRef = useRef<number | null>(null);
  const pendingDraftCommitRef = useRef<ScheduledDraftCommit | null>(null);
  const draftFrameRef = useRef<number | null>(null);
  const featureEnabled = data!.featureAccess.mindMaps;

  const routeSegments = pathname.split("/").filter(Boolean);
  const isEditorRoute =
    routeSegments[0] === "workspace" &&
    routeSegments[1] === "mind-maps" &&
    routeSegments[2] === "editor";
  const editorMapId = isEditorRoute ? routeSegments[3] ?? null : null;

  const filteredMaps = data!.mindMaps.filter((map) => {
    if (selectedFolder !== "Todas" && map.folder_name !== selectedFolder) {
      return false;
    }

    if (!searchQuery.trim()) {
      return true;
    }

    const haystack = [
      map.title,
      map.folder_name,
      ...mindMapContextLabels(map, data!.trackBlueprints, data!.projectBundles),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchQuery.trim().toLowerCase());
  });
  const selected = isEditorRoute
    ? editorMapId
      ? data!.mindMaps.find((item) => item.id === editorMapId) ?? null
      : null
    : data!.mindMaps.find((item) => item.id === selectedId) ??
      filteredMaps[0] ??
      data!.mindMaps[0] ??
      null;
  const draft =
    draftState.mapId === selected?.id
      ? draftState.document
      : selected
        ? decodeMindMap(selected.content_json, selected.title)
        : null;
  const selectedNodeId =
    selectedNodeState.mapId === selected?.id
      ? selectedNodeState.nodeId
      : draft?.nodes[0]?.id ?? null;
  const selectedNode =
    draft?.nodes.find((item) => item.id === selectedNodeId) ?? draft?.nodes[0] ?? null;
  const selectedConnections =
    selectedNode && draft
      ? draft.connections.filter(
          (item) => item.sourceId === selectedNode.id || item.targetId === selectedNode.id,
        )
      : [];
  const selectedLabels = selected
    ? mindMapContextLabels(selected, data!.trackBlueprints, data!.projectBundles)
    : [];
  const connectionPaths = useMemo<ConnectionPathModel[]>(() => {
    if (!draft) {
      return [];
    }

    const nodesById = new Map(draft.nodes.map((node) => [node.id, node]));

    return draft.connections.flatMap((connection) => {
      const source = nodesById.get(connection.sourceId);
      const target = nodesById.get(connection.targetId);
      if (!source || !target) {
        return [];
      }

      const sourceCenter = {
        x: source.x + source.width / 2,
        y: source.y + source.height / 2,
      };
      const targetCenter = {
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
      };
      const controlOffset = Math.max(
        80,
        Math.abs(targetCenter.x - sourceCenter.x) * 0.35,
      );
      const active =
        selectedNodeId &&
        (connection.sourceId === selectedNodeId || connection.targetId === selectedNodeId);
      const linking =
        connectionSourceId &&
        (connection.sourceId === connectionSourceId || connection.targetId === connectionSourceId);

      return [
        {
          id: connection.id,
          d: `M ${sourceCenter.x} ${sourceCenter.y} C ${sourceCenter.x + controlOffset} ${sourceCenter.y}, ${targetCenter.x - controlOffset} ${targetCenter.y}, ${targetCenter.x} ${targetCenter.y}`,
          stroke: active ? "#2EC5FF" : linking ? "#35D39A" : "rgba(144,164,174,0.72)",
          strokeWidth: active || linking ? 3.2 : 2.2,
        },
      ];
    });
  }, [connectionSourceId, draft, selectedNodeId]);

  latestDraftRef.current = draft;
  selectedRef.current = selected;
  viewStateRef.current = viewState;
  selectedNodeIdRef.current = selectedNodeId;
  connectModeRef.current = connectMode;
  connectionSourceIdRef.current = connectionSourceId;

  useEffect(() => {
    if (!data!.mindMaps.length) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !data!.mindMaps.some((item) => item.id === selectedId)) {
      setSelectedId(data!.mindMaps[0].id);
    }
  }, [data, selectedId]);

  useEffect(() => {
    if (!editorMapId) {
      return;
    }

    if (selectedId !== editorMapId) {
      setSelectedId(editorMapId);
    }
  }, [editorMapId, selectedId]);

  useEffect(() => {
    if (isEditorRoute) {
      return;
    }

    if (!filteredMaps.length) {
      return;
    }

    if (!selectedId || !filteredMaps.some((item) => item.id === selectedId)) {
      setSelectedId(filteredMaps[0].id);
    }
  }, [filteredMaps, isEditorRoute, selectedId]);

  useEffect(() => {
    if (!selected) {
      latestDraftRef.current = null;
      selectedRef.current = null;
      setDraftState({ mapId: null, document: null });
      setSelectedNodeState({ mapId: null, nodeId: null });
      setConnectMode(false);
      setConnectionSourceId(null);
      setDirty(false);
      return;
    }

    if (draftState.mapId === selected.id) {
      return;
    }

    const nextDocument = decodeMindMap(selected.content_json, selected.title);
    latestDraftRef.current = nextDocument;
    setDraftState({ mapId: selected.id, document: nextDocument });
    setSelectedNodeState({ mapId: selected.id, nodeId: nextDocument.nodes[0]?.id ?? null });
    setConnectMode(false);
    setConnectionSourceId(null);
    setDirty(false);
    pendingFitMapRef.current = selected.id;
  }, [draftState.mapId, selected]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (viewFrameRef.current !== null) {
        window.cancelAnimationFrame(viewFrameRef.current);
      }
      if (draftFrameRef.current !== null) {
        window.cancelAnimationFrame(draftFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!selected || pendingFitMapRef.current !== selected.id) {
      return;
    }

    if (!viewportSize.width || !viewportSize.height) {
      return;
    }

    const fitDocument =
      latestDraftRef.current && draftState.mapId === selected.id
        ? latestDraftRef.current
        : decodeMindMap(selected.content_json, selected.title);

    setViewState(computeFitView(fitDocument, viewportSize));
    pendingFitMapRef.current = null;
  }, [draftState.mapId, selected, viewportSize]);

  const flushScheduledViewState = useCallback(() => {
    if (!pendingViewStateRef.current) {
      return;
    }

    if (viewFrameRef.current !== null) {
      window.cancelAnimationFrame(viewFrameRef.current);
      viewFrameRef.current = null;
    }

    const nextView = pendingViewStateRef.current;
    pendingViewStateRef.current = null;
    viewStateRef.current = nextView;
    setViewState(nextView);
  }, []);

  const scheduleViewState = useCallback((nextView: ViewState) => {
    pendingViewStateRef.current = nextView;
    viewStateRef.current = nextView;
    if (viewFrameRef.current !== null) {
      return;
    }

    viewFrameRef.current = window.requestAnimationFrame(() => {
      viewFrameRef.current = null;
      const pendingView = pendingViewStateRef.current;
      if (!pendingView) {
        return;
      }
      pendingViewStateRef.current = null;
      setViewState(pendingView);
    });
  }, []);

  const commitDraft = useCallback((nextDraft: MindMapDocument, nextNodeId?: string | null) => {
    if (!selectedRef.current) return;

    const nodeIds = new Set(nextDraft.nodes.map((item) => item.id));
    const resolvedNodeId =
      nextNodeId !== undefined
        ? nextNodeId && nodeIds.has(nextNodeId)
          ? nextNodeId
          : nextDraft.nodes[0]?.id ?? null
        : selectedNodeIdRef.current && nodeIds.has(selectedNodeIdRef.current)
          ? selectedNodeIdRef.current
          : nextDraft.nodes[0]?.id ?? null;
    const nextSourceId =
      connectionSourceIdRef.current && nodeIds.has(connectionSourceIdRef.current)
        ? connectionSourceIdRef.current
        : null;

    latestDraftRef.current = nextDraft;
    selectedNodeIdRef.current = resolvedNodeId;
    connectionSourceIdRef.current = nextSourceId;

    setDraftState({ mapId: selectedRef.current.id, document: nextDraft });
    setSelectedNodeState({ mapId: selectedRef.current.id, nodeId: resolvedNodeId });
    setConnectionSourceId(nextSourceId);
    if (connectModeRef.current && !nextSourceId) {
      connectModeRef.current = false;
      setConnectMode(false);
    }
    setDirty(true);
  }, []);

  const flushScheduledDraftCommit = useCallback(() => {
    if (!pendingDraftCommitRef.current) {
      return;
    }

    if (draftFrameRef.current !== null) {
      window.cancelAnimationFrame(draftFrameRef.current);
      draftFrameRef.current = null;
    }

    const pendingCommit = pendingDraftCommitRef.current;
    pendingDraftCommitRef.current = null;
    commitDraft(pendingCommit.document, pendingCommit.nodeId);
  }, [commitDraft]);

  const scheduleDraftCommit = useCallback(
    (nextDraft: MindMapDocument, nextNodeId?: string | null) => {
      pendingDraftCommitRef.current = {
        document: nextDraft,
        nodeId: nextNodeId,
      };
      if (draftFrameRef.current !== null) {
        return;
      }

      draftFrameRef.current = window.requestAnimationFrame(() => {
        draftFrameRef.current = null;
        const pendingCommit = pendingDraftCommitRef.current;
        if (!pendingCommit) {
          return;
        }
        pendingDraftCommitRef.current = null;
        commitDraft(pendingCommit.document, pendingCommit.nodeId);
      });
    },
    [commitDraft],
  );

  async function persistDocument(
    nextDraft = latestDraftRef.current,
    successMessage?: string,
  ) {
    flushScheduledDraftCommit();
    const activeMap = selectedRef.current;
    const resolvedDraft = latestDraftRef.current ?? nextDraft;
    if (!activeMap || !resolvedDraft) return;

    setSaving(true);
    setMessage(null);

    try {
      await saveMindMap({
        id: activeMap.id,
        folder_name: activeMap.folder_name,
        title: activeMap.title,
        content_json: encodeMindMap(resolvedDraft),
        track_id: activeMap.track_id,
        module_id: activeMap.module_id,
        project_id: activeMap.project_id,
      });
      setDirty(false);
      if (successMessage) {
        setMessage({ tone: "success", text: successMessage });
      }
    } catch (nextError) {
      setMessage({
        tone: "error",
        text: nextError instanceof Error ? nextError.message : "Falha ao salvar o mapa.",
      });
      throw nextError;
    } finally {
      setSaving(false);
    }
  }

  async function handleMapSubmit(payload: MapModalPayload) {
    const targetId = payload.id ?? crypto.randomUUID();
    const isCreating = !payload.id;
    const activeDraft =
      mapModalState.editing?.id && mapModalState.editing.id === selected?.id
        ? latestDraftRef.current
        : null;

    await saveMindMap({
      id: targetId,
      folder_name: payload.folder_name,
      title: payload.title,
      content_json:
        activeDraft
          ? encodeMindMap(activeDraft)
          : mapModalState.editing?.content_json ??
            encodeMindMap(initialMindMapDocument(payload.title)),
      track_id: payload.track_id,
      module_id: payload.module_id,
      project_id: payload.project_id,
    });

    pendingFitMapRef.current = targetId;
    setSelectedId(targetId);
    setMapModalState({ open: false, editing: null });
    setMessage({
      tone: "success",
      text: mapModalState.editing ? "Mapa atualizado." : "Mapa criado.",
    });

    if (isCreating) {
      router.push(`/workspace/mind-maps/editor/${targetId}`);
    }
  }

  async function handleNodeSubmit(payload: NodeModalPayload) {
    if (!draft || !selected || !nodeModalState.initialNode) return;

    const size = sizeForShape(payload.shape);
    const nextNode: MindMapNodeData = {
      ...nodeModalState.initialNode,
      label: payload.label.trim(),
      shape: payload.shape,
      colorHex: payload.colorHex,
      width: size.width,
      height: size.height,
      x: clamp(nodeModalState.initialNode.x, 0, BOARD_WIDTH - size.width),
      y: clamp(nodeModalState.initialNode.y, 0, BOARD_HEIGHT - size.height),
    };

    const nextDraft =
      nodeModalState.mode === "create"
        ? {
            nodes: [...draft.nodes, nextNode],
            connections:
              nodeModalState.linkToNodeId &&
              nodeModalState.linkToNodeId !== nextNode.id &&
              !draft.connections.some((item) =>
                isSameConnection(item, {
                  sourceId: nodeModalState.linkToNodeId!,
                  targetId: nextNode.id,
                }),
              )
                ? [
                    ...draft.connections,
                    {
                      id: crypto.randomUUID(),
                      sourceId: nodeModalState.linkToNodeId,
                      targetId: nextNode.id,
                    },
                  ]
                : draft.connections,
          }
        : {
            ...draft,
            nodes: draft.nodes.map((item) => (item.id === nextNode.id ? nextNode : item)),
          };

    commitDraft(nextDraft, nextNode.id);
    setNodeModalState({
      open: false,
      mode: "create",
      linkToNodeId: null,
      initialNode: null,
    });
    await persistDocument(
      nextDraft,
      nodeModalState.mode === "create" ? "Nó criado." : "Nó atualizado.",
    );
  }

  function openCreateNode(linkToSelected: boolean) {
    if (!draft) return;

    const baseNode = selectedNode ?? draft.nodes[0] ?? null;
    const baseShape = baseNode?.shape ?? "rectangle";
    const size = sizeForShape(baseShape);
    const position = nextNodePosition(draft, {
      width: size.width,
      height: size.height,
      baseNode,
    });

    setNodeModalState({
      open: true,
      mode: "create",
      linkToNodeId: linkToSelected ? baseNode?.id ?? null : null,
      initialNode: {
        id: crypto.randomUUID(),
        label: "Novo conceito",
        shape: baseShape,
        colorHex: baseNode?.colorHex ?? defaultColorForShape(baseShape),
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      },
    });
  }

  function openEditNode(node: MindMapNodeData | null) {
    if (!node) return;
    setNodeModalState({
      open: true,
      mode: "edit",
      linkToNodeId: null,
      initialNode: node,
    });
  }

  async function handleDeleteMap(target: MindMapRow) {
    const confirmed = window.confirm(`Excluir o mapa "${target.title}" do workspace?`);
    if (!confirmed) return;

    await deleteMindMap(target.id);
    setMessage({ tone: "success", text: "Mapa removido." });
  }

  async function handleDeleteNode(node: MindMapNodeData | null) {
    if (!draft || !node) return;

    if (draft.nodes.length <= 1) {
      setMessage({ tone: "error", text: "Mantenha pelo menos um nó no mapa." });
      return;
    }

    const confirmed = window.confirm(`Excluir "${node.label}" e as conexões ligadas a ele?`);
    if (!confirmed) return;

    const nextDraft: MindMapDocument = {
      nodes: draft.nodes.filter((item) => item.id !== node.id),
      connections: draft.connections.filter(
        (item) => item.sourceId !== node.id && item.targetId !== node.id,
      ),
    };

    commitDraft(nextDraft, nextDraft.nodes[0]?.id ?? null);
    await persistDocument(nextDraft, "Nó removido.");
  }

  async function handleDeleteConnection(connectionId: string) {
    if (!draft) return;

    const nextDraft: MindMapDocument = {
      ...draft,
      connections: draft.connections.filter((item) => item.id !== connectionId),
    };

    commitDraft(nextDraft);
    await persistDocument(nextDraft, "Conexão removida.");
  }

  async function handleNodeActivation(nodeId: string) {
    const activeDraft = latestDraftRef.current;
    if (!activeDraft) return;

    selectedNodeIdRef.current = nodeId;
    setSelectedNodeState({ mapId: selectedRef.current?.id ?? null, nodeId });

    if (!connectModeRef.current) {
      return;
    }

    if (!connectionSourceIdRef.current) {
      connectionSourceIdRef.current = nodeId;
      setConnectionSourceId(nodeId);
      setMessage({
        tone: "success",
        text: "Origem definida. Clique em outro nó para completar a conexão.",
      });
      return;
    }

    if (connectionSourceIdRef.current === nodeId) {
      connectionSourceIdRef.current = null;
      setConnectionSourceId(null);
      return;
    }

    const duplicate = activeDraft.connections.some((item) =>
      isSameConnection(item, {
        sourceId: connectionSourceIdRef.current!,
        targetId: nodeId,
      }),
    );

    if (duplicate) {
      setMessage({ tone: "error", text: "Essa conexão já existe neste mapa." });
      return;
    }

    const nextDraft: MindMapDocument = {
      ...activeDraft,
      connections: [
        ...activeDraft.connections,
        {
          id: crypto.randomUUID(),
          sourceId: connectionSourceIdRef.current!,
          targetId: nodeId,
        },
      ],
    };

    commitDraft(nextDraft, nodeId);
    connectModeRef.current = false;
    connectionSourceIdRef.current = null;
    setConnectMode(false);
    setConnectionSourceId(null);
    await persistDocument(nextDraft, "Conexão criada.");
  }

  persistDocumentRef.current = persistDocument;
  handleNodeActivationRef.current = handleNodeActivation;

  function handleToggleConnectMode() {
    if (!selectedNode) return;

    if (connectModeRef.current) {
      connectModeRef.current = false;
      connectionSourceIdRef.current = null;
      setConnectMode(false);
      setConnectionSourceId(null);
      return;
    }

    connectModeRef.current = true;
    connectionSourceIdRef.current = selectedNode.id;
    setConnectMode(true);
    setConnectionSourceId(selectedNode.id);
    setMessage({
      tone: "success",
      text: `Origem definida em "${selectedNode.label}". Clique no destino no canvas.`,
    });
  }

  const handleCanvasWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;

    event.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const currentView = viewStateRef.current;
    const nextScale = clamp(
      currentView.scale * (event.deltaY < 0 ? 1.08 : 0.92),
      MIN_SCALE,
      MAX_SCALE,
    );
    const worldX = (pointerX - currentView.offsetX) / currentView.scale;
    const worldY = (pointerY - currentView.offsetY) / currentView.scale;

    scheduleViewState({
      scale: nextScale,
      offsetX: pointerX - worldX * nextScale,
      offsetY: pointerY - worldY * nextScale,
    });
  }, [scheduleViewState]);

  const handleCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-mindmap-node='true']") || target.closest("[data-canvas-overlay='true']")) {
      return;
    }

    panGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewStateRef.current.offsetX,
      originY: viewStateRef.current.offsetY,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleCanvasPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = panGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    scheduleViewState({
      scale: viewStateRef.current.scale,
      offsetX: gesture.originX + (event.clientX - gesture.startX),
      offsetY: gesture.originY + (event.clientY - gesture.startY),
    });
  }, [scheduleViewState]);

  const handleCanvasPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = panGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    flushScheduledViewState();
    panGestureRef.current = null;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, [flushScheduledViewState]);

  const handleNodePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const nodeId = event.currentTarget.dataset.nodeId;
    const activeDraft = latestDraftRef.current;
    const node = nodeId
      ? activeDraft?.nodes.find((item) => item.id === nodeId) ?? null
      : null;
    if (!node) {
      return;
    }

    nodeGestureRef.current = {
      pointerId: event.pointerId,
      nodeId: node.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: node.x,
      originY: node.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handleNodePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const nodeId = event.currentTarget.dataset.nodeId;
    const gesture = nodeGestureRef.current;
    const activeDraft = latestDraftRef.current;
    if (
      !nodeId ||
      !gesture ||
      !activeDraft ||
      gesture.pointerId !== event.pointerId ||
      gesture.nodeId !== nodeId
    ) {
      return;
    }

    const deltaX = (event.clientX - gesture.startX) / viewStateRef.current.scale;
    const deltaY = (event.clientY - gesture.startY) / viewStateRef.current.scale;
    if (!gesture.moved && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
      gesture.moved = true;
      setIsDraggingNode(true);
    }

    const nextDraft: MindMapDocument = {
      ...activeDraft,
      nodes: activeDraft.nodes.map((item) =>
        item.id === nodeId
          ? {
              ...item,
              x: clamp(gesture.originX + deltaX, 0, BOARD_WIDTH - item.width),
              y: clamp(gesture.originY + deltaY, 0, BOARD_HEIGHT - item.height),
            }
          : item,
      ),
    };

    scheduleDraftCommit(nextDraft, nodeId);
  }, [scheduleDraftCommit]);

  const handleNodePointerUp = useCallback(async (event: ReactPointerEvent<HTMLButtonElement>) => {
    const nodeId = event.currentTarget.dataset.nodeId;
    const gesture = nodeGestureRef.current;
    if (!nodeId || !gesture || gesture.pointerId !== event.pointerId || gesture.nodeId !== nodeId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    flushScheduledDraftCommit();
    nodeGestureRef.current = null;
    setIsDraggingNode(false);

    if (gesture.moved) {
      await persistDocumentRef.current(latestDraftRef.current, "Posição atualizada.");
      return;
    }

    await handleNodeActivationRef.current(nodeId);
  }, [flushScheduledDraftCommit]);

  if (!featureEnabled) {
    return <LockedFeaturePage title="Mind maps premium bloqueados" feature="Mind Maps" />;
  }

  function handleFitCanvas() {
    if (!draft || !viewportSize.width || !viewportSize.height) return;
    setViewState(computeFitView(draft, viewportSize));
  }

  function handleResetCanvas() {
    setViewState(DEFAULT_VIEW_STATE);
  }

  function goToLibrary() {
    router.push("/workspace/mind-maps");
  }

  return (
    <>
      <PageFrame
        eyebrow="Canvas"
        title={selected?.title ?? "Editor de Mind Map"}
        subtitle="Canvas dedicado para construir o mapa sem a biblioteca misturada na mesma tela. Aqui o foco fica em posicionar, conectar e refinar a estrutura visual."
        actions={
          <SecondaryButton onClick={goToLibrary}>
            <ChevronLeft size={16} />
            Voltar para biblioteca
          </SecondaryButton>
        }
      >
        {(error || message) && (
          <div
            className={
              message?.tone === "error" || error
                ? "border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                : "border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            }
          >
            {error ?? message?.text}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {selected && draft ? (
            <div className="flex min-w-0 flex-col gap-6">
              <section className="glass-panel relative min-h-[780px] overflow-hidden border border-border">
                <div
                  ref={viewportRef}
                  className={`relative h-[780px] overflow-hidden ${
                    isPanning ? "cursor-grabbing" : isDraggingNode ? "cursor-move" : "cursor-grab"
                  }`}
                  onWheel={handleCanvasWheel}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(50,208,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(53,211,154,0.12),transparent_28%)]" />
                  <div
                    className="absolute left-0 top-0 will-change-transform"
                    style={{
                      width: BOARD_WIDTH,
                      height: BOARD_HEIGHT,
                      transformOrigin: "0 0",
                      transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "linear-gradient(rgba(207,216,227,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(207,216,227,0.12) 1px, transparent 1px), linear-gradient(rgba(207,216,227,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(207,216,227,0.2) 1px, transparent 1px)",
                        backgroundSize: "40px 40px, 40px 40px, 200px 200px, 200px 200px",
                      }}
                    />
                    <svg
                      className="pointer-events-none absolute inset-0"
                      width={BOARD_WIDTH}
                      height={BOARD_HEIGHT}
                      viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
                    >
                      {connectionPaths.map((connection) => (
                        <path
                          key={connection.id}
                          d={connection.d}
                          fill="none"
                          stroke={connection.stroke}
                          strokeWidth={connection.strokeWidth}
                          strokeLinecap="round"
                        />
                      ))}
                    </svg>
                    {draft.nodes.map((node) => {
                      const active = node.id === selectedNode?.id;
                      return (
                        <MindMapNodeButton
                          key={node.id}
                          node={node}
                          active={active}
                          onPointerDown={handleNodePointerDown}
                          onPointerMove={handleNodePointerMove}
                          onPointerUp={handleNodePointerUp}
                        />
                      );
                    })}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 top-0 p-4 lg:p-5">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
                      <CanvasOverlayPanel className="pointer-events-auto" data-canvas-overlay="true">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Canvas ativo</p>
                              <h2 className="truncate text-2xl font-display text-white">{selected.title}</h2>
                              <p className="mt-1 text-sm text-text-secondary">
                                {selected.folder_name} • {formatDateTime(selected.updated_at)}
                              </p>
                            </div>
                            <Pill tone={dirty ? "warning" : "primary"}>
                              {dirty ? "Alterações locais" : "Sincronizado"}
                            </Pill>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Pill tone="primary">{draft.nodes.length} nós</Pill>
                            <Pill tone="neutral">{draft.connections.length} conexões</Pill>
                            {selectedLabels.map((label) => (
                              <Pill key={label} tone="neutral">{label}</Pill>
                            ))}
                          </div>
                          <p className="text-sm leading-relaxed text-text-secondary">
                            {connectMode
                              ? connectionSourceId
                                ? "Modo conexão ativo. A origem já foi definida; clique no nó de destino."
                                : "Modo conexão ativo. Clique em um nó para definir a origem."
                              : "Arraste os nós, use o zoom do mouse e ajuste o enquadramento para organizar a estrutura do mapa."}
                          </p>
                        </div>
                      </CanvasOverlayPanel>
                      <CanvasOverlayPanel className="pointer-events-auto justify-self-stretch xl:justify-self-end" data-canvas-overlay="true">
                        <div className="flex flex-wrap justify-end gap-2">
                          <PrimaryButton onClick={() => openCreateNode(false)}>
                            <Plus size={16} />
                            Novo nó
                          </PrimaryButton>
                          <SecondaryButton onClick={() => openCreateNode(true)} disabled={!selectedNode}>
                            <Link2 size={16} />
                            Adicionar ligado
                          </SecondaryButton>
                          <SecondaryButton onClick={handleToggleConnectMode} disabled={!selectedNode}>
                            <Waypoints size={16} />
                            {connectMode ? "Cancelar conexão" : "Conectar"}
                          </SecondaryButton>
                          <SecondaryButton onClick={handleFitCanvas}>
                            <Maximize2 size={16} />
                            Ajustar
                          </SecondaryButton>
                          <SecondaryButton onClick={handleResetCanvas}>
                            <RotateCcw size={16} />
                            Resetar
                          </SecondaryButton>
                          <SecondaryButton onClick={() => openEditNode(selectedNode)} disabled={!selectedNode}>
                            <Pencil size={16} />
                            Editar nó
                          </SecondaryButton>
                          <PrimaryButton onClick={() => void persistDocument(draft, "Canvas salvo.")} disabled={!dirty || saving}>
                            <Save size={16} />
                            {saving ? "Salvando..." : "Salvar"}
                          </PrimaryButton>
                          <GhostButton onClick={() => setMapModalState({ open: true, editing: selected })}>
                            <FolderOpen size={16} />
                            Editar mapa
                          </GhostButton>
                          <GhostButton onClick={() => void handleDeleteMap(selected)} className="text-red-200 hover:bg-red-500/10 hover:text-red-100">
                            <Trash2 size={16} />
                            Excluir
                          </GhostButton>
                        </div>
                      </CanvasOverlayPanel>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3">
                    <CanvasOverlayPanel className="pointer-events-auto" data-canvas-overlay="true">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                        <Move size={14} />
                        Arraste o fundo para navegar e o scroll para aproximar
                      </div>
                    </CanvasOverlayPanel>
                    <CanvasOverlayPanel className="pointer-events-auto" data-canvas-overlay="true">
                      <div className="flex items-center gap-3 text-sm text-white">
                        <span>{Math.round(viewState.scale * 100)}%</span>
                        {selectedNode ? (
                          <span className="max-w-[220px] truncate text-text-secondary">
                            Selecionado: {selectedNode.label}
                          </span>
                        ) : null}
                      </div>
                    </CanvasOverlayPanel>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <DataCard className="xl:col-span-2" title="Canvas" subtitle="Selecione um mapa da biblioteca para abrir o editor dedicado.">
              <EmptyState
                title="Sem mapa selecionado"
                subtitle="Volte para a biblioteca, escolha um mapa e abra o canvas para continuar a edicao."
                action={
                  <SecondaryButton onClick={goToLibrary}>
                    <ChevronLeft size={16} />
                    Ir para biblioteca
                  </SecondaryButton>
                }
              />
            </DataCard>
          )}
          <DataCard
            title={selectedNode ? selectedNode.label : "Inspector"}
            subtitle={
              selectedNode
                ? `${shapeLabel(selectedNode.shape)} • ${Math.round(selectedNode.x)} x ${Math.round(selectedNode.y)}`
                : "Selecione um nó para revisar o conteúdo e as conexões."
            }
            className="min-h-[780px]"
          >
            {selectedNode && draft ? (
              <div className="flex flex-col gap-6">
                <NodePreviewCard node={selectedNode} active />
                <div className="grid gap-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MetricLine label="Largura" value={`${Math.round(selectedNode.width)} px`} />
                    <MetricLine label="Altura" value={`${Math.round(selectedNode.height)} px`} />
                    <MetricLine label="Atualizado" value={formatShortDate(selected?.updated_at)} />
                    <MetricLine label="Cor" value={selectedNode.colorHex.toUpperCase()} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton onClick={() => openEditNode(selectedNode)}>
                      <Pencil size={16} />
                      Editar nó
                    </PrimaryButton>
                    <SecondaryButton onClick={handleToggleConnectMode}>
                      <Link2 size={16} />
                      {connectMode ? "Cancelar modo conexão" : "Usar como origem"}
                    </SecondaryButton>
                    <GhostButton onClick={() => void handleDeleteNode(selectedNode)} className="text-red-200 hover:bg-red-500/10 hover:text-red-100">
                      <Trash2 size={16} />
                      Excluir nó
                    </GhostButton>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-display text-white">Conexões</h3>
                      <p className="text-sm text-text-secondary">
                        Remova vínculos redundantes ou revise os caminhos ativos deste nó.
                      </p>
                    </div>
                    <Pill tone={selectedConnections.length ? "primary" : "neutral"}>
                      {selectedConnections.length}
                    </Pill>
                  </div>
                  {selectedConnections.length ? (
                    <div className="flex flex-col gap-2">
                      {selectedConnections.map((connection) => {
                        const relatedNode = otherNode(draft, connection, selectedNode.id);
                        return (
                          <div key={connection.id} className="flex items-center justify-between gap-3 border border-border/50 bg-background/40 px-3 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {relatedNode?.label ?? "Conexão"}
                              </p>
                              <p className="text-xs uppercase tracking-[0.18em] text-text-secondary">
                                {relatedNode ? shapeLabel(relatedNode.shape) : "Sem destino"}
                              </p>
                            </div>
                            <GhostButton onClick={() => void handleDeleteConnection(connection.id)} className="text-red-200 hover:bg-red-500/10 hover:text-red-100">
                              <Trash2 size={15} />
                            </GhostButton>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      title="Sem conexões ainda"
                      subtitle="Use “Conectar” no canvas ou no inspetor para ligar este nó a outro conceito."
                    />
                  )}
                </div>
                <DataCard dense title="Prévia do mapa" subtitle="Visão geral compacta do board atual.">
                  <div className="relative h-[220px] overflow-hidden border border-border/50 bg-background/50">
                    <MiniMindMapPreview document={draft} />
                  </div>
                </DataCard>
              </div>
            ) : (
              <EmptyState
                title="Nenhum nó selecionado"
                subtitle="Clique em um nó do canvas para abrir o inspector e revisar conexões, forma e posição."
              />
            )}
          </DataCard>
        </div>
      </PageFrame>
      <MindMapMetaModal
        open={mapModalState.open}
        editing={mapModalState.editing}
        tracks={data!.trackBlueprints}
        projects={data!.projectBundles}
        onClose={() => setMapModalState({ open: false, editing: null })}
        onSubmit={handleMapSubmit}
      />
      <MindMapNodeModal
        open={nodeModalState.open}
        mode={nodeModalState.mode}
        initialNode={nodeModalState.initialNode}
        onClose={() =>
          setNodeModalState({
            open: false,
            mode: "create",
            linkToNodeId: null,
            initialNode: null,
          })
        }
        onSubmit={handleNodeSubmit}
      />
    </>
  );
}

function MindMapMetaModal({
  open,
  editing,
  tracks,
  projects,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: MindMapRow | null;
  tracks: TrackBlueprint[];
  projects: ProjectBundle[];
  onClose: () => void;
  onSubmit: (payload: MapModalPayload) => Promise<void>;
}) {
  const [folderName, setFolderName] = useState("Geral");
  const [title, setTitle] = useState("");
  const [trackId, setTrackId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFolderName(editing?.folder_name || "Geral");
    setTitle(editing?.title || "");
    setTrackId(editing?.track_id || "");
    setModuleId(editing?.module_id || "");
    setProjectId(editing?.project_id || "");
  }, [editing, open]);

  const selectedTrack = tracks.find((item) => item.track.id === trackId) ?? null;
  const modules = useMemo(() => selectedTrack?.modules ?? [], [selectedTrack]);

  useEffect(() => {
    if (!moduleId) return;
    if (!modules.some((item) => item.id === moduleId)) {
      setModuleId("");
    }
  }, [moduleId, modules]);

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      title={editing ? "Editar mapa" : "Novo mapa"}
      subtitle="Defina contexto, pasta e vínculos do board."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!title.trim()) return;

          setSubmitting(true);
          try {
            await onSubmit({
              id: editing?.id,
              folder_name: folderName.trim() || "Geral",
              title: title.trim(),
              track_id: trackId || null,
              module_id: moduleId || null,
              project_id: projectId || null,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Pasta">
          <TextInput value={folderName} onChange={(event) => setFolderName(event.target.value)} />
        </Field>
        <Field label="Título">
          <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Trilha">
          <Select value={trackId} onChange={(event) => setTrackId(event.target.value)}>
            <option value="">Sem trilha</option>
            {tracks.map((item) => (
              <option key={item.track.id} value={item.track.id}>
                {item.track.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Módulo">
          <Select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
            <option value="">Sem módulo</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Projeto">
          <Select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="">Sem projeto</option>
            {projects.map((item) => (
              <option key={item.project.id} value={item.project.id}>
                {item.project.title}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-5">
          <SecondaryButton type="button" onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={submitting || !title.trim()}>
            {submitting ? "Salvando..." : editing ? "Salvar mapa" : "Criar mapa"}
          </PrimaryButton>
        </div>
      </form>
    </WorkspaceModal>
  );
}

function MindMapNodeModal({
  open,
  mode,
  initialNode,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialNode: MindMapNodeData | null;
  onClose: () => void;
  onSubmit: (payload: NodeModalPayload) => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [shape, setShape] = useState<MindMapNodeShape>("rounded");
  const [colorHex, setColorHex] = useState<string>(MIND_MAP_PALETTE[1]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !initialNode) return;
    setLabel(initialNode.label);
    setShape(initialNode.shape);
    setColorHex(initialNode.colorHex);
  }, [initialNode, open]);

  const previewSize = sizeForShape(shape);
  const previewNode: MindMapNodeData = {
    id: initialNode?.id ?? "preview-node",
    label: label.trim() || "Novo conceito",
    shape,
    colorHex,
    x: 0,
    y: 0,
    width: previewSize.width,
    height: previewSize.height,
  };

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Configurar nó" : "Editar nó"}
      subtitle="Ajuste forma, cor e rótulo antes de jogar o bloco no canvas."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!label.trim()) return;

          setSubmitting(true);
          try {
            await onSubmit({
              label,
              shape,
              colorHex,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <Field label="Rótulo do nó">
          <TextInput value={label} onChange={(event) => setLabel(event.target.value)} />
        </Field>
        <Field label="Forma">
          <Select value={shape} onChange={(event) => setShape(event.target.value as MindMapNodeShape)}>
            <option value="rectangle">Retângulo</option>
            <option value="rounded">Bloco</option>
            <option value="ellipse">Elipse</option>
            <option value="diamond">Losango</option>
          </Select>
        </Field>
        <Field label="Paleta">
          <div className="flex flex-wrap gap-3">
            {MIND_MAP_PALETTE.map((item) => (
              <button
                key={item}
                type="button"
                className={`h-9 w-9 rounded-full border transition-transform ${
                  colorHex === item ? "scale-110 border-white" : "border-white/20"
                }`}
                style={{ background: item }}
                onClick={() => setColorHex(item)}
              >
                <span className="sr-only">{item}</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/40 p-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-secondary">
            Prévia
          </span>
          <div className="flex min-h-[180px] items-center justify-center overflow-hidden">
            <NodePreviewCard node={previewNode} active />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-5">
          <SecondaryButton type="button" onClick={onClose}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={submitting || !label.trim()}>
            {submitting ? "Salvando..." : "Salvar nó"}
          </PrimaryButton>
        </div>
      </form>
    </WorkspaceModal>
  );
}

function CanvasOverlayPanel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-[24px] border border-border/80 bg-panel/90 px-4 py-4 shadow-[0_24px_48px_rgba(0,0,0,0.2)] backdrop-blur-xl ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

const MindMapNodeButton = memo(function MindMapNodeButton({
  node,
  active,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  node: MindMapNodeData;
  active: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void | Promise<void>;
}) {
  const accent = colorFromHex(node.colorHex);
  const foreground = foregroundForNode(accent);
  const size = node.shape === "diamond" ? Math.min(node.width, node.height) : undefined;
  const style: CSSProperties = {
    left: node.x,
    top: node.y,
    width: size ?? node.width,
    height: size ?? node.height,
    background: accent,
    borderColor: active ? foreground : `${foreground}44`,
    color: foreground,
    borderRadius:
      node.shape === "rounded"
        ? "999px"
        : node.shape === "rectangle"
          ? "18px"
          : node.shape === "ellipse"
            ? "999px"
            : "0px",
    clipPath:
      node.shape === "diamond"
        ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
        : undefined,
    boxShadow: active ? `0 18px 42px ${accent}55` : `0 12px 24px ${accent}22`,
    transform: active ? "translateY(-2px)" : "translateY(0)",
  };

  return (
    <button
      type="button"
      data-node-id={node.id}
      data-mindmap-node="true"
      className="absolute flex items-center justify-center border px-4 py-3 text-center text-sm font-semibold tracking-tight transition-[transform,box-shadow,border-color] duration-150"
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => void onPointerUp(event)}
      onPointerCancel={(event) => void onPointerUp(event)}
    >
      <span
        className={node.shape === "diamond" ? "block -rotate-45" : "block"}
        style={{ maxWidth: node.shape === "diamond" ? 110 : node.width - 28 }}
      >
        {node.label}
      </span>
    </button>
  );
});

function NodePreviewCard({
  node,
  active,
}: {
  node: MindMapNodeData;
  active: boolean;
}) {
  const accent = colorFromHex(node.colorHex);
  const foreground = foregroundForNode(accent);
  const sharedStyle: CSSProperties = {
    width: node.shape === "diamond" ? Math.min(node.width, node.height) : node.width,
    height: node.shape === "diamond" ? Math.min(node.width, node.height) : node.height,
    background: accent,
    color: foreground,
    borderColor: active ? foreground : `${foreground}44`,
    boxShadow: active ? `0 18px 42px ${accent}55` : `0 12px 24px ${accent}22`,
  };
  if (node.shape === "diamond") {
    return (
      <div
        className="flex items-center justify-center border text-center text-sm font-semibold"
        style={{
          ...sharedStyle,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }}
      >
        <span className="block max-w-[120px] -rotate-45 px-3">{node.label}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center border px-4 py-3 text-center text-sm font-semibold"
      style={{
        ...sharedStyle,
        borderRadius:
          node.shape === "rounded" ? "999px" : node.shape === "ellipse" ? "999px" : "18px",
      }}
    >
      <span className="block max-w-[180px]">{node.label}</span>
    </div>
  );
}

function MetricLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-border/50 bg-background/40 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMindMapPreview({ document }: { document: MindMapDocument }) {
  if (!document.nodes.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-secondary">
        Sem nós para pré-visualizar.
      </div>
    );
  }

  const bounds = documentBounds(document);
  const padding = 48;
  const width = 640;
  const height = 220;
  const contentWidth = Math.max(bounds.right - bounds.left, 1);
  const contentHeight = Math.max(bounds.bottom - bounds.top, 1);
  const scale = clamp(
    Math.min((width - padding * 2) / contentWidth, (height - padding * 2) / contentHeight),
    0.18,
    0.72,
  );
  const offsetX = (width - contentWidth * scale) / 2 - bounds.left * scale;
  const offsetY = (height - contentHeight * scale) / 2 - bounds.top * scale;

  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(rgba(207,216,227,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(207,216,227,0.12)_1px,transparent_1px)] bg-[size:40px_40px]">
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`}>
        {document.connections.map((connection) => {
          const source = document.nodes.find((item) => item.id === connection.sourceId);
          const target = document.nodes.find((item) => item.id === connection.targetId);
          if (!source || !target) return null;

          const sourceCenter = {
            x: offsetX + (source.x + source.width / 2) * scale,
            y: offsetY + (source.y + source.height / 2) * scale,
          };
          const targetCenter = {
            x: offsetX + (target.x + target.width / 2) * scale,
            y: offsetY + (target.y + target.height / 2) * scale,
          };
          const controlOffset = Math.max(36, Math.abs(targetCenter.x - sourceCenter.x) * 0.32);

          return (
            <path
              key={connection.id}
              d={`M ${sourceCenter.x} ${sourceCenter.y} C ${sourceCenter.x + controlOffset} ${sourceCenter.y}, ${targetCenter.x - controlOffset} ${targetCenter.y}, ${targetCenter.x} ${targetCenter.y}`}
              fill="none"
              stroke="rgba(144,164,174,0.72)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      {document.nodes.map((node) => {
        const widthPx = Math.max(74, node.width * scale);
        const heightPx = Math.max(44, node.height * scale);
        const accent = colorFromHex(node.colorHex);
        const foreground = foregroundForNode(accent);
        const size = node.shape === "diamond" ? Math.min(widthPx, heightPx) : undefined;

        return (
          <div
            key={node.id}
            className="absolute flex items-center justify-center border px-2 py-1 text-center text-[11px] font-bold"
            style={{
              left: offsetX + node.x * scale,
              top: offsetY + node.y * scale,
              width: size ?? widthPx,
              height: size ?? heightPx,
              background: accent,
              color: foreground,
              borderColor: `${foreground}44`,
              borderRadius:
                node.shape === "rounded"
                  ? "999px"
                  : node.shape === "ellipse"
                    ? "999px"
                    : node.shape === "rectangle"
                      ? "14px"
                      : "0px",
              clipPath:
                node.shape === "diamond"
                  ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                  : undefined,
            }}
          >
            <span className={node.shape === "diamond" ? "-rotate-45" : ""}>{node.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function mindMapContextLabels(
  map: MindMapRow,
  tracks: TrackBlueprint[],
  projects: ProjectBundle[],
) {
  const track = tracks.find((item) => item.track.id === map.track_id);
  const linkedModule = tracks
    .flatMap((item) => item.modules)
    .find((item) => item.id === map.module_id);
  const project = projects.find((item) => item.project.id === map.project_id);

  return [
    ...(track ? [track.track.name] : []),
    ...(linkedModule ? [linkedModule.title] : []),
    ...(project ? [project.project.title] : []),
  ];
}

function sizeForShape(shape: MindMapNodeShape) {
  switch (shape) {
    case "rectangle":
      return { width: 220, height: 110 };
    case "rounded":
      return { width: 220, height: 116 };
    case "ellipse":
      return { width: 236, height: 132 };
    case "diamond":
      return { width: 164, height: 164 };
  }
}

function defaultColorForShape(shape: MindMapNodeShape) {
  switch (shape) {
    case "rectangle":
      return "#005F73";
    case "rounded":
      return "#2EC5FF";
    case "ellipse":
      return "#FFC857";
    case "diamond":
      return "#35D39A";
  }
}

function shapeLabel(shape: MindMapNodeShape) {
  switch (shape) {
    case "rectangle":
      return "Retângulo";
    case "rounded":
      return "Bloco";
    case "ellipse":
      return "Elipse";
    case "diamond":
      return "Losango";
  }
}

function foregroundForNode(fill: string) {
  const normalized = colorFromHex(fill).replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance =
    (0.2126 * channelToLinear(red) +
      0.7152 * channelToLinear(green) +
      0.0722 * channelToLinear(blue)) /
    255;

  return luminance > 0.58 ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.96)";
}

function channelToLinear(value: number) {
  return value <= 10 ? value / 12.92 : Math.pow((value / 255 + 0.055) / 1.055, 2.4) * 255;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isSameConnection(
  connection: { sourceId: string; targetId: string },
  pair: { sourceId: string; targetId: string },
) {
  return (
    (connection.sourceId === pair.sourceId && connection.targetId === pair.targetId) ||
    (connection.sourceId === pair.targetId && connection.targetId === pair.sourceId)
  );
}

function nextNodePosition(
  document: MindMapDocument,
  options: { width: number; height: number; baseNode: MindMapNodeData | null },
) {
  let candidate = {
    x: options.baseNode ? options.baseNode.x + options.baseNode.width + 88 : 320,
    y: options.baseNode ? options.baseNode.y + 18 : 440,
  };

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const overlaps = document.nodes.some((node) =>
      rectanglesOverlap(
        {
          x: candidate.x - 24,
          y: candidate.y - 24,
          width: options.width + 48,
          height: options.height + 48,
        },
        {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
        },
      ),
    );

    if (!overlaps) {
      break;
    }

    candidate = {
      x: candidate.x + 46,
      y: candidate.y + 42,
    };
  }

  return {
    x: clamp(candidate.x, 0, BOARD_WIDTH - options.width),
    y: clamp(candidate.y, 0, BOARD_HEIGHT - options.height),
  };
}

function rectanglesOverlap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
) {
  return !(
    left.x + left.width < right.x ||
    right.x + right.width < left.x ||
    left.y + left.height < right.y ||
    right.y + right.height < left.y
  );
}

function otherNode(
  document: MindMapDocument,
  connection: { sourceId: string; targetId: string },
  currentNodeId: string,
) {
  const relatedId =
    connection.sourceId === currentNodeId ? connection.targetId : connection.sourceId;
  return document.nodes.find((item) => item.id === relatedId) ?? null;
}

function documentBounds(document: MindMapDocument) {
  const left = Math.min(...document.nodes.map((item) => item.x));
  const top = Math.min(...document.nodes.map((item) => item.y));
  const right = Math.max(...document.nodes.map((item) => item.x + item.width));
  const bottom = Math.max(...document.nodes.map((item) => item.y + item.height));
  return { left, top, right, bottom };
}

function computeFitView(
  document: MindMapDocument,
  viewport: { width: number; height: number },
): ViewState {
  if (!document.nodes.length || !viewport.width || !viewport.height) {
    return DEFAULT_VIEW_STATE;
  }

  const bounds = documentBounds(document);
  const padding = 120;
  const left = Math.max(0, bounds.left - padding);
  const top = Math.max(0, bounds.top - padding);
  const right = Math.min(BOARD_WIDTH, bounds.right + padding);
  const bottom = Math.min(BOARD_HEIGHT, bounds.bottom + padding);
  const targetWidth = Math.max(right - left, 1);
  const targetHeight = Math.max(bottom - top, 1);
  const scale = clamp(
    Math.min(viewport.width / targetWidth, viewport.height / targetHeight, 1),
    MIN_SCALE,
    MAX_SCALE,
  );

  return {
    scale,
    offsetX: (viewport.width - targetWidth * scale) / 2 - left * scale,
    offsetY: (viewport.height - targetHeight * scale) / 2 - top * scale,
  };
}
