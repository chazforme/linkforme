/**
 * linksforme - 카테고리 서비스
 */

/**
 * 전체 카테고리 가져오기 (정렬순)
 */
function getCategories() {
  var sheet = getOrCreateSheet(SHEET_CATEGORIES);
  var categories = sheetToObjects(sheet);
  categories.sort(function(a, b) { return a.order - b.order; });
  return categories;
}

/**
 * 카테고리 추가
 */
function addCategory(name, emoji) {
  if (!name) return false;

  var sheet = getOrCreateSheet(SHEET_CATEGORIES);
  var categories = sheetToObjects(sheet);

  // 중복 체크
  for (var i = 0; i < categories.length; i++) {
    if (categories[i].name === name) return false;
  }

  var maxOrder = 0;
  categories.forEach(function(c) {
    if (c.order > maxOrder) maxOrder = c.order;
  });

  sheet.appendRow([name, emoji || '📌', maxOrder + 1]);
  return true;
}

/**
 * 카테고리 삭제
 */
function deleteCategory(name) {
  var sheet = getOrCreateSheet(SHEET_CATEGORIES);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}
