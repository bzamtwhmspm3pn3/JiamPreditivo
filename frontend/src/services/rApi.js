import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/r";

export const getModelosDisponiveis = async () => {
  const response = await axios.get(`${API_BASE_URL}/modelos/disponiveis`);
  return response.data.modelos || [];
};

export const executarModelo = async (tipo, dados, formula) => {
  const response = await axios.post(`${API_BASE_URL}/modelos`, {
    tipo,
    dados,
    formula
  });
  return response.data;
};
