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
 * 카테고리 순서 변경
 * @param {string} orderedNames - 쉼표로 구분된 카테고리 이름 (새 순서)
 */
function reorderCategories(orderedNames) {
  if (!orderedNames) return false;

  var names = orderedNames.split(',');
  var sheet = getOrCreateSheet(SHEET_CATEGORIES);
  var data = sheet.getDataRange().getValues();
  var header = data[0];
  var orderCol = header.indexOf('order');
  if (orderCol === -1) orderCol = 2; // fallback: 3번째 열

  for (var i = 1; i < data.length; i++) {
    var catName = data[i][0];
    var newOrder = names.indexOf(catName);
    if (newOrder !== -1) {
      sheet.getRange(i + 1, orderCol + 1).setValue(newOrder + 1);
    }
  }
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
