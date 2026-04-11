import { describe, it, expect } from "vitest";
import { getLoteriaStatus } from "./consortium-logic";

describe("getLoteriaStatus", () => {
  it("retorna null se loteriaFederal estiver vazio", () => {
    expect(getLoteriaStatus("", "100", "5290", "MAGALU")).toBeNull();
  });

  it("identifica vencedor corretamente", () => {
    // lotId % participants === clientCota
    const result = getLoteriaStatus("1800", "1800", "5290", "MAGALU");
    expect(result?.isWinner).toBe(true);
    expect(result?.diff).toBe(0);
  });

  it("identifica cota próxima (diff <= 10)", () => {
    const result = getLoteriaStatus("1805", "1800", "5290", "MAGALU");
    expect(result?.isClose).toBe(true);
  });

  it("usa regra especial para Ademicon Veículo (módulo 10000)", () => {
    // Para Ademicon veículo, usa lotId % 10000 como base
    const result = getLoteriaStatus("21800", "1800", "5290", "ADEMICON", "veiculos");
    expect(result?.isWinner).toBe(true);
  });

  it("usa participants padrão (600) quando grupo não está no mapa", () => {
    const result = getLoteriaStatus("600", "600", "9999", "MAGALU");
    expect(result?.participants).toBe(600);
    expect(result?.isWinner).toBe(true);
  });
});
