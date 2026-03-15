/**
 * linksforme - 링크 서비스
 */

/**
 * URL에서 도메인 추출
 */
function extractDomain(url) {
  try {
    var match = url.match(/^https?:\/\/(?:www\.)?([^\/\?#]+)/i);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * URL에서 OG 데이터 파싱
 */
function fetchOgData(url) {
  var result = {
    ogImage: '',
    ogTitle: '',
    favicon: '',
    domain: extractDomain(url)
  };

  result.favicon = 'https://' + result.domain + '/favicon.ico';

  try {
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      },
      validateHttpsCertificates: false
    });

    var html = response.getContentText();

    // og:image 파싱 (두 가지 속성 순서 대응)
    var imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                   html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (imgMatch) {
      result.ogImage = imgMatch[1];
    }

    // og:title 파싱
    var titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (titleMatch) {
      result.ogTitle = titleMatch[1];
    }

    // og:title 없으면 <title> 태그
    if (!result.ogTitle) {
      var pageTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (pageTitleMatch) {
        result.ogTitle = pageTitleMatch[1].trim();
      }
    }

  } catch (e) {
    // fetch 실패 시 기본값 유지
  }

  return result;
}

/**
 * URL 기반 자동 태그 추천
 */
function suggestTags(url) {
  var domain = extractDomain(url);
  var mapJson = getSetting('DOMAIN_TAG_MAP');
  var tags = [];

  if (mapJson) {
    var map = JSON.parse(mapJson);
    for (var key in map) {
      if (domain.indexOf(key) !== -1) {
        tags.push(map[key]);
        break;
      }
    }
  }

  return tags;
}

/**
 * 전체 링크 가져오기 (최신순)
 */
function getLinks() {
  var sheet = getOrCreateSheet(SHEET_LINKS);
  var links = sheetToObjects(sheet);
  links.reverse(); // 최신순
  return links;
}

/**
 * 링크 추가
 */
function addLink(params) {
  var url = params.url || '';
  var title = params.title || '';
  var category = params.category || '기타';
  var tags = params.tags || '';
  var memo = params.memo || '';

  if (!url) return { success: false, error: 'URL이 필요합니다' };

  // OG 데이터 가져오기
  var ogData = fetchOgData(url);

  // 자동 태그 추가
  var autoTags = suggestTags(url);
  var allTags = tags ? tags.split(',') : [];
  autoTags.forEach(function(t) {
    if (allTags.indexOf(t) === -1) allTags.push(t);
  });

  var id = generateId();
  var now = new Date().toISOString();

  var row = [
    id,
    url,
    title || ogData.ogTitle || '',
    category,
    allTags.join(','),
    ogData.ogImage,
    ogData.favicon,
    now,
    memo,
    ogData.domain
  ];

  var sheet = getOrCreateSheet(SHEET_LINKS);
  sheet.appendRow(row);

  return {
    id: id,
    url: url,
    title: row[2],
    category: category,
    tags: allTags.join(','),
    thumbnail: ogData.ogImage,
    favicon: ogData.favicon,
    createdAt: now,
    memo: memo,
    domain: ogData.domain
  };
}

/**
 * 링크 삭제
 */
function deleteLink(id) {
  var sheet = getOrCreateSheet(SHEET_LINKS);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * OG 데이터 + 태그 추천 반환 (프론트에서 미리보기용)
 */
function getSuggestData(url) {
  var ogData = fetchOgData(url);
  var tags = suggestTags(url);

  return {
    ogImage: ogData.ogImage,
    ogTitle: ogData.ogTitle,
    favicon: ogData.favicon,
    domain: ogData.domain,
    suggestedTags: tags
  };
}
