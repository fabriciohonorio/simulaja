import { jsPDF } from 'jspdf';

export interface SimData {
  nomeCliente: string;
  tipoAquisicao: string;
  numGrupo: string;
  credito: number;
  taxaAdm: number;
  fundoReserva: number;
  seguro: number;
  prazo: number;
  tipoParcela: string;
  parcelasContemplar: number;
  lanceDinheiroPct: number;
  lanceEmbutidoPct: number;
  lanceTotalRS: number;
  lanceTotalPct: number;
  valorParcela: number;
  creditoDisponivel: number;
  saldoDevedor: number;
  prazoRestante: number;
  parcelaPosContemp: number;
  consultorNome?: string;
}

export function gerarPDF(data: SimData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, m = 16;
  let y = 0;

  // Colors
  const navy    = [6, 15, 30] as [number, number, number];
  const navy2   = [12, 26, 48] as [number, number, number];
  const blue    = [26, 64, 128] as [number, number, number];
  const gold    = [200, 144, 10] as [number, number, number];
  const gold2   = [232, 170, 32] as [number, number, number];
  const gold3   = [245, 200, 66] as [number, number, number];
  const white   = [255, 255, 255] as [number, number, number];
  const off     = [244, 246, 251] as [number, number, number];
  const dark    = [14, 28, 53] as [number, number, number];
  const muted   = [90, 107, 133] as [number, number, number];
  const rowAlt  = [237, 242, 252] as [number, number, number];
  const lineClr = [216, 224, 238] as [number, number, number];

  // ── HEADER WITH GRADIENT (Simulated) ──
  const headerH = 48;
  for (let i = 0; i < headerH; i++) {
    const ratio = i / headerH;
    const r = Math.round(navy[0] + (navy2[0] - navy[0]) * ratio);
    const g = Math.round(navy[1] + (navy2[1] - navy[1]) * ratio);
    const b = Math.round(navy[2] + (navy2[2] - navy[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, W, 1, 'F');
  }

  // Gold decorative lines
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 1.2, 'F');
  doc.setFillColor(...gold2);
  doc.rect(0, headerH - 1.2, W, 1.2, 'F');

  // Emblem
  doc.setFillColor(...gold);
  doc.roundedRect(m, 12, 16, 16, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  const letter = data.consultorNome ? data.consultorNome.charAt(0).toUpperCase() : 'F';
  doc.text(letter, m + 8, 22.5, { align: 'center' });

  // Brand and Specialist Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...white);
  const firstName = data.consultorNome ? data.consultorNome.split(' ')[0].toUpperCase() : 'ESPECIALISTA';
  doc.text(firstName, m + 20, 20);
  doc.setTextColor(...gold2);
  doc.text('| Especialista Consórcio', m + 20 + doc.getTextWidth(firstName) + 2, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 235);
  doc.text(`CONSULTOR: ${data.consultorNome?.toUpperCase() || 'FABRÍCIO HONORIO'}`, m + 20, 26);

  const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  doc.setFontSize(7.5);
  doc.setTextColor(140, 165, 205);
  doc.text('PROPOSTA EXCLUSIVA - ' + now, W - m, 42, { align: 'right' });

  y = 60;

  const section = (title: string, icon?: string) => {
    doc.setFillColor(...blue);
    doc.rect(m, y, W - m * 2, 9, 'F');
    doc.setFillColor(...gold);
    doc.rect(m, y, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...white);
    doc.text((icon ? icon + ' ' : '') + title, m + 6, y + 6);
    y += 13;
  };

  const dataRow = (label: string, value: string | number, isAlt: boolean, valColor?: [number, number, number]) => {
    if (isAlt) {
      doc.setFillColor(...rowAlt);
      doc.rect(m, y - 1, W - m * 2, 7.5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(label, m + 4, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(valColor || dark));
    doc.text(String(value), W - m - 4, y + 4.5, { align: 'right' });
    doc.setDrawColor(...lineClr);
    doc.setLineWidth(0.1);
    doc.line(m, y + 7, W - m, y + 7);
    y += 8;
  };

  // CLIENTE (Professional Frame)
  if (data.nomeCliente) {
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.4);
    doc.roundedRect(m, y, W - m * 2, 16, 2, 2, 'D');
    doc.setFillColor(...gold);
    doc.rect(m, y, 2.5, 16, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text('SIMULAÇÃO PREPARADA PARA:', m + 6, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...navy);
    doc.text(data.nomeCliente.toUpperCase(), m + 6, y + 12);
    y += 24;
  }

  // BEM
  section('BEM ADQUIRIDO');
  dataRow('Tipo de Aquisição', data.tipoAquisicao.toUpperCase(), false);
  dataRow('Número do Grupo', data.numGrupo || '—', true);
  y += 4;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  // CARTA
  section('CARTA DE CRÉDITO');
  dataRow('Valor do Crédito', fmt(data.credito), false);
  dataRow('Taxa Adm. Total', data.taxaAdm.toFixed(2) + '%', true);
  dataRow('Fundo de Reserva', data.fundoReserva.toFixed(2) + '%', false);
  dataRow('Seguro de Vida', data.seguro.toFixed(2) + '%', true);
  dataRow('Prazo do Plano', data.prazo + ' meses', false);
  y += 4;

  // LANCE
  section('ESTRATÉGIA DE LANCE');
  dataRow('Tipo de Parcela', data.tipoParcela, false);
  dataRow('Parcelas já Quitadas', data.parcelasContemplar, true);
  dataRow('Lance em Dinheiro', data.lanceDinheiroPct.toFixed(2) + '%', false);
  dataRow('Lance Embutido', data.lanceEmbutidoPct.toFixed(2) + '%', true);
  dataRow('Total do Lance (%)', data.lanceTotalPct.toFixed(2) + '%', false, gold);
  dataRow('Total do Lance (R$)', fmt(data.lanceTotalRS), true, gold);
  y += 8;

  // RESULTS BOX (High Emphasis)
  doc.setFillColor(...navy2);
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.8);
  doc.roundedRect(m, y, W - m * 2, 65, 4, 4, 'FD');

  // Decorative header in result box
  doc.setFillColor(...gold);
  doc.rect(m, y, W - m * 2, 3, 'F');
  doc.roundedRect(m, y, W - m * 2, 3, 4, 4, 'F');

  y += 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...white);
  doc.text('RESULTADOS DA SIMULAÇÃO PÓS-CONTEMPLAÇÃO', m + 8, y);
  y += 10;

  const resultRow = (label: string, value: string, isMain: boolean) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(170, 195, 230);
    doc.text(label, m + 8, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMain ? 13.5 : 10);
    doc.setTextColor(...(isMain ? [245, 200, 66] : white));
    doc.text(value, W - m - 8, y, { align: 'right' });
    y += 10;
  };

  resultRow('Parcela Reduzida (Pré-Contemplação)', fmt(data.valorParcela), false);
  resultRow('Valor Líquido Disponível', fmt(data.creditoDisponivel), false);
  resultRow('Saldo Devedor Restante', fmt(data.saldoDevedor), false);
  resultRow('Meses Restantes', data.prazoRestante + ' parcelas', false);
  y += 2;
  resultRow('NOVA PARCELA (PÓS-CONTEMPLAÇÃO)', fmt(data.parcelaPosContemp), true);

  // ── CTA SECTION ──
  y += 12;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(m + 20, y, W - m - 20, y);
  y += 8;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text('PRÓXIMOS PASSOS PARA SUA CONQUISTA:', W / 2, y, { align: 'center' });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  const ctaText = 'Esta condição é exclusiva para o seu perfil e válida por tempo limitado. \nEntre em contato com seu especialista para garantir sua reserva.';
  doc.text(ctaText, W / 2, y, { align: 'center' });

  // FOOTER
  y = 280;
  doc.setFillColor(...navy);
  doc.rect(0, y, W, 17, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, y, W, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...gold2);
  doc.text(`${firstName} | O ESPECIALISTA EM CONSÓRCIO`, W / 2, y + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 165, 205);
  doc.text('www.oespecialistaconsorcio.com.br', W / 2, y + 14, { align: 'center' });

  doc.save(`Simulacao_${data.nomeCliente || 'Consorcio'}.pdf`);
}
