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
  const white   = [255, 255, 255] as [number, number, number];
  const off     = [244, 246, 251] as [number, number, number];
  const dark    = [14, 28, 53] as [number, number, number];
  const muted   = [90, 107, 133] as [number, number, number];
  const green   = [14, 138, 74] as [number, number, number];
  const rowAlt  = [237, 242, 252] as [number, number, number];
  const lineClr = [216, 224, 238] as [number, number, number];

  // HEADER
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 44, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, 0, W, 2.5, 'F');
  doc.rect(0, 41.5, W, 2.5, 'F');

  // Emblem circle
  doc.setFillColor(...gold);
  doc.roundedRect(m, 9, 14, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navy);
  const letter = data.consultorNome ? data.consultorNome.charAt(0).toUpperCase() : 'C';
  doc.text(letter, m + 7, 18.5, { align: 'center' });

  // Brand name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...white);
  const brandTitle = data.consultorNome ? data.consultorNome.split(' ')[0].toUpperCase() : 'CONTEMPLAR';
  doc.text(brandTitle, m + 18, 17);
  doc.setTextColor(...gold2);
  doc.text('| Especialista Consórcio', m + 18 + doc.getTextWidth(brandTitle) + 2, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 200, 235);
  doc.text('SIMULADOR DE LANCE PROFISSIONAL', m + 18, 23);

  const now = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
  doc.setFontSize(7);
  doc.setTextColor(140, 165, 205);
  doc.text('Data: ' + now, W - m, 37, { align: 'right' });

  y = 52;

  const section = (title: string, icon?: string) => {
    doc.setFillColor(...blue);
    doc.rect(m, y, W - m * 2, 8.5, 'F');
    doc.setFillColor(...gold);
    doc.rect(m, y, 3, 8.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...white);
    doc.text((icon ? icon + ' ' : '') + title, m + 6, y + 5.8);
    y += 12;
  };

  const dataRow = (label: string, value: string | number, isAlt: boolean, valColor?: [number, number, number]) => {
    if (isAlt) {
      doc.setFillColor(...rowAlt);
      doc.rect(m, y - 1, W - m * 2, 7, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text(label, m + 4, y + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(valColor || dark));
    doc.text(String(value), W - m - 4, y + 4, { align: 'right' });
    doc.setDrawColor(...lineClr);
    doc.setLineWidth(0.1);
    doc.line(m, y + 6, W - m, y + 6);
    y += 7;
  };

  // CLIENTE
  if (data.nomeCliente) {
    doc.setFillColor(...rowAlt);
    doc.setDrawColor(...blue);
    doc.setLineWidth(0.5);
    doc.roundedRect(m, y, W - m * 2, 14, 3, 3, 'FD');
    doc.setFillColor(...gold);
    doc.roundedRect(m, y, 3, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...muted);
    doc.text('CLIENTE', m + 6, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...navy);
    doc.text(data.nomeCliente, m + 6, y + 11.5);
    y += 20;
  }

  // BEM
  section('BEM ADQUIRIDO');
  dataRow('Tipo de Aquisição', data.tipoAquisicao.toUpperCase(), false);
  dataRow('Número do Grupo', data.numGrupo || '—', true);
  y += 4;

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  // CARTA
  section('CARTA DE CRÉDITO');
  dataRow('Crédito', fmt(data.credito), false);
  dataRow('Taxa Administrativa', data.taxaAdm.toFixed(2) + '%', true);
  dataRow('Fundo de Reserva', data.fundoReserva.toFixed(2) + '%', false);
  dataRow('Seguro', data.seguro.toFixed(2) + '%', true);
  dataRow('Prazo', data.prazo + ' meses', false);
  y += 4;

  // LANCE
  section('SIMULAÇÃO DE LANCE');
  dataRow('Tipo de Parcela', data.tipoParcela, false);
  dataRow('Parcelas pagas/Até Contemplar', data.parcelasContemplar, true);
  dataRow('Lance Dinheiro', data.lanceDinheiroPct.toFixed(2) + '%', false);
  dataRow('Lance Embutido', data.lanceEmbutidoPct.toFixed(2) + '%', true);
  dataRow('Total Lance (%)', data.lanceTotalPct.toFixed(2) + '%', false, gold);
  dataRow('Total Lance (R$)', fmt(data.lanceTotalRS), true, gold);
  y += 6;

  // RESULTS BOX
  doc.setFillColor(...navy2);
  doc.setDrawColor(...blue);
  doc.setLineWidth(0.6);
  doc.roundedRect(m, y, W - m * 2, 62, 4, 4, 'FD');

  doc.setFillColor(...gold);
  doc.rect(m, y, W - m * 2, 2.5, 'F');
  doc.roundedRect(m, y, W - m * 2, 2.5, 4, 4, 'F');

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...white);
  doc.text('RESULTADOS DA SIMULAÇÃO', m + 8, y);
  y += 8;

  const resultRow = (label: string, value: string, isMain: boolean) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 185, 220);
    doc.text(label, m + 8, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isMain ? 12 : 9.5);
    doc.setTextColor(...(isMain ? [245, 200, 66] : white));
    doc.text(value, W - m - 6, y, { align: 'right' });
    y += 9;
  };

  resultRow('Valor da Parcela (Pré-Contemplação)', fmt(data.valorParcela), false);
  resultRow('Crédito Disponível', fmt(data.creditoDisponivel), false);
  resultRow('Saldo Devedor', fmt(data.saldoDevedor), false);
  resultRow('Prazo Restante', data.prazoRestante + ' x', false);
  resultRow('Parcela Pós-Contemplação', fmt(data.parcelaPosContemp), true);

  // FOOTER
  y = 280;
  doc.setFillColor(...navy);
  doc.rect(0, y, W, 17, 'F');
  doc.setFillColor(...gold);
  doc.rect(0, y, W, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...gold2);
  doc.text(`${brandTitle} | Especialista Consórcio`, W / 2, y + 9, { align: 'center' });

  doc.save('simulacao_consorcio.pdf');
}
