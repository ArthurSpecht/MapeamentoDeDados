"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Save, Trash2, X, Plus } from "lucide-react";
import { LEGAL_BASIS_OPTIONS } from "@/lib/legalBasisOptions";

type TabKey = "informacoes" | "finalidades" | "dados-pessoais";

type ActivityPurpose = {
  id: string;
  purpose: string;
  retentionDeadline: string;
  legalBasis: string;
};

type PersonalDataItem = {
  id: string;
  category: string;
  dataName: string;
  sensitive: boolean;
  subjectTypes: string[];
  sync: boolean;
};

type ProcessingActivity = {
  id: string;
  activityName: string;
  activityCode: string;
  personalData: string;
  purpose: string;
  legalBasis: string;
  purposes: ActivityPurpose[];
  personalDataItems: PersonalDataItem[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-contix-primary/10 text-contix-primary">
      {children}
    </span>
  );
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
        ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      {label}
    </span>
  );
}

export default function AtividadeDetalheClient({
  id,
  initialTab,
}: {
  id: string;
  initialTab: TabKey;
}) {
  const router = useRouter();
  const [tab, setTabState] = useState<TabKey>(initialTab);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activity, setActivity] = useState<ProcessingActivity | null>(null);

  const [infoForm, setInfoForm] = useState({
    activityName: "",
    activityCode: "",
  });

  const [purposeSearch, setPurposeSearch] = useState("");
  const [personalSearch, setPersonalSearch] = useState("");

  const [purposeModal, setPurposeModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    id: string | null;
    purpose: string;
    retentionDeadline: string;
    legalBasis: string;
  }>({ open: false, mode: "create", id: null, purpose: "", retentionDeadline: "Indeterminado", legalBasis: "" });

  const [personalModal, setPersonalModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    id: string | null;
    category: string;
    dataName: string;
    sensitive: boolean;
    subjectTypes: string;
    sync: boolean;
  }>({ open: false, mode: "create", id: null, category: "Geral", dataName: "", sensitive: false, subjectTypes: "Titular", sync: false });

  const fetchActivity = async () => {
    setLoading(true);
    try {
      setErrorMessage("");
      const res = await fetch(`/api/atividades/${id}`);
      if (res.status === 404) {
        router.push("/atividades-tratamento");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setActivity(null);
        setErrorMessage(data?.message || "Não foi possível carregar a atividade.");
        return;
      }
      setActivity(data);
      setInfoForm({
        activityName: data.activityName || "",
        activityCode: data.activityCode || "",
      });
    } catch {
      setActivity(null);
      setErrorMessage("Não foi possível carregar a atividade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const setTab = (next: TabKey) => {
    setTabState(next);
    router.push(`/atividades-tratamento/${id}?tab=${next}`);
  };

  const saveInfo = async () => {
    if (!infoForm.activityName.trim()) {
      alert("Nome da Atividade de Tratamento é obrigatório.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/atividades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityName: infoForm.activityName,
          activityCode: infoForm.activityCode,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data?.message || "Erro ao salvar.");
        return;
      }
      await fetchActivity();
    } finally {
      setSaving(false);
    }
  };

  const purposesFiltered = useMemo(() => {
    const list = activity?.purposes || [];
    const term = purposeSearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter(p =>
      [p.purpose, p.legalBasis, p.retentionDeadline].join(" ").toLowerCase().includes(term)
    );
  }, [activity, purposeSearch]);

  const personalFiltered = useMemo(() => {
    const list = activity?.personalDataItems || [];
    const term = personalSearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter(i =>
      [i.category, i.dataName, i.subjectTypes.join(" "), i.sensitive ? "sensivel" : "nao", i.sync ? "sim" : "nao"]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [activity, personalSearch]);

  const upsertPurpose = async () => {
    if (!activity) return;
    if (!purposeModal.purpose.trim()) {
      alert("Finalidade é obrigatória.");
      return;
    }
    const nextPurposes: ActivityPurpose[] = [...(activity.purposes || [])];
    if (purposeModal.mode === "create") {
      nextPurposes.unshift({
        id: crypto.randomUUID(),
        purpose: purposeModal.purpose.trim(),
        retentionDeadline: purposeModal.retentionDeadline.trim() || "Indeterminado",
        legalBasis: purposeModal.legalBasis.trim(),
      });
    } else {
      const idx = nextPurposes.findIndex(p => p.id === purposeModal.id);
      if (idx !== -1) {
        nextPurposes[idx] = {
          ...nextPurposes[idx],
          purpose: purposeModal.purpose.trim(),
          retentionDeadline: purposeModal.retentionDeadline.trim() || "Indeterminado",
          legalBasis: purposeModal.legalBasis.trim(),
        };
      }
    }
    const res = await fetch(`/api/atividades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purposes: nextPurposes }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data?.message || "Erro ao salvar finalidade.");
      return;
    }
    setPurposeModal({ open: false, mode: "create", id: null, purpose: "", retentionDeadline: "Indeterminado", legalBasis: "" });
    await fetchActivity();
  };

  const deletePurpose = async (purposeId: string) => {
    if (!activity) return;
    const nextPurposes = (activity.purposes || []).filter(p => p.id !== purposeId);
    const res = await fetch(`/api/atividades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purposes: nextPurposes }),
    });
    if (!res.ok) {
      alert("Erro ao remover finalidade.");
      return;
    }
    await fetchActivity();
  };

  const upsertPersonal = async () => {
    if (!activity) return;
    if (!personalModal.dataName.trim()) {
      alert("Dado pessoal é obrigatório.");
      return;
    }
    const nextItems: PersonalDataItem[] = [...(activity.personalDataItems || [])];
    const subjectTypes = personalModal.subjectTypes
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const item: PersonalDataItem = {
      id: personalModal.mode === "create" ? crypto.randomUUID() : String(personalModal.id),
      category: personalModal.category.trim() || "Geral",
      dataName: personalModal.dataName.trim(),
      sensitive: !!personalModal.sensitive,
      subjectTypes: subjectTypes.length ? subjectTypes : ["Titular"],
      sync: !!personalModal.sync,
    };
    if (personalModal.mode === "create") {
      nextItems.unshift(item);
    } else {
      const idx = nextItems.findIndex(i => i.id === personalModal.id);
      if (idx !== -1) nextItems[idx] = item;
    }
    const res = await fetch(`/api/atividades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalDataItems: nextItems }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data?.message || "Erro ao salvar dado pessoal.");
      return;
    }
    setPersonalModal({ open: false, mode: "create", id: null, category: "Geral", dataName: "", sensitive: false, subjectTypes: "Titular", sync: false });
    await fetchActivity();
  };

  const deletePersonal = async (personalId: string) => {
    if (!activity) return;
    const nextItems = (activity.personalDataItems || []).filter(i => i.id !== personalId);
    const res = await fetch(`/api/atividades/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalDataItems: nextItems }),
    });
    if (!res.ok) {
      alert("Erro ao remover dado pessoal.");
      return;
    }
    await fetchActivity();
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto w-full p-8">
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-contix-primary"></div>
        </div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="max-w-7xl mx-auto w-full p-8">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-amber-900">
          <div className="text-xl font-bold">Atividade indisponível</div>
          <div className="mt-2">{errorMessage || "Não foi possível carregar a atividade."}</div>
        </div>
      </main>
    );
  }

  if (!activity) {
    return (
      <main className="max-w-6xl mx-auto w-full p-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-8">Atividade não encontrada.</div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto w-full p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">
            <Link href="/atividades-tratamento" className="hover:underline text-contix-primary font-semibold">
              Atividades de Tratamento
            </Link>{" "}
            / {activity.activityName}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{activity.activityName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {activity.activityCode ? <Badge>{activity.activityCode}</Badge> : null}
            {activity.archived ? <StatusBadge ok={false} label="Arquivada" /> : <StatusBadge ok={true} label="Ativa" />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/atividades-tratamento"
            className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
          >
            Voltar
          </Link>
          <button
            className="px-5 py-2.5 rounded-xl bg-contix-primary text-white font-bold hover:bg-opacity-90 flex items-center gap-2 disabled:opacity-50"
            onClick={saveInfo}
            disabled={saving || tab !== "informacoes"}
            title={tab !== "informacoes" ? "Salve na aba Informações" : "Salvar"}
          >
            <Save size={18} /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6 flex gap-6 text-sm font-semibold text-gray-500 overflow-x-auto">
        <button
          className={`pb-3 whitespace-nowrap ${tab === "informacoes" ? "text-contix-primary border-b-2 border-contix-primary" : "hover:text-gray-700"}`}
          onClick={() => setTab("informacoes")}
        >
          Informações
        </button>
        <button
          className={`pb-3 whitespace-nowrap ${tab === "finalidades" ? "text-contix-primary border-b-2 border-contix-primary" : "hover:text-gray-700"}`}
          onClick={() => setTab("finalidades")}
        >
          Finalidades
        </button>
        <button
          className={`pb-3 whitespace-nowrap ${tab === "dados-pessoais" ? "text-contix-primary border-b-2 border-contix-primary" : "hover:text-gray-700"}`}
          onClick={() => setTab("dados-pessoais")}
        >
          Dados Pessoais
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6">
        {tab === "informacoes" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Nome da Atividade de Tratamento</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={infoForm.activityName}
                  onChange={(e) => setInfoForm({ ...infoForm, activityName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Código da Atividade de Tratamento</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={infoForm.activityCode}
                  onChange={(e) => setInfoForm({ ...infoForm, activityCode: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-bold text-gray-700">Criado em</div>
                <div>{new Date(activity.createdAt).toLocaleString("pt-BR")}</div>
              </div>
              <div>
                <div className="font-bold text-gray-700">Atualizado em</div>
                <div>{new Date(activity.updatedAt).toLocaleString("pt-BR")}</div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "finalidades" ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div className="text-2xl font-bold text-gray-900">Finalidades</div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl w-full md:w-96">
                  <input
                    className="w-full outline-none text-sm"
                    placeholder="Pesquisar"
                    value={purposeSearch}
                    onChange={(e) => setPurposeSearch(e.target.value)}
                  />
                </div>
                <button
                  className="flex items-center gap-2 bg-contix-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-opacity-90"
                  onClick={() => setPurposeModal({ open: true, mode: "create", id: null, purpose: "", retentionDeadline: "Indeterminado", legalBasis: "" })}
                >
                  <Plus size={18} /> Finalidade
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Finalidade</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Data limite para retenção</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Bases Legais</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purposesFiltered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-gray-500" colSpan={4}>
                        Nenhuma finalidade cadastrada.
                      </td>
                    </tr>
                  ) : (
                    purposesFiltered.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{p.purpose || "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-violet-50 text-violet-700">
                            {p.retentionDeadline || "Indeterminado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{p.legalBasis || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              onClick={() => setPurposeModal({ open: true, mode: "edit", id: p.id, purpose: p.purpose, retentionDeadline: p.retentionDeadline || "Indeterminado", legalBasis: p.legalBasis })}
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              onClick={() => deletePurpose(p.id)}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "dados-pessoais" ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <div className="text-2xl font-bold text-gray-900">Dados Pessoais</div>
                <div className="text-sm text-gray-500 mt-1">
                  Indique quais dados pessoais são tratados e categorize conforme necessário.
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl w-full md:w-96">
                  <input
                    className="w-full outline-none text-sm"
                    placeholder="Pesquisar"
                    value={personalSearch}
                    onChange={(e) => setPersonalSearch(e.target.value)}
                  />
                </div>
                <button
                  className="flex items-center gap-2 bg-contix-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-opacity-90"
                  onClick={() => setPersonalModal({ open: true, mode: "create", id: null, category: "Geral", dataName: "", sensitive: false, subjectTypes: "Titular", sync: false })}
                >
                  <Plus size={18} /> Adicionar
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Categoria</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Dado pessoal</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Dado sensível?</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Tipos de titulares</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Sincronismo</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {personalFiltered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-gray-500" colSpan={6}>
                        Nenhum dado pessoal cadastrado.
                      </td>
                    </tr>
                  ) : (
                    personalFiltered.map((i) => (
                      <tr key={i.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{i.category || "-"}</td>
                        <td className="px-4 py-3 text-gray-900">{i.dataName}</td>
                        <td className="px-4 py-3 text-gray-700">{i.sensitive ? "Sim" : "Não"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {(i.subjectTypes || []).map((s) => (
                              <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {i.sync ? <StatusBadge ok={true} label="Sim" /> : <StatusBadge ok={false} label="Não" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              onClick={() =>
                                setPersonalModal({
                                  open: true,
                                  mode: "edit",
                                  id: i.id,
                                  category: i.category,
                                  dataName: i.dataName,
                                  sensitive: i.sensitive,
                                  subjectTypes: (i.subjectTypes || []).join(", "),
                                  sync: i.sync,
                                })
                              }
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                              onClick={() => deletePersonal(i.id)}
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      {purposeModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                {purposeModal.mode === "create" ? "Nova Finalidade" : "Editar Finalidade"}
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-50" onClick={() => setPurposeModal({ ...purposeModal, open: false })}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Finalidade</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={purposeModal.purpose}
                  onChange={(e) => setPurposeModal({ ...purposeModal, purpose: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Data limite para retenção</label>
                  <input
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                    value={purposeModal.retentionDeadline}
                    onChange={(e) => setPurposeModal({ ...purposeModal, retentionDeadline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Base legal</label>
                  <select
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none bg-white"
                    value={purposeModal.legalBasis}
                    onChange={(e) => setPurposeModal({ ...purposeModal, legalBasis: e.target.value })}
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
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-between">
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                onClick={() => setPurposeModal({ ...purposeModal, open: false })}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-contix-primary text-white font-bold hover:bg-opacity-90 flex items-center gap-2"
                onClick={upsertPurpose}
              >
                <Check size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {personalModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                {personalModal.mode === "create" ? "Adicionar Dado Pessoal" : "Editar Dado Pessoal"}
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-50" onClick={() => setPersonalModal({ ...personalModal, open: false })}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700">Categoria</label>
                  <input
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                    value={personalModal.category}
                    onChange={(e) => setPersonalModal({ ...personalModal, category: e.target.value })}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={personalModal.sensitive}
                      onChange={(e) => setPersonalModal({ ...personalModal, sensitive: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Dado sensível
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={personalModal.sync}
                      onChange={(e) => setPersonalModal({ ...personalModal, sync: e.target.checked })}
                      className="h-4 w-4"
                    />
                    Sincronismo
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Dado pessoal</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={personalModal.dataName}
                  onChange={(e) => setPersonalModal({ ...personalModal, dataName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Tipos de titulares (separados por vírgula)</label>
                <input
                  className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  value={personalModal.subjectTypes}
                  onChange={(e) => setPersonalModal({ ...personalModal, subjectTypes: e.target.value })}
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex items-center justify-between">
              <button
                className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 hover:bg-gray-50"
                onClick={() => setPersonalModal({ ...personalModal, open: false })}
              >
                Cancelar
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-contix-primary text-white font-bold hover:bg-opacity-90 flex items-center gap-2"
                onClick={upsertPersonal}
              >
                <Check size={18} /> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

