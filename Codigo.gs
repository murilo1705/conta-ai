/**
 * CONTA-AI — backend em Google Apps Script
 * Usa uma planilha Google Sheets como banco de dados.
 *
 * COMO INSTALAR / ATUALIZAR:
 * 1. Na planilha, menu Extensões > Apps Script.
 * 2. Apague o conteúdo de "Código.gs" e cole todo este arquivo no lugar.
 * 3. Salve (Ctrl+S).
 * 4. Escolha a função "configurarPlanilha" no seletor e clique em Executar.
 *    Isso cria/atualiza os cabeçalhos da aba "Registros".
 * 5. Implantar > Gerenciar implantações > ícone de lápis (editar) >
 *    Versão: "Nova versão" > Implantar.
 *    (A URL continua a mesma — não precisa mexer no app.)
 *
 * IMPORTANTE: a gravação usa os nomes dos cabeçalhos, então a ordem
 * das colunas pode mudar sem quebrar os registros antigos.
 */

var SHEET_NAME = "Registros";
var CABECALHOS = [
  "id",
  "timestamp",
  "tipo",
  "patrimonio",
  "patrimonio_modulo",
  "patrimonio_ac",
  "observacao",
  "responsavel",
  "lat",
  "lng",
  "precisao",
  "ajuste_manual",
  "endereco",
  "link_maps"
];

function configurarPlanilha() {
  var sheet = getSheet_();
  sheet.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, CABECALHOS.length).setFontWeight("bold");
  SpreadsheetApp.getActiveSpreadsheet().toast("Cabeçalhos atualizados.", "Conta-AI", 5);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function saida_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Busca o endereço aproximado a partir das coordenadas.
 * Se falhar (sem internet no servidor, limite de uso, área sem
 * mapeamento), devolve string vazia — nunca quebra o registro.
 */
function enderecoDe_(lat, lng) {
  try {
    var url = "https://nominatim.openstreetmap.org/reverse"
      + "?format=json&zoom=18&addressdetails=1&accept-language=pt-BR"
      + "&lat=" + encodeURIComponent(lat)
      + "&lon=" + encodeURIComponent(lng);
    var resp = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { "User-Agent": "Conta-AI (inventario de campo)" }
    });
    if (resp.getResponseCode() !== 200) return "";
    var j = JSON.parse(resp.getContentText());
    return j && j.display_name ? j.display_name : "";
  } catch (e) {
    return "";
  }
}

function doGet(e) {
  try {
    var sheet = getSheet_();
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return saida_({ ok: true, registros: [] });

    var headers = values[0];
    var registros = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue;
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
        if (!headers[c]) continue;
        var val = row[c];
        if (val instanceof Date) val = val.toISOString();
        obj[headers[c]] = val;
      }
      registros.push(obj);
    }
    return saida_({ ok: true, registros: registros });
  } catch (err) {
    return saida_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.tipo || !body.patrimonio || body.lat == null || body.lng == null) {
      return saida_({ ok: false, error: "campos_obrigatorios_faltando" });
    }

    var sheet = getSheet_();
    var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];

    // Se a planilha ainda não tem cabeçalhos, cria agora.
    if (!headers[0]) {
      sheet.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
      sheet.setFrozenRows(1);
      headers = CABECALHOS.slice();
    }

    var id = Utilities.getUuid();
    var timestamp = new Date();
    var lat = body.lat;
    var lng = body.lng;

    var dados = {
      id: id,
      timestamp: timestamp,
      tipo: body.tipo || "",
      patrimonio: body.patrimonio || "",
      patrimonio_modulo: body.patrimonioModulo || "",
      patrimonio_ac: body.patrimonioAC || "",
      observacao: body.observacao || "",
      responsavel: body.responsavel || "",
      lat: lat,
      lng: lng,
      precisao: body.precisao || "",
      ajuste_manual: body.ajusteManual ? "sim" : "nao",
      endereco: enderecoDe_(lat, lng),
      link_maps: "https://www.google.com/maps?q=" + lat + "," + lng
    };

    // Monta a linha na ordem dos cabeçalhos que a planilha realmente tem.
    var linha = [];
    for (var c = 0; c < headers.length; c++) {
      var nome = headers[c];
      linha.push(Object.prototype.hasOwnProperty.call(dados, nome) ? dados[nome] : "");
    }
    sheet.appendRow(linha);

    return saida_({ ok: true, id: id, timestamp: timestamp.toISOString() });
  } catch (err) {
    return saida_({ ok: false, error: String(err) });
  }
}
