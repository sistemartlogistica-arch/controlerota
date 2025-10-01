import { useState, useEffect } from "react";

interface RegistroModalProps {
  users?: any[];
  vans?: any[];
  rotas?: any[];
  onClose: () => void;
  onRegistroCriado: (registro: any) => void;
}

export default function RegistroModalCompleto({
  users = [],
  vans = [],
  rotas = [],
  onClose,
  onRegistroCriado,
}: RegistroModalProps) {
  const [newRecordUserId, setNewRecordUserId] = useState("");
  const [newRecordVanId, setNewRecordVanId] = useState("");
  const [newRecordRotaId, setNewRecordRotaId] = useState("");
  const [newRecordDataAbertura, setNewRecordDataAbertura] = useState("");
  const [newRecordHoraAbertura, setNewRecordHoraAbertura] = useState("");
  const [newRecordDataFechamento, setNewRecordDataFechamento] = useState("");
  const [newRecordHoraFechamento, setNewRecordHoraFechamento] = useState("");
  const [newRecordKmInicial, setNewRecordKmInicial] = useState("");
  const [newRecordKmFinal, setNewRecordKmFinal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Obter o tipo do usuário selecionado
  const selectedUser = users.find(u => u.uid === newRecordUserId);
  const userType = selectedUser?.tipo || 'motorista';
  const isMotorista = userType === 'motorista';
  const isCopiloto = userType === 'copiloto';


  const handleCreateRecord = async () => {
    // Validações básicas
    if (!newRecordUserId || !newRecordDataAbertura || !newRecordHoraAbertura || !newRecordDataFechamento || !newRecordHoraFechamento) {
      setError("Preencha todos os campos obrigatórios!");
      return;
    }

    // Validações específicas para motorista
    if (isMotorista) {
      if (!newRecordVanId || !newRecordRotaId || !newRecordKmInicial || !newRecordKmFinal) {
        setError("Para motoristas, preencha van, rota, KM inicial e KM final!");
        return;
      }

      const kmInicial = parseInt(newRecordKmInicial);
      const kmFinal = parseInt(newRecordKmFinal);

      if (kmFinal <= kmInicial) {
        setError("KM final deve ser maior que KM inicial!");
        return;
      }
    }

    // Validações específicas para copiloto
    if (isCopiloto) {
      if (!newRecordRotaId) {
        setError("Para copilotos, selecione uma rota!");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      // Preparar dados baseado no tipo do usuário
      const requestData: any = {
        userId: newRecordUserId,
        rotaId: newRecordRotaId,
        dataAbertura: newRecordDataAbertura,
        horaAbertura: newRecordHoraAbertura,
        dataFechamento: newRecordDataFechamento,
        horaFechamento: newRecordHoraFechamento,
      };

      // Adicionar campos específicos para motorista
      if (isMotorista) {
        requestData.vanId = newRecordVanId;
        requestData.kmInicial = parseInt(newRecordKmInicial);
        requestData.kmFinal = parseInt(newRecordKmFinal);
      }

      const response = await fetch("/api/records/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const registro = await response.json();
        onRegistroCriado(registro);
        onClose();
      } else {
        const err = await response.json();
        setError(err.error || "Erro ao criar registro");
      }
    } catch {
      setError("Erro ao criar registro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "8px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>
          Criar Registro Completo
        </h2>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        {/* Usuário */}
        <label>Usuário:</label>
        <select
          value={newRecordUserId}
          onChange={(e) => {
            setNewRecordUserId(e.target.value);
            // Limpar campos específicos quando mudar usuário
            setNewRecordVanId("");
            setNewRecordKmInicial("");
            setNewRecordKmFinal("");
          }}
          style={selectStyle}
        >
          <option value="">Selecione um usuário</option>
          {users.map((u) => (
            <option key={u.uid} value={u.uid}>
              {u.nome || u.email} ({u.tipo === 'copiloto' ? 'Monitora' : 'Motorista'})
            </option>
          ))}
        </select>


        {/* Van - apenas para motoristas */}
        {isMotorista && (
          <>
            <label style={{ marginTop: "15px" }}>Van:</label>
            <select
              value={newRecordVanId}
              onChange={(e) => setNewRecordVanId(e.target.value)}
              style={selectStyle}
            >
              <option value="">Selecione uma van</option>
              {vans.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa} (KM: {v.kmAtual})
                </option>
              ))}
            </select>
          </>
        )}

        {/* Rota */}
        <label style={{ marginTop: "15px" }}>Rota:</label>
        <select
          value={newRecordRotaId}
          onChange={(e) => setNewRecordRotaId(e.target.value)}
          style={selectStyle}
        >
          <option value="">Selecione uma rota</option>
          {rotas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.origem} → {r.destino}
            </option>
          ))}
        </select>

        {/* KM Inicial / Final - apenas para motoristas */}
        {isMotorista && (
          <>
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <div style={{ flex: 1 }}>
                <label>KM Inicial:</label>
                <input
                  type="number"
                  value={newRecordKmInicial}
                  onChange={(e) => setNewRecordKmInicial(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>KM Final:</label>
                <input
                  type="number"
                  value={newRecordKmFinal}
                  onChange={(e) => setNewRecordKmFinal(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Distância calculada */}
            {newRecordKmFinal && newRecordKmInicial && (
              <p style={{ marginTop: "5px", color: "#666" }}>
                Distância percorrida: {parseInt(newRecordKmFinal) - parseInt(newRecordKmInicial)} km
              </p>
            )}
          </>
        )}

        {/* Datas e horas de abertura */}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <div style={{ flex: 1 }}>
            <label>Data de abertura:</label>
            <input
              type="date"
              value={newRecordDataAbertura}
              onChange={(e) => setNewRecordDataAbertura(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Hora de abertura:</label>
            <input
              type="time"
              value={newRecordHoraAbertura}
              onChange={(e) => setNewRecordHoraAbertura(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Datas e horas de fechamento */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <div style={{ flex: 1 }}>
            <label>Data de fechamento:</label>
            <input
              type="date"
              value={newRecordDataFechamento}
              onChange={(e) => setNewRecordDataFechamento(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Hora de fechamento:</label>
            <input
              type="time"
              value={newRecordHoraFechamento}
              onChange={(e) => setNewRecordHoraFechamento(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>



        {/* Botões */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button onClick={onClose} style={cancelButtonStyle}>
            Cancelar
          </button>
          <button
            onClick={handleCreateRecord}
            disabled={loading}
            style={confirmButtonStyle(loading)}
          >
            {loading ? "Criando..." : "Criar Registro"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};
const selectStyle: React.CSSProperties = { ...inputStyle };
const cancelButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#f3f4f6",
  cursor: "pointer",
};
const confirmButtonStyle = (loading: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#fff",
  cursor: loading ? "not-allowed" : "pointer",
  opacity: loading ? 0.5 : 1,
});
