"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowUpDown,
  Download,
  Filter,
  History,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { LEGAL_BASIS_OPTIONS } from "@/lib/legalBasisOptions";
type TabKey = "ativas" | "arquivadas";

type ImportHistoryItem = {
  id: string;
  fileName: string;
  status: "CONCLUIDO" | "ERRO" | string;
  message: string;
  inserted: number;
  updated: number;
  total: number;
  errorDetails?: Array<{ rowIndex: number; message: string }> | null;
  createdAt: string;
};

type ProcessingActivity = {
  id: string;
  activityName: string;
  activityCode: string;
  personalData: string;
  purpose: string;
  legalBasis: string;
  purposes: Array<{
    id: string;
    purpose: string;
    retentionDeadline: string;
    legalBasis: string;
  }>;
  personalDataItems: Array<{
    id: string;
    category: string;
    dataName: string;
    sensitive: boolean;
    subjectTypes: string[];
    sync: boolean;
  }>;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeHeader(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return s.replace(/\s+/g, " ");
}

function downloadCsvModel() {
  const header = [
    "Nome da Atividade de Tratamento",
    "Código da Atividade de Tratamento",
    "Dados Pessoais",
    "Finalidade",
    "Hipótese Legal",
  ];

  const example = [
    "Cadastro de clientes",
    "AT-001",
    "Nome; E-mail; Telefone",
    "Criar conta e prestar atendimento",
    "Execução de contrato",
  ];

  const csv =
    `${header.map(h => `"${h}"`).join(",")}\n` +
    `${example.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")}\n`;

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "modelo_atividades_tratamento.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCsvExport(rows: ProcessingActivity[], fileName: string) {
  const header = [
    "Nome da Atividade de Tratamento",
    "Código da Atividade de Tratamento",
    "Dados Pessoais",
    "Finalidade",
    "Hipótese Legal",
  ];

  const csvLines = [
    header.map(h => `"${h.replaceAll('"', '""')}"`).join(","),
    ...rows.map((r) => {
      const purpose = r.purposes?.[0]?.purpose || r.purpose || "";
      const legalBasis = r.purposes?.[0]?.legalBasis || r.legalBasis || "";
      const personalData = r.personalData || r.personalDataItems?.map(i => i.dataName).join("; ") || "";
      const values = [
        r.activityName,
        r.activityCode,
        personalData,
        purpose,
        legalBasis,
      ];
      return values.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",");
    }),
  ];

  const blob = new Blob(["\ufeff" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AtividadesTratamentoClient({ initialTab }: { initialTab: TabKey }) {
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showImportHistory, setShowImportHistory] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [loadingImportHistory, setLoadingImportHistory] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    inserted: number;
    updated: number;
    total: number;
    errors: Array<{ rowIndex: number; message: string }>;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const [tab, setTabState] = useState<TabKey>(initialTab);

  const [createForm, setCreateForm] = useState({
    activityName: "",
    activityCode: "",
    personalData: "",
    purpose: "",
    legalBasis: "",
  });

  const fetchActivities = async (archived: boolean | null) => {
    try {
      setErrorMessage("");
      const qs = archived === null ? "" : `?archived=${archived ? "1" : "0"}`;
      const response = await fetch(`/api/atividades${qs}`);
      const data = await response.json();
      if (response.ok) {
        setActivities(data);
      } else {
        setActivities([]);
        setErrorMessage(data?.message || "Não foi possível carregar as atividades.");
      }
    } catch {
      setActivities([]);
      setErrorMessage("Não foi possível carregar as atividades.");
    } finally {
      setLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      setLoadingImportHistory(true);
      const response = await fetch("/api/atividades/import/history");
      const data = await response.json();
      if (response.ok) {
        setImportHistory(Array.isArray(data) ? data : []);
      } else {
        alert(data?.message || "Não foi possível carregar as importações.");
      }
    } catch {
      alert("Não foi possível carregar as importações.");
    } finally {
      setLoadingImportHistory(false);
    }
  };

  const recordImportFailure = async (fileName: string, message: string) => {
    try {
      await fetch("/api/atividades/import/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName, message }),
      });
      await fetchImportHistory();
    } catch {
      // A mensagem principal ja aparece para o usuario no fluxo de importacao.
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === "arquivadas") {
      fetchActivities(true);
      return;
    }
    fetchActivities(false);
  }, [tab]);

  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter(a =>
      [
        a.activityName,
        a.activityCode,
        a.personalData,
        a.purpose,
        a.legalBasis,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [activities, searchTerm]);

  const parseSpreadsheet = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[][];

    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map(normalizeHeader);
    const indexOf = (columnName: string) => {
      const target = normalizeHeader(columnName);
      return headers.findIndex(h => h === target);
    };

    const requiredColumns = [
      "Nome da Atividade de Tratamento",
      "Código da Atividade de Tratamento",
      "Dados Pessoais",
      "Finalidade",
      "Hipótese Legal",
    ] as const;

    const idxNome = indexOf(requiredColumns[0]);
    const idxCodigo = indexOf(requiredColumns[1]);
    const idxDados = indexOf(requiredColumns[2]);
    const idxFinalidade = indexOf(requiredColumns[3]);
    const idxHipotese = indexOf(requiredColumns[4]);

    const missing = requiredColumns.filter((col) => indexOf(col) === -1);
    if (missing.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios ausentes: ${missing.join(", ")}`);
    }

    const mapped = rows.slice(1).map((r) => {
      const get = (idx: number) => (idx >= 0 ? String(r[idx] ?? "").trim() : "");
      return {
        nomeAtividadeTratamento: get(idxNome),
        codigoAtividadeTratamento: get(idxCodigo),
        dadosPessoais: get(idxDados),
        finalidade: get(idxFinalidade),
        hipoteseLegal: get(idxHipotese),
      };
    });

    return mapped.filter(r =>
      r.nomeAtividadeTratamento ||
      r.codigoAtividadeTratamento ||
      r.dadosPessoais ||
      r.finalidade ||
      r.hipoteseLegal
    );
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setImportSummary(null);
    setImporting(true);

    try {
      const rows = await parseSpreadsheet(file);
      const response = await fetch("/api/atividades/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, rows }),
      });

      const data = await response.json();
      if (!response.ok) {
        await fetchImportHistory();
        alert(data?.message || "Erro ao importar planilha.");
        return;
      }

      setImportSummary(data);
      await fetchImportHistory();
      await fetchActivities(tab === "arquivadas" ? true : false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao ler/importar a planilha.";
      await recordImportFailure(file.name, msg);
      alert(msg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const metrics = useMemo(() => {
    const active = activities;
    const personalDataCount = new Set(
      active.flatMap(a => (a.personalDataItems || []).map(i => i.dataName.trim()).filter(Boolean))
    ).size;
    const purposesCount = new Set(
      active.flatMap(a => (a.purposes || []).map(p => p.purpose.trim()).filter(Boolean))
    ).size;
    const legalBasesCount = new Set(
      active.flatMap(a => (a.purposes || []).map(p => p.legalBasis.trim()).filter(Boolean))
    ).size;
    return {
      activities: active.length,
      personalData: personalDataCount,
      purposes: purposesCount,
      legalBases: legalBasesCount,
    };
  }, [activities]);

  const setTab = (next: TabKey) => {
    setTabState(next);
    router.push(`/atividades-tratamento?tab=${next}`);
  };

  const archiveToggle = async (id: string, toArchived: boolean) => {
    const endpoint = toArchived ? "arquivar" : "desarquivar";
    const response = await fetch(`/api/atividades/${id}/${endpoint}`, { method: "POST" });
    if (!response.ok) {
      alert("Não foi possível atualizar o status.");
      return;
    }
    await fetchActivities(tab === "arquivadas" ? true : false);
  };

  const deleteActivity = async (activity: ProcessingActivity) => {
    const confirmed = window.confirm(
      `Excluir definitivamente "${activity.activityName}"? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;

    const response = await fetch(`/api/atividades/${activity.id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data?.message || "Não foi possível excluir a atividade.");
      return;
    }
    await fetchActivities(tab === "arquivadas" ? true : false);
  };

  const createActivity = async () => {
    const payload = {
      activityName: createForm.activityName,
      activityCode: createForm.activityCode,
      personalData: createForm.personalData,
      purpose: createForm.purpose,
      legalBasis: createForm.legalBasis,
    };
    const response = await fetch("/api/atividades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      alert(data?.message || "Erro ao criar atividade.");
      return;
    }
    setCreating(false);
    setCreateForm({ activityName: "", activityCode: "", personalData: "", purpose: "", legalBasis: "" });
    await fetchActivities(false);
  };

  return (
    <main className="max-w-6xl mx-auto w-full p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Atividades de Tratamento</h1>
        <p className="text-gray-600 mt-2">
          Administre e alimente seus dados garantindo segurança e conformidade. Use as abas para organizar seu inventário (ROPA).
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm font-semibold text-gray-500">
        <button
          className={`pb-3 ${tab === "ativas" ? "text-contix-primary border-b-2 border-contix-primary" : "hover:text-gray-700"}`}
          onClick={() => setTab("ativas")}
        >
          Atividades de Tratamento
        </button>
        <button
          className={`pb-3 ${tab === "arquivadas" ? "text-contix-primary border-b-2 border-contix-primary" : "hover:text-gray-700"}`}
          onClick={() => setTab("arquivadas")}
        >
          Arquivados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-contix-primary/10 flex items-center justify-center text-contix-primary font-bold">
            A
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">Atividades de Tratamento</div>
            <div className="text-xl font-bold text-gray-900">{metrics.activities}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
            D
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">Dados pessoais</div>
            <div className="text-xl font-bold text-gray-900">{metrics.personalData}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
            F
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">Finalidades</div>
            <div className="text-xl font-bold text-gray-900">{metrics.purposes}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
            B
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-700">Bases Legais</div>
            <div className="text-xl font-bold text-gray-900">{metrics.legalBases}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl w-full">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar Nome da Atividade de Tratamento"
                className="w-full outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <label className={`p-2.5 rounded-xl border border-gray-200 ${importing ? "opacity-50" : "hover:bg-gray-50 cursor-pointer"}`} title="Importar">
              <Upload size={18} className="text-contix-primary" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={importing}
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Baixar modelo"
              onClick={downloadCsvModel}
            >
              <Download size={18} className="text-contix-primary" />
            </button>
            <button
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Colunas"
              onClick={() => alert("Configuração de colunas em breve.")}
            >
              <ArrowUpDown size={18} className="text-contix-primary" />
            </button>
            <button
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Importações"
              onClick={() => {
                setShowImportHistory(true);
                fetchImportHistory();
              }}
            >
              <History size={18} className="text-contix-primary" />
            </button>
            <button
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50"
              title="Filtro"
              onClick={() => alert("Filtros em breve.")}
            >
              <Filter size={18} className="text-contix-primary" />
            </button>
            <button
              className="flex items-center gap-2 bg-contix-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-opacity-90"
              onClick={() => setCreating(true)}
              disabled={tab !== "ativas"}
              title={tab !== "ativas" ? "Disponível apenas em Ativas" : "Criar atividade"}
            >
              <Plus size={18} /> Atividade de Tratamento
            </button>
          </div>
        </div>

        {importSummary && (
          <div className="px-5 pt-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="font-bold text-gray-800">
                  Importação concluída: {importSummary.inserted} inseridas, {importSummary.updated} atualizadas (total lidas: {importSummary.total})
                </div>
                <button
                  onClick={() => setImportSummary(null)}
                  className="text-sm font-bold text-contix-primary hover:underline"
                >
                  Limpar
                </button>
              </div>
              {importSummary.errors?.length > 0 && (
                <div className="mt-4 text-sm">
                  <div className="font-bold text-red-600 mb-2">Erros ({importSummary.errors.length})</div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-700 space-y-1">
                    {importSummary.errors.slice(0, 8).map((e, i) => (
                      <div key={`${e.rowIndex}-${i}`}>Linha {e.rowIndex}: {e.message}</div>
                    ))}
                    {importSummary.errors.length > 8 && (
                      <div>… e mais {importSummary.errors.length - 8}.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-contix-primary"></div>
            </div>
          ) : errorMessage ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
              <div className="font-bold">Banco de dados ainda não está pronto.</div>
              <div className="text-sm mt-1">{errorMessage}</div>
              <div className="text-sm mt-3">
                Configure o PostgreSQL, crie o arquivo `.env` e rode `npm run prisma:migrate`.
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-600">
              Nenhuma atividade encontrada.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider w-10"></th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Nome do tratamento</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Dados pessoais</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Finalidades</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Bases legais</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredActivities.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="h-4 w-4" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{a.activityName}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.activityCode || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{(a.personalDataItems?.length ?? 0) || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">{(a.purposes?.length ?? 0) || "-"}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Set((a.purposes || []).map(p => p.legalBasis).filter(Boolean)).size || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/atividades-tratamento/${a.id}`}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700"
                          >
                            Abrir
                          </Link>
                          {tab === "ativas" ? (
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              title="Arquivar"
                              onClick={() => archiveToggle(a.id, true)}
                            >
                              <Archive size={16} className="text-gray-700" />
                            </button>
                          ) : (
                            <button
                              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-700"
                              onClick={() => archiveToggle(a.id, false)}
                            >
                              Desarquivar
                            </button>
                          )}
                          <button
                            className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                            title="Excluir definitivamente"
                            onClick={() => deleteActivity(a)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-4 flex items-center justify-end gap-4 text-sm text-gray-500">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  onClick={() => downloadCsvExport(filteredActivities, "atividades_tratamento.csv")}
                >
                  <Download size={16} /> Exportar CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showImportHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-gray-900">Planilhas importadas</div>
                <div className="text-sm text-gray-500 mt-1">
                  Acompanhe as importações concluídas e os erros encontrados.
                </div>
              </div>
              <button
                className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                onClick={() => setShowImportHistory(false)}
              >
                Fechar
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-auto">
              {loadingImportHistory ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-contix-primary"></div>
                </div>
              ) : importHistory.length === 0 ? (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-600">
                  Nenhuma planilha importada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {importHistory.map((item) => {
                    const isDone = item.status === "CONCLUIDO";
                    const details = Array.isArray(item.errorDetails) ? item.errorDetails : [];
                    return (
                      <div key={item.id} className="border border-gray-200 rounded-2xl p-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <div className="font-bold text-gray-900">{item.fileName}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(item.createdAt).toLocaleString("pt-BR")}
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              isDone
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}
                          >
                            {isDone ? "Concluído" : "Erro"}
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-700">{item.message}</div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <div className="text-gray-500">Inseridas</div>
                            <div className="font-bold text-gray-900">{item.inserted}</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <div className="text-gray-500">Atualizadas</div>
                            <div className="font-bold text-gray-900">{item.updated}</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <div className="text-gray-500">Total</div>
                            <div className="font-bold text-gray-900">{item.total}</div>
                          </div>
                        </div>

                        {details.length > 0 && (
                          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700 space-y-1">
                            {details.slice(0, 6).map((detail, index) => (
                              <div key={`${item.id}-${index}`}>
                                {detail.rowIndex ? `Linha ${detail.rowIndex}: ` : ""}
                                {detail.message}
                              </div>
                            ))}
                            {details.length > 6 && (
                              <div>... e mais {details.length - 6}.</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <div className="text-lg font-bold text-gray-900">Nova Atividade de Tratamento</div>
              <div className="text-sm text-gray-500 mt-1">Você pode editar os detalhes depois.</div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Nome da Atividade de Tratamento</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={createForm.activityName}
                  onChange={(e) => setCreateForm({ ...createForm, activityName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Código da Atividade de Tratamento</label>
                  <input
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                    value={createForm.activityCode}
                    onChange={(e) => setCreateForm({ ...createForm, activityCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Hipótese Legal</label>
                  <select
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none bg-white"
                    value={createForm.legalBasis}
                    onChange={(e) => setCreateForm({ ...createForm, legalBasis: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {LEGAL_BASIS_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Finalidade</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={createForm.purpose}
                  onChange={(e) => setCreateForm({ ...createForm, purpose: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Dados Pessoais</label>
                <textarea
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none min-h-24"
                  value={createForm.personalData}
                  onChange={(e) => setCreateForm({ ...createForm, personalData: e.target.value })}
                  placeholder="Ex.: Nome; E-mail; CPF"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-between">
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-contix-primary text-white font-bold hover:bg-opacity-90"
                onClick={createActivity}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

