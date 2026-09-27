/**
 * CONTA-AI — backend em Google Apps Script
 * Usa uma planilha Google Sheets como banco de dados.
 *
 * COMO INSTALAR (uma vez só):
 * 1. Crie uma planilha nova no Google Sheets (pode chamar de "Conta-AI - Dados").
 * 2. Menu Extensões > Apps Script.
 * 3. Apague o conteúdo de "Código.gs" e cole todo este arquivo no lugar.
 * 4. No topo do editor, escolha a função "configurarPlanilha" no seletor de funções
 *    e clique em Executar (ícone ▶). Autorize o acesso quando pedir.
 *    Isso cria a aba "Registros" com os cabeçalhos certos.
 * 5. Clique em Implantar > Nova implantação.
 *    - Tipo: "App da Web".
 *    - Executar como: "Eu" (sua conta).
 *    - Quem pode acessar: "Qualquer pessoa".
 * 6. Clique em Implantar, autorize de novo se pedir, e copie a URL do app da web
 *    (termina em /exec).
 * 7. Cole essa URL na constante DEFAULT_API_URL do arquivo index.html do Conta-AI.
 *
 * Sempre que você editar este código depois, gere uma NOVA implantação
 * (ou "Gerenciar implantações" > editar > Nova versão) para as mudanças valerem.
 */

var SHEET_NAME = "Registros";
var CABECALHOS = ["id", "timestamp", "tipo", "patrimonio", "patrimonio_modulo", "observacao", "responsavel", "lat", "lng", "precisao"];

function configurarPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, CABECALHOS.length).setValues([CABECALHOS]);
  sheet.setFrozenRows(1);
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
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var sheet = getSheet_();
    var range = sheet.getDataRange();
    var values = range.getValues();
    if (values.length < 2) return saida_({ ok: true, registros: [] });

    var headers = values[0];
    var registros = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) continue; // pula linhas vazias
      var obj = {};
      for (var c = 0; c < headers.length; c++) {
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
    var id = Utilities.getUuid();
    var timestamp = new Date();

    sheet.appendRow([
      id,
      timestamp,
      body.tipo || "",
      body.patrimonio || "",
      body.patrimonioModulo || "",
      body.observacao || "",
      body.responsavel || "",
      body.lat,
      body.lng,
      body.precisao || ""
    ]);

    return saida_({ ok: true, id: id, timestamp: timestamp.toISOString() });
  } catch (err) {
    return saida_({ ok: false, error: String(err) });
  }
}
