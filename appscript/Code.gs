/**
 * linksforme - 공통 유틸리티
 */

// 시트 이름 상수
var SHEET_LINKS = '링크';
var SHEET_CATEGORIES = '카테고리';
var SHEET_SETTINGS = '설정';

/**
 * 스프레드시트 가져오기 (현재 바인딩된 스프레드시트)
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 시트 가져오기 (없으면 생성)
 */
function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * JSON 응답 빌더
 */
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 에러 응답 빌더
 */
function buildError(message) {
  return buildResponse({ success: false, error: message });
}

/**
 * 성공 응답 빌더
 */
function buildSuccess(data) {
  return buildResponse({ success: true, data: data });
}

/**
 * UUID 생성 (타임스탬프 + 랜덤)
 */
function generateId() {
  return new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * 시트 데이터를 객체 배열로 변환
 */
function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }

  return result;
}

/**
 * 설정값 가져오기
 */
function getSetting(key) {
  var sheet = getOrCreateSheet(SHEET_SETTINGS);
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === key) return data[i][1];
  }
  return null;
}

/**
 * 초기 설정 데이터 세팅 (최초 1회)
 */
function initializeSheets() {
  // 링크 시트 헤더
  var linkSheet = getOrCreateSheet(SHEET_LINKS);
  if (linkSheet.getLastRow() === 0) {
    linkSheet.appendRow(['id', 'url', 'title', 'category', 'tags', 'thumbnail', 'favicon', 'createdAt', 'memo', 'domain']);
  }

  // 카테고리 시트 헤더 + 기본 카테고리
  var catSheet = getOrCreateSheet(SHEET_CATEGORIES);
  if (catSheet.getLastRow() === 0) {
    catSheet.appendRow(['name', 'emoji', 'order']);
    catSheet.appendRow(['영감', '💡', 1]);
    catSheet.appendRow(['개발', '💻', 2]);
    catSheet.appendRow(['디자인', '🎨', 3]);
    catSheet.appendRow(['아티클', '📝', 4]);
    catSheet.appendRow(['기타', '📌', 5]);
  }

  // 설정 시트
  var settingSheet = getOrCreateSheet(SHEET_SETTINGS);
  if (settingSheet.getLastRow() === 0) {
    settingSheet.appendRow(['key', 'value']);
    var domainTagMap = JSON.stringify({
      'instagram.com': '인스타',
      'threads.net': '스레드',
      'youtube.com': '유튜브',
      'youtu.be': '유튜브',
      'brunch.co.kr': '브런치',
      'blog.naver.com': '네이버블로그',
      'tistory.com': '티스토리',
      'velog.io': '벨로그',
      'twitter.com': '트위터',
      'x.com': '트위터',
      'pinterest.com': '핀터레스트',
      'medium.com': '미디엄'
    });
    settingSheet.appendRow(['DOMAIN_TAG_MAP', domainTagMap]);
  }
}
