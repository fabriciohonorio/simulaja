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

  // Colors - Smoother, more professional palette
  const darkBg  = [15, 23, 42] as [number, number, number]; // Slate 900
  const darkBg2 = [30, 41, 59] as [number, number, number]; // Slate 800
  const blue    = [26, 64, 128] as [number, number, number];
  const gold    = [200, 144, 10] as [number, number, number];
  const gold2   = [232, 170, 32] as [number, number, number];
  const gold3   = [245, 200, 66] as [number, number, number];
  const white   = [255, 255, 255] as [number, number, number];
  const off     = [244, 246, 251] as [number, number, number];
  const muted   = [90, 107, 133] as [number, number, number];
  const rowAlt  = [237, 242, 252] as [number, number, number];
  const lineClr = [216, 224, 238] as [number, number, number];

  // ── HEADER WITH SMOOTH GRADIENT ──
  const headerH = 55;
  for (let i = 0; i < headerH; i++) {
    const ratio = i / headerH;
    const r = Math.round(darkBg[0] + (darkBg2[0] - darkBg[0]) * ratio);
    const g = Math.round(darkBg[1] + (darkBg2[1] - darkBg[1]) * ratio);
    const b = Math.round(darkBg[2] + (darkBg2[2] - darkBg[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, i, W, 1, 'F');
  }

  // Accent Gold Bar (Thinner and more elegant)
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 0.8, 'F');
  doc.setFillColor(...gold2);
  doc.rect(0, headerH - 0.8, W, 0.8, 'F');

  // BRAND LOGO (Text-based but styled)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...white);
  doc.text('O Especialista', m, 22);
  doc.setTextColor(...gold2);
  doc.text('Consórcio', m + doc.getTextWidth('O Especialista') + 3, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 165, 205);
  doc.text('WWW.OESPECIALISTACONSORCIO.COM.BR', m, 28);

  const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  doc.setFontSize(8);
  doc.setTextColor(140, 165, 205);
  doc.text('PROPOSTA EXCLUSIVA - ' + now, W - m, 45, { align: 'right' });

  y = 65;

  const section = (title: string, icon?: string) => {
    // Section Header - Darker and softer
    doc.setFillColor(...darkBg);
    doc.rect(m, y, W - m * 2, 8, 'F');
    doc.setFillColor(...gold);
    doc.rect(m, y, 1.5, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...white);
    doc.text((icon ? icon + ' ' : '') + title.toUpperCase(), m + 5, y + 5.2);
    y += 11;
  };

  const dataRow = (label: string, value: string | number, isAlt: boolean, valColor?: [number, number, number]) => {
    if (isAlt) {
      doc.setFillColor(250, 251, 253);
      doc.rect(m, y - 0.5, W - m * 2, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text(label, m + 3, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(valColor || darkBg));
    doc.text(String(value), W - m - 3, y + 4, { align: 'right' });
    doc.setDrawColor(...lineClr);
    doc.setLineWidth(0.05);
    doc.line(m, y + 6.5, W - m, y + 6.5);
    y += 7.5;
  };

  // CLIENTE (Professional Frame)
  if (data.nomeCliente) {
    doc.setDrawColor(...lineClr);
    doc.setLineWidth(0.2);
    doc.roundedRect(m, y, W - m * 2, 14, 1.5, 1.5, 'D');
    doc.setFillColor(...gold);
    doc.rect(m, y, 1.5, 14, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text('SIMULAÇÃO PREPARADA PARA:', m + 5, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...darkBg);
    doc.text(data.nomeCliente.toUpperCase(), m + 5, y + 10.5);
    y += 20;
  }

  // BEM
  section('Bem Selecionado');
  dataRow('Tipo de Aquisição', data.tipoAquisicao.toUpperCase(), false);
  dataRow('Número do Grupo', data.numGrupo || '—', true);
  y += 4;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  // CARTA
  section('Condições do Plano');
  dataRow('Valor do Crédito', fmt(data.credito), false);
  dataRow('Taxa de Adm. Total', data.taxaAdm.toFixed(2) + '%', true);
  dataRow('Fundo de Reserva', data.fundoReserva.toFixed(2) + '%', false);
  dataRow('Seguro do Plano', data.seguro.toFixed(2) + '%', true);
  dataRow('Prazo Original', data.prazo + ' meses', false);
  y += 4;

  // LANCE
  section('Estratégia de Lance');
  dataRow('Tipo de Parcela', data.tipoParcela, false);
  dataRow('Parcelas Quitadas', data.parcelasContemplar, true);
  dataRow('Lance Dinheiro', data.lanceDinheiroPct.toFixed(2) + '%', false);
  dataRow('Lance Embutido', data.lanceEmbutidoPct.toFixed(2) + '%', true);
  dataRow('Percentual de Lance', data.lanceTotalPct.toFixed(2) + '%', false, gold);
  dataRow('Valor Total do Lance', fmt(data.lanceTotalRS), true, gold);
  y += 8;

  // RESULTS BOX (Shadow Effect simulated with darker color)
  doc.setFillColor(...darkBg);
  doc.roundedRect(m, y, W - m * 2, 60, 3, 3, 'F');

  // Inner border
  doc.setDrawColor(...gold2);
  doc.setLineWidth(0.4);
  doc.roundedRect(m + 1, y + 1, W - m * 2 - 2, 58, 2.5, 2.5, 'D');

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gold3);
  doc.text('RESUMO FINANCEIRO PÓS-CONTEMPLAÇÃO', W / 2, y, { align: 'center' });
  y += 10;

  const resultRow = (label: string, value: string, isMain: boolean) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 235);
    doc.text(label, m + 8, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMain ? 12 : 9);
    doc.setTextColor(...(isMain ? gold3 : white));
    doc.text(value, W - m - 8, y, { align: 'right' });
    y += 9;
  };

  resultRow('Parcela Atual (Reduzida)', fmt(data.valorParcela), false);
  resultRow('Crédito Disponível (Líquido)', fmt(data.creditoDisponivel), false);
  resultRow('Saldo Devedor Projetado', fmt(data.saldoDevedor), false);
  resultRow('Prazo Restante', data.prazoRestante + ' meses', false);
  y += 2;
  resultRow('NOVA PARCELA MENSAL', fmt(data.parcelaPosContemp), true);

  // ── CTA SECTION ──
  y += 18;
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(9.5);
  doc.setTextColor(...darkBg);
  doc.text('PRÓXIMOS PASSOS:', m, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  const ctaText = 'Esta simulação visa auxiliar em seu planejamento e está sujeita às regras da Administradora. \nPara garantir estas condições, entre em contato com seu especialista agora mesmo.';
  doc.text(ctaText, m, y);

  // FOOTER
  y = 282;
  doc.setFillColor(...darkBg);
  doc.rect(0, y, W, 15, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, y, W, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...white);
  doc.text('FABRICIO HONÓRIO - ESPECIALISTA CONSÓRCIO', W / 2, y + 8.5, { align: 'center' });

  doc.save(`Simulacao_${data.nomeCliente || 'Cliente'}.pdf`);
}
