/**
 * linksforme - Web App 라우터
 */

function doGet(e) {
  var params = e ? e.parameter : {};

  try {
    // action 기반 라우팅 (쓰기 작업)
    if (params.action) {
      switch (params.action) {
        case 'add_link':
          var link = addLink(params);
          return buildSuccess(link);

        case 'delete_link':
          var deleted = deleteLink(params.id);
          return deleted ? buildSuccess({ deleted: true }) : buildError('링크를 찾을 수 없습니다');

        case 'suggest_tags':
          var suggest = getSuggestData(params.url);
          return buildSuccess(suggest);

        case 'add_category':
          var added = addCategory(params.name, params.emoji);
          return added ? buildSuccess({ added: true }) : buildError('카테고리 추가 실패 (중복 또는 빈 이름)');

        case 'delete_category':
          var catDeleted = deleteCategory(params.name);
          return catDeleted ? buildSuccess({ deleted: true }) : buildError('카테고리를 찾을 수 없습니다');

        default:
          return buildError('알 수 없는 action: ' + params.action);
      }
    }

    // type 기반 라우팅 (읽기 작업)
    var type = params.type || 'all';

    switch (type) {
      case 'all':
        return buildSuccess({
          links: getLinks(),
          categories: getCategories()
        });

      case 'links':
        return buildSuccess(getLinks());

      case 'categories':
        return buildSuccess(getCategories());

      case 'ping':
        return buildSuccess({ status: 'ok', timestamp: new Date().toISOString() });

      default:
        return buildError('알 수 없는 type: ' + type);
    }

  } catch (error) {
    return buildError(error.toString());
  }
}
